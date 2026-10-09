/**
 * Pure queue rules used by SyncEngine: no state, no I/O, so each can be
 * reasoned about (and tested) on its own. See SyncEngine.ts for the overview.
 */
import {Attachment, CaptureDraft, FieldCapture} from '../types';
import {SyncError} from './SyncService';

export interface SyncEngineOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const MAX_ATTEMPTS = 3;

export const DEFAULT_OPTIONS: SyncEngineOptions = {
  maxAttempts: MAX_ATTEMPTS,
  baseDelayMs: 2000,
  maxDelayMs: 60_000,
};

/** Upgrade records saved by older versions and reset anything a killed app left 'syncing'. */
export function normalizeSaved(saved: FieldCapture[]): FieldCapture[] {
  return saved.map(c => {
    const version = c.version ?? 1; // saved before versioning existed
    return {
      ...c,
      version,
      syncedVersion:
        c.syncedVersion ?? (c.syncStatus === 'synced' ? version : undefined),
      syncStatus: c.syncStatus === 'syncing' ? 'pending' : c.syncStatus,
    };
  });
}

/** A brand-new capture enters the queue as version 1, pending. */
export function asNewCapture(capture: FieldCapture): FieldCapture {
  return {
    ...capture,
    version: 1,
    syncedVersion: undefined,
    syncStatus: 'pending',
    retryCount: 0,
    nextRetryAt: undefined,
  };
}

/**
 * The patch for a local edit. A capture mid-upload keeps its status and is
 * re-queued when that upload finishes; anything else goes back to 'pending'.
 */
export function editPatch(
  current: FieldCapture,
  changes: Partial<CaptureDraft>,
): Partial<FieldCapture> {
  const merged: Partial<FieldCapture> = {...changes};
  if (changes.attachments) {
    // Keep the engine's copy of existing files: one may have finished
    // uploading (gained a remoteUrl) while the form was open.
    merged.attachments = changes.attachments.map(
      a => current.attachments?.find(x => x.id === a.id) ?? a,
    );
  }
  return {
    ...merged,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
    ...(current.syncStatus === 'syncing'
      ? {}
      : {
          syncStatus: 'pending' as const,
          retryCount: 0,
          nextRetryAt: undefined,
          errorMessage: undefined,
        }),
  };
}

/**
 * The oldest capture that's due for upload. `force` ignores back-off and
 * includes 'error' items. Captures are stored newest-first.
 */
export function nextDue(
  captures: FieldCapture[],
  force: boolean,
  attempted: Set<string>,
  now = Date.now(),
): FieldCapture | undefined {
  for (let i = captures.length - 1; i >= 0; i--) {
    const c = captures[i];
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

/** After a successful upload of `sent`. Edited meanwhile? Send the newer version next. */
export function successPatch(
  sent: FieldCapture,
  current: FieldCapture,
): Partial<FieldCapture> {
  return {
    syncStatus: current.version > sent.version ? 'pending' : 'synced',
    syncedVersion: sent.version,
    syncedAt: new Date().toISOString(),
    errorMessage: undefined,
    nextRetryAt: undefined,
    retryCount: 0,
  };
}

/** After a failed upload: retry with back-off, or give up as 'error'. */
export function failurePatch(
  current: FieldCapture,
  err: unknown,
  isOnline: boolean,
  options: SyncEngineOptions,
): Partial<FieldCapture> {
  const message = err instanceof Error ? err.message : 'Unknown error';
  if (!isOnline) {
    // Lost signal mid-upload: not the server's fault, don't burn an attempt.
    return {syncStatus: 'pending', errorMessage: message};
  }
  const retryable = !(err instanceof SyncError) || err.retryable;
  const retryCount = current.retryCount + 1;
  const exhausted = !retryable || retryCount >= options.maxAttempts;
  return {
    syncStatus: exhausted ? 'error' : 'pending',
    errorMessage: message,
    retryCount,
    nextRetryAt: exhausted
      ? undefined
      : new Date(Date.now() + backoffMs(retryCount, options)).toISOString(),
  };
}

/** 2s, 4s, 8s… capped, with up to 20% jitter so devices don't retry in lockstep. */
export function backoffMs(attempt: number, options: SyncEngineOptions): number {
  const {baseDelayMs, maxDelayMs} = options;
  const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
  return Math.round(delay * (1 + Math.random() * 0.2));
}

/** Milliseconds until the earliest scheduled retry, or null if none is scheduled. */
export function msUntilNextRetry(
  captures: FieldCapture[],
  now = Date.now(),
): number | null {
  const times = captures
    .filter(c => c.syncStatus === 'pending' && c.nextRetryAt)
    .map(c => Date.parse(c.nextRetryAt!));
  return times.length === 0 ? null : Math.max(0, Math.min(...times) - now);
}

/** Bytes already uploaded and total bytes, for overall media progress. */
export function attachmentBytes(attachments: Attachment[]) {
  const total = attachments.reduce((sum, a) => sum + a.sizeBytes, 0) || 1;
  const done = attachments
    .filter(a => a.remoteUrl)
    .reduce((sum, a) => sum + a.sizeBytes, 0);
  return {done, total};
}

/**
 * The progress map with `id` set to `fraction` (rounded to whole percent) or
 * removed. Returns the same object when nothing changed, so callers can skip a render.
 */
export function withProgress(
  progress: Record<string, number>,
  id: string,
  fraction: number | undefined,
): Record<string, number> {
  if (fraction === undefined) {
    if (!(id in progress)) {
      return progress;
    }
    const rest = {...progress};
    delete rest[id];
    return rest;
  }
  const rounded = Math.round(fraction * 100) / 100;
  return progress[id] === rounded ? progress : {...progress, [id]: rounded};
}
