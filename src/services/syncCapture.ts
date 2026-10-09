/**
 * Sends one capture: its photos/videos first, then the record. Each finished
 * file is persisted with its remote URL, so a retry resumes instead of
 * re-uploading. The outcome (synced, retry later, or error) is written to state.
 */
import {SyncState} from './SyncState';
import {CaptureTransport} from './SyncService';
import {
  SyncEngineOptions,
  attachmentBytes,
  failurePatch,
  successPatch,
} from './syncRules';

export interface SyncContext {
  state: SyncState;
  transport: CaptureTransport;
  options: SyncEngineOptions;
  /** Writes the capture list to device storage. Never rejects. */
  persist: () => Promise<void>;
}

export async function syncCapture(ctx: SyncContext, id: string) {
  const {state, transport, options, persist} = ctx;
  if (!state.patch(id, {syncStatus: 'syncing'})) {
    return;
  }
  await persist();

  try {
    await uploadAttachments(ctx, id);
    const latest = state.find(id);
    if (!latest) {
      return; // deleted mid-upload
    }
    await transport.uploadCapture(latest);
    const current = state.find(id);
    if (!current) {
      return; // deleted mid-upload
    }
    state.patch(id, successPatch(latest, current));
  } catch (err: unknown) {
    const current = state.find(id);
    if (!current) {
      return; // deleted mid-upload
    }
    state.patch(id, failurePatch(current, err, state.isOnline, options));
  } finally {
    state.setProgress(id, undefined);
  }
  await persist();
}

/** Upload every file without a remoteUrl, re-reading the list so files added mid-sync are included. */
async function uploadAttachments(
  {state, transport, persist}: SyncContext,
  id: string,
) {
  for (;;) {
    const capture = state.find(id);
    const all = capture?.attachments ?? [];
    const next = all.find(a => !a.remoteUrl);
    if (!capture || !next) {
      return;
    }
    const {done, total} = attachmentBytes(all);

    state.setProgress(id, done / total);
    const remoteUrl = await transport.uploadAttachment(
      capture,
      next,
      fraction =>
        state.setProgress(id, (done + fraction * next.sizeBytes) / total),
    );
    state.patchAttachment(id, next.id, {remoteUrl});
    await persist();
  }
}
