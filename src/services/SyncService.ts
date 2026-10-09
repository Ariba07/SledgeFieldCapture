/**
 * SyncService – the upload transport. Currently a mock with a toggleable
 * failure mode so the error / retry path can be demonstrated on demand.
 *
 * Upload order for a capture: each attachment first (reporting progress),
 * then the record itself, which references the attachments' remote URLs.
 * The capture / attachment ids are sent as idempotency keys, so a retry after
 * a lost response cannot create duplicates on the server.
 *
 * To use a real backend, replace the mock bodies with the code in the comments.
 */
import {Attachment, FieldCapture} from '../types';

const SIMULATED_RECORD_DELAY_MS = 800;
const SIMULATED_BYTES_PER_SEC = 1.5 * 1024 * 1024; // ~a decent 4G uplink
const MIN_SIMULATED_FILE_MS = 900;
const PROGRESS_TICK_MS = 100;

/** Thrown by the transport. `retryable: false` skips automatic retries (e.g. 4xx). */
export class SyncError extends Error {
  constructor(message: string, readonly retryable = true) {
    super(message);
    this.name = 'SyncError';
  }
}

export interface CaptureTransport {
  /** Uploads one file and resolves with its remote URL. `onProgress` gets 0…1. */
  uploadAttachment(
    capture: FieldCapture,
    attachment: Attachment,
    onProgress: (fraction: number) => void,
  ): Promise<string>;
  uploadCapture(capture: FieldCapture): Promise<void>;
}

let simulateServerErrors = false;

const failure = () => new SyncError('Server returned 503 – service unavailable');

export const SyncService: CaptureTransport & {
  setSimulateServerErrors(on: boolean): void;
  getSimulateServerErrors(): boolean;
} = {
  uploadAttachment(_capture, attachment, onProgress) {
    const totalMs = Math.max(
      MIN_SIMULATED_FILE_MS,
      (attachment.sizeBytes / SIMULATED_BYTES_PER_SEC) * 1000,
    );
    return new Promise((resolve, reject) => {
      let elapsed = 0;
      const timer = setInterval(() => {
        elapsed += PROGRESS_TICK_MS;
        const fraction = Math.min(1, elapsed / totalMs);
        if (simulateServerErrors && fraction >= 0.4) {
          clearInterval(timer); // fail part-way through, like a dropped upload
          reject(failure());
          return;
        }
        onProgress(fraction);
        if (fraction >= 1) {
          clearInterval(timer);
          resolve(`https://uploads.example.com/attachments/${attachment.id}`);
        }
      }, PROGRESS_TICK_MS);
    });

    // ── Real upload (streams from disk, works for large videos) ───────
    // import {uploadFiles} from '@dr.pogodin/react-native-fs';
    // import {attachmentPath} from './MediaService';
    // const {promise} = uploadFiles({
    //   toUrl: `${API_URL}/captures/${capture.id}/attachments`,
    //   headers: {'Idempotency-Key': attachment.id},
    //   files: [{
    //     name: 'file',
    //     filename: attachment.fileName,
    //     filepath: attachmentPath(attachment),
    //     filetype: attachment.mimeType,
    //   }],
    //   progress: ({totalBytesSent, totalBytesExpectedToSend}) =>
    //     onProgress(totalBytesSent / totalBytesExpectedToSend),
    // });
    // const res = await promise;
    // if (res.statusCode >= 300) {
    //   throw new SyncError(`Upload failed (${res.statusCode})`, res.statusCode >= 500);
    // }
    // return JSON.parse(res.body).url;
  },

  async uploadCapture(_capture) {
    await new Promise<void>(res => setTimeout(res, SIMULATED_RECORD_DELAY_MS));

    if (simulateServerErrors) {
      throw failure();
    }

    // ── Real API call ────────────────────────────────────────────────
    // const res = await fetch(`${API_URL}/captures`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Idempotency-Key': capture.id,
    //   },
    //   body: JSON.stringify(capture),
    // });
    // if (!res.ok) {
    //   throw new SyncError(`Server returned ${res.status}`, res.status >= 500 || res.status === 429);
    // }
    // ─────────────────────────────────────────────────────────────────
  },

  setSimulateServerErrors(on) {
    simulateServerErrors = on;
  },

  getSimulateServerErrors() {
    return simulateServerErrors;
  },
};
