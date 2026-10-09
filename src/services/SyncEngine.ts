/**
 * SyncEngine – the offline queue. Plain TypeScript (no React) so it can be
 * unit-tested with fake storage, a fake transport and fake timers.
 *
 * Rules:
 *  - Every capture is persisted before it is considered saved; new ones start 'pending'.
 *  - Only one flush runs at a time. Requests made during a flush queue one more pass.
 *  - Items upload one at a time, oldest first.
 *  - A failed upload goes back to 'pending' with exponential back-off, and to
 *    'error' after `maxAttempts` (or immediately if the server says it's not retryable).
 *  - A failure while the device is offline doesn't count as an attempt.
 *  - Reconnecting (or tapping "Sync now") retries everything, ignoring back-off,
 *    including 'error' items.
 *  - Anything left 'syncing' by a killed app is reset to 'pending' on start.
 */
import {FieldCapture} from '../types';
import {CaptureStore} from './StorageService';
import {CaptureTransport, SyncError} from './SyncService';

export interface SyncSnapshot {
  captures: FieldCapture[];
  isOnline: boolean;
  isSyncing: boolean;
}

export interface SyncEngineOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_OPTIONS: SyncEngineOptions = {
  maxAttempts: 3,
  baseDelayMs: 2000,
  maxDelayMs: 60_000,
};

export class SyncEngine {
  private captures: FieldCapture[] = [];
  private isOnline = false;
  private isSyncing = false;
  private snapshot: SyncSnapshot = {captures: [], isOnline: false, isSyncing: false};
  private listeners = new Set<() => void>();

  private ready: Promise<void> | null = null;
  private stopped = false;
  private flushing: Promise<void> | null = null;
  private rerun: {force: boolean} | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly options: SyncEngineOptions;

  constructor(
    private readonly store: CaptureStore,
    private readonly transport: CaptureTransport,
    options: Partial<SyncEngineOptions> = {},
  ) {
    this.options = {...DEFAULT_OPTIONS, ...options};
  }

  // ── Lifecycle ──────────────────────────────────────────────────────

  start = (): Promise<void> => {
    this.stopped = false;
    if (!this.ready) {
      this.ready = this.load();
    }
    return this.ready.then(() => {
      this.scheduleRetry();
      if (this.isOnline) {
        this.flush(true);
      }
    });
  };

  stop = (): void => {
    this.stopped = true;
    this.clearRetryTimer();
  };

  private async load() {
    const saved = await this.store.getAll();
    const stuck = saved.some(c => c.syncStatus === 'syncing');
    this.captures = saved.map(c =>
      c.syncStatus === 'syncing' ? {...c, syncStatus: 'pending'} : c,
    );
    this.emit();
    if (stuck) {
      await this.persist();
    }
  }

  // ── Subscription (shaped for useSyncExternalStore) ─────────────────

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): SyncSnapshot => this.snapshot;

  // ── Public actions ─────────────────────────────────────────────────

  setOnline = (online: boolean): void => {
    if (online === this.isOnline) {
      return;
    }
    this.isOnline = online;
    this.emit();
    if (online) {
      this.flush(true);
    } else {
      this.clearRetryTimer();
    }
  };

  add = async (capture: FieldCapture): Promise<void> => {
    await this.ensureLoaded();
    this.captures = [
      {...capture, syncStatus: 'pending', retryCount: 0, nextRetryAt: undefined},
      ...this.captures,
    ];
    this.emit();
    await this.persist();
    this.flush();
  };

  retry = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    const found = this.patch(id, {
      syncStatus: 'pending',
      retryCount: 0,
      nextRetryAt: undefined,
    });
    if (found) {
      await this.persist();
      this.flush();
    }
  };

  remove = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    this.captures = this.captures.filter(c => c.id !== id);
    this.emit();
    await this.persist();
  };

  /**
   * Upload everything that's due. `force` ignores back-off and includes
   * 'error' items (used on reconnect and for the manual "Sync now").
   */
  flush = (force = false): Promise<void> => {
    if (this.flushing) {
      this.rerun = {force: force || !!this.rerun?.force};
      return this.flushing;
    }
    this.flushing = this.drain(force);
    return this.flushing;
  };

  // ── Queue processing ───────────────────────────────────────────────

  private async drain(force: boolean) {
    try {
      await this.ensureLoaded();
      let pass: {force: boolean} | null = {force};
      while (pass) {
        this.rerun = null;
        await this.processQueue(pass.force);
        pass = this.rerun;
      }
    } finally {
      this.flushing = null;
      this.setSyncing(false);
      this.scheduleRetry();
    }
  }

  private async processQueue(force: boolean) {
    const attempted = new Set<string>();
    let next = this.nextDue(force, attempted);
    while (next && this.isOnline && !this.stopped) {
      attempted.add(next.id);
      this.setSyncing(true);
      await this.syncOne(next.id);
      next = this.nextDue(force, attempted);
    }
  }

  private nextDue(force: boolean, attempted: Set<string>): FieldCapture | undefined {
    const now = Date.now();
    // Stored newest-first; upload oldest-first.
    for (let i = this.captures.length - 1; i >= 0; i--) {
      const c = this.captures[i];
      if (attempted.has(c.id)) {
        continue;
      }
      const due =
        c.syncStatus === 'pending' &&
        (force || !c.nextRetryAt || Date.parse(c.nextRetryAt) <= now);
      if (due || (force && c.syncStatus === 'error')) {
        return c;
      }
    }
    return undefined;
  }

  private async syncOne(id: string) {
    this.patch(id, {syncStatus: 'syncing'});
    await this.persist();
    const capture = this.find(id);
    if (!capture) {
      return;
    }

    try {
      await this.transport.uploadCapture(capture);
      this.patch(id, {
        syncStatus: 'synced',
        syncedAt: new Date().toISOString(),
        errorMessage: undefined,
        nextRetryAt: undefined,
      });
    } catch (err: unknown) {
      const current = this.find(id);
      if (!current) {
        return; // deleted mid-upload
      }
      const message = err instanceof Error ? err.message : 'Unknown error';

      if (!this.isOnline) {
        // Lost signal mid-upload: not the server's fault, don't burn an attempt.
        this.patch(id, {syncStatus: 'pending', errorMessage: message});
      } else {
        const retryable = !(err instanceof SyncError) || err.retryable;
        const retryCount = current.retryCount + 1;
        const exhausted = !retryable || retryCount >= this.options.maxAttempts;
        this.patch(id, {
          syncStatus: exhausted ? 'error' : 'pending',
          errorMessage: message,
          retryCount,
          nextRetryAt: exhausted
            ? undefined
            : new Date(Date.now() + this.backoffMs(retryCount)).toISOString(),
        });
      }
    }
    await this.persist();
  }

  /** 2s, 4s, 8s… capped, with up to 20% jitter so devices don't retry in lockstep. */
  private backoffMs(attempt: number): number {
    const {baseDelayMs, maxDelayMs} = this.options;
    const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
    return Math.round(delay * (1 + Math.random() * 0.2));
  }

  private scheduleRetry() {
    this.clearRetryTimer();
    if (!this.isOnline || this.stopped) {
      return;
    }
    const times = this.captures
      .filter(c => c.syncStatus === 'pending' && c.nextRetryAt)
      .map(c => Date.parse(c.nextRetryAt!));
    if (times.length === 0) {
      return;
    }
    const wait = Math.max(0, Math.min(...times) - Date.now());
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.flush();
    }, wait);
  }

  private clearRetryTimer() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  // ── State helpers ──────────────────────────────────────────────────

  private ensureLoaded(): Promise<void> {
    if (!this.ready) {
      this.ready = this.load();
    }
    return this.ready;
  }

  private find(id: string) {
    return this.captures.find(c => c.id === id);
  }

  /** Apply a patch in memory and notify. Returns false if the capture no longer exists. */
  private patch(id: string, changes: Partial<FieldCapture>): boolean {
    let found = false;
    this.captures = this.captures.map(c => {
      if (c.id !== id) {
        return c;
      }
      found = true;
      return {...c, ...changes};
    });
    if (found) {
      this.emit();
    }
    return found;
  }

  private persist(): Promise<void> {
    return this.store.saveAll(this.captures).catch(err => {
      console.warn('[SyncEngine] failed to persist captures', err);
    });
  }

  private setSyncing(syncing: boolean) {
    if (syncing !== this.isSyncing) {
      this.isSyncing = syncing;
      this.emit();
    }
  }

  private emit() {
    this.snapshot = {
      captures: this.captures,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
    this.listeners.forEach(l => l());
  }
}
