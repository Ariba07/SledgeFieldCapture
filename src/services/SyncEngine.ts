/**
 * SyncEngine – the offline queue. Plain TypeScript (no React) so it can be
 * unit-tested with fake storage, a fake transport and fake timers.
 *
 * Rules:
 *  - Every capture is persisted before it is considered saved; new ones start 'pending'.
 *  - Only one flush runs at a time. Requests made during a flush queue one more pass.
 *  - Items upload one at a time, oldest first.
 *  - A capture's photos/videos upload before the record. Each finished file is
 *    persisted with its remote URL, so a retry resumes instead of re-uploading.
 *  - A failed upload goes back to 'pending' with exponential back-off, and to
 *    'error' after `maxAttempts` (or immediately if the server says it's not retryable).
 *  - A failure while the device is offline doesn't count as an attempt.
 *  - Reconnecting (or tapping "Sync now") retries everything, ignoring back-off,
 *    including 'error' items.
 *  - Anything left 'syncing' by a killed app is reset to 'pending' on start.
 *  - Captures can be edited in any state. Each edit bumps `version`; a capture
 *    needs syncing while version > syncedVersion. Editing during an upload lets
 *    the upload finish, then re-queues the capture so the edit is sent next.
 */
import {CaptureDraft, FieldCapture} from '../types';
import {CaptureStore} from './StorageService';
import {CaptureTransport} from './SyncService';
import {SyncState} from './SyncState';
import {SyncContext, syncCapture} from './syncCapture';
import {
  DEFAULT_OPTIONS,
  SyncEngineOptions,
  asNewCapture,
  editPatch,
  msUntilNextRetry,
  nextDue,
  normalizeSaved,
} from './syncRules';

export {MAX_ATTEMPTS} from './syncRules';
export type {SyncEngineOptions} from './syncRules';
export type {SyncSnapshot} from './SyncState';

export class SyncEngine {
  private readonly state = new SyncState();
  private ready: Promise<void> | null = null;
  private stopped = false;
  private flushing: Promise<void> | null = null;
  private rerun: {force: boolean} | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly options: SyncEngineOptions;
  private readonly ctx: SyncContext;

  constructor(
    private readonly store: CaptureStore,
    private readonly transport: CaptureTransport,
    options: Partial<SyncEngineOptions> = {},
  ) {
    this.options = {...DEFAULT_OPTIONS, ...options};
    this.ctx = {
      state: this.state,
      transport,
      options: this.options,
      persist: () => this.persist(),
    };
  }

  subscribe = this.state.subscribe;
  getSnapshot = this.state.getSnapshot;

  start = (): Promise<void> => {
    this.stopped = false;
    return this.ensureLoaded().then(() => {
      this.scheduleRetry();
      if (this.state.isOnline) {
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
    this.state.setCaptures(normalizeSaved(saved), true);
    if (stuck) {
      await this.persist();
    }
  }

  setOnline = (online: boolean): void => {
    if (!this.state.setOnline(online)) {
      return;
    }
    if (online) {
      this.flush(true);
    } else {
      this.clearRetryTimer();
    }
  };

  add = async (capture: FieldCapture): Promise<void> => {
    await this.ensureLoaded();
    this.state.setCaptures([asNewCapture(capture), ...this.state.captures]);
    await this.persist();
    this.flush();
  };

  /**
   * Apply a local edit, in any state. A synced or failed capture goes back to
   * 'pending' with fresh attempts; one that's mid-upload is left alone and
   * re-queued when that upload finishes.
   */
  update = async (
    id: string,
    changes: Partial<CaptureDraft>,
  ): Promise<void> => {
    await this.ensureLoaded();
    const current = this.state.find(id);
    if (!current) {
      return;
    }
    this.state.patch(id, editPatch(current, changes));
    await this.persist();
    this.flush();
  };

  retry = async (id: string): Promise<void> => {
    await this.ensureLoaded();
    const found = this.state.patch(id, {
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
    this.state.setCaptures(this.state.captures.filter(c => c.id !== id));
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
      this.state.setSyncing(false);
      this.scheduleRetry();
    }
  }

  private async processQueue(force: boolean) {
    const attempted = new Set<string>();
    let next = nextDue(this.state.captures, force, attempted);
    while (next && this.state.isOnline && !this.stopped) {
      attempted.add(next.id);
      this.state.setSyncing(true);
      await syncCapture(this.ctx, next.id);
      next = nextDue(this.state.captures, force, attempted);
    }
  }

  private scheduleRetry() {
    this.clearRetryTimer();
    if (!this.state.isOnline || this.stopped) {
      return;
    }
    const wait = msUntilNextRetry(this.state.captures);
    if (wait === null) {
      return;
    }
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

  private ensureLoaded(): Promise<void> {
    if (!this.ready) {
      this.ready = this.load();
    }
    return this.ready;
  }

  // Never rejects: the in-memory state stays authoritative and the next write
  // retries the full snapshot. Failures are surfaced via `storageError`.
  private persist(): Promise<void> {
    return this.store.saveAll(this.state.captures).then(
      () => this.state.setStorageError(null),
      err => {
        console.warn('[SyncEngine] failed to persist captures', err);
        this.state.setStorageError(
          err instanceof Error ? err.message : String(err),
        );
      },
    );
  }
}
