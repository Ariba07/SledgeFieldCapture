/**
 * SyncService – the upload transport. Currently a mock with a toggleable
 * failure mode so the error / retry path can be demonstrated on demand.
 *
 * To use a real backend, replace the body of `uploadCapture` with the fetch
 * call below. The capture id is sent as an idempotency key, so a retry after a
 * lost response cannot create a duplicate record on the server.
 */
import {FieldCapture} from '../types';

const SIMULATED_DELAY_MS = 1200;

/** Thrown by the transport. `retryable: false` skips automatic retries (e.g. 4xx). */
export class SyncError extends Error {
  constructor(message: string, readonly retryable = true) {
    super(message);
    this.name = 'SyncError';
  }
}

export interface CaptureTransport {
  uploadCapture(capture: FieldCapture): Promise<void>;
}

let simulateServerErrors = false;

export const SyncService: CaptureTransport & {
  setSimulateServerErrors(on: boolean): void;
  getSimulateServerErrors(): boolean;
} = {
  async uploadCapture(_capture) {
    await new Promise<void>(res => setTimeout(res, SIMULATED_DELAY_MS));

    if (simulateServerErrors) {
      throw new SyncError('Server returned 503 – service unavailable');
    }

    // ── Real API call ────────────────────────────────────────────────
    // const res = await fetch('https://api.example.com/captures', {
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
