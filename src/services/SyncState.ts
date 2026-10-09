/**
 * The observable state behind SyncEngine: the capture list plus status flags,
 * exposed as an immutable snapshot for useSyncExternalStore. Every change
 * builds a new snapshot and notifies subscribers. No I/O happens here.
 */
import {Attachment, FieldCapture} from '../types';
import {withProgress} from './syncRules';

export interface SyncSnapshot {
  captures: FieldCapture[];
  /** True once saved captures have been read from storage. */
  isLoaded: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  /** Media upload progress (0…1) for the capture currently syncing. In memory only. */
  progress: Record<string, number>;
  /** Set when the last write to device storage failed; cleared by the next successful write. */
  storageError: string | null;
}

export class SyncState {
  private snapshot: SyncSnapshot = {
    captures: [],
    isLoaded: false,
    isOnline: false,
    isSyncing: false,
    progress: {},
    storageError: null,
  };
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): SyncSnapshot => this.snapshot;

  get captures(): FieldCapture[] {
    return this.snapshot.captures;
  }

  get isOnline(): boolean {
    return this.snapshot.isOnline;
  }

  find(id: string): FieldCapture | undefined {
    return this.snapshot.captures.find(c => c.id === id);
  }

  /** Replace the whole capture list (after loading, adding or removing). */
  setCaptures(captures: FieldCapture[], loaded = this.snapshot.isLoaded) {
    this.set({captures, isLoaded: loaded});
  }

  /** Apply a patch to one capture. Returns false if it no longer exists. */
  patch(id: string, changes: Partial<FieldCapture>): boolean {
    let found = false;
    const captures = this.snapshot.captures.map(c => {
      if (c.id !== id) {
        return c;
      }
      found = true;
      return {...c, ...changes};
    });
    if (found) {
      this.set({captures});
    }
    return found;
  }

  patchAttachment(
    captureId: string,
    attachmentId: string,
    changes: Partial<Attachment>,
  ) {
    const capture = this.find(captureId);
    if (capture?.attachments) {
      this.patch(captureId, {
        attachments: capture.attachments.map(a =>
          a.id === attachmentId ? {...a, ...changes} : a,
        ),
      });
    }
  }

  /** Emits only on whole-percent changes so fast progress events don't flood renders. */
  setProgress(id: string, fraction: number | undefined) {
    const progress = withProgress(this.snapshot.progress, id, fraction);
    if (progress !== this.snapshot.progress) {
      this.set({progress});
    }
  }

  /** Returns true if the value changed. */
  setOnline(isOnline: boolean): boolean {
    return this.setFlag('isOnline', isOnline);
  }

  setSyncing(isSyncing: boolean) {
    this.setFlag('isSyncing', isSyncing);
  }

  setStorageError(storageError: string | null) {
    this.setFlag('storageError', storageError);
  }

  private setFlag<K extends 'isOnline' | 'isSyncing' | 'storageError'>(
    key: K,
    value: SyncSnapshot[K],
  ): boolean {
    if (this.snapshot[key] === value) {
      return false;
    }
    this.set({[key]: value});
    return true;
  }

  private set(changes: Partial<SyncSnapshot>) {
    this.snapshot = {...this.snapshot, ...changes};
    this.listeners.forEach(l => l());
  }
}
