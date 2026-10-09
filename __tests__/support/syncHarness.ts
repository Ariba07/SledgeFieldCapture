/**
 * Shared fakes for the SyncEngine tests: an in-memory store, a transport whose
 * uploads the test settles by hand, and a fresh engine per test with fake timers.
 */
import {SyncEngine} from '../../src/services/SyncEngine';
import {CaptureStore} from '../../src/services/StorageService';
import {CaptureTransport, SyncError} from '../../src/services/SyncService';
import {Attachment, FieldCapture, SyncStatus} from '../../src/types';

export class MemoryStore implements CaptureStore {
  data: FieldCapture[] = [];
  async getAll() {
    return this.data.map(c => ({...c}));
  }
  async saveAll(captures: FieldCapture[]) {
    this.data = JSON.parse(JSON.stringify(captures));
  }
}

interface Call {
  id: string;
  kind: 'file' | 'record';
  payload?: FieldCapture;
  resolve: () => void;
  reject: (e: Error) => void;
  onProgress?: (fraction: number) => void;
}

/** Each upload (file or record) waits until the test resolves or rejects it. */
export class ControlledTransport implements CaptureTransport {
  calls: Call[] = [];
  uploadAttachment(
    _capture: FieldCapture,
    attachment: Attachment,
    onProgress: (fraction: number) => void,
  ) {
    return new Promise<string>((resolve, reject) => {
      this.calls.push({
        id: attachment.id,
        kind: 'file',
        resolve: () => resolve(`https://cdn.test/${attachment.id}`),
        reject,
        onProgress,
      });
    });
  }
  uploadCapture(capture: FieldCapture) {
    return new Promise<void>((resolve, reject) => {
      this.calls.push({
        id: capture.id,
        kind: 'record',
        payload: capture,
        resolve,
        reject,
      });
    });
  }
  get inFlight() {
    return this.calls.length;
  }
  succeed() {
    this.calls.shift()!.resolve();
  }
  fail(err: Error = new SyncError('500')) {
    this.calls.shift()!.reject(err);
  }
}

export const makeCapture = (
  id: string,
  syncStatus: SyncStatus = 'pending',
): FieldCapture => ({
  id,
  captureType: 'issue',
  projectName: 'Tower A',
  location: 'L3',
  notes: '',
  priority: 'medium',
  capturedAt: new Date().toISOString(),
  syncStatus,
  retryCount: 0,
  version: 1,
});

export const makeAttachment = (id: string, sizeBytes: number): Attachment => ({
  id,
  kind: 'photo',
  fileName: `${id}.jpg`,
  mimeType: 'image/jpeg',
  sizeBytes,
});

/** Let pending promise callbacks run. */
export const settle = async () => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

export const statusOf = (engine: SyncEngine, id: string) =>
  engine.getSnapshot().captures.find(c => c.id === id)?.syncStatus;

export interface Harness {
  store: MemoryStore;
  transport: ControlledTransport;
  engine: SyncEngine;
}

/** Call from beforeEach: fake timers, no jitter, a started engine. */
export async function createHarness(): Promise<Harness> {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0); // no jitter
  const store = new MemoryStore();
  const transport = new ControlledTransport();
  const engine = new SyncEngine(store, transport, {
    maxAttempts: 3,
    baseDelayMs: 1000,
  });
  await engine.start();
  return {store, transport, engine};
}

/** Call from afterEach. */
export function destroyHarness({engine}: Harness) {
  engine.stop();
  jest.useRealTimers();
  jest.restoreAllMocks();
}
