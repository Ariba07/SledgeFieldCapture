import {
  Harness,
  MemoryStore,
  createHarness,
  destroyHarness,
  makeCapture,
  settle,
  statusOf,
} from './support/syncHarness';
import {SyncEngine} from '../src/services/SyncEngine';
import {SyncError} from '../src/services/SyncService';

describe('SyncEngine queue', () => {
  let h: Harness;
  let store: Harness['store'];
  let transport: Harness['transport'];
  let engine: Harness['engine'];

  beforeEach(async () => {
    h = await createHarness();
    ({store, transport, engine} = h);
  });

  afterEach(() => destroyHarness(h));

  it('keeps captures pending and persisted while offline', async () => {
    await engine.add(makeCapture('a'));

    expect(statusOf(engine, 'a')).toBe('pending');
    expect(store.data.map(c => c.id)).toEqual(['a']);
    expect(transport.inFlight).toBe(0);
  });

  it('uploads pending captures when the device comes back online', async () => {
    await engine.add(makeCapture('a'));
    engine.setOnline(true);
    await settle();

    expect(statusOf(engine, 'a')).toBe('syncing');
    expect(engine.getSnapshot().isSyncing).toBe(true);

    transport.succeed();
    await settle();

    expect(statusOf(engine, 'a')).toBe('synced');
    expect(store.data[0].syncStatus).toBe('synced');
    expect(store.data[0].syncedAt).toBeDefined();
    expect(engine.getSnapshot().isSyncing).toBe(false);
  });

  it('uploads oldest first, one at a time', async () => {
    await engine.add(makeCapture('first'));
    await engine.add(makeCapture('second'));
    engine.setOnline(true);
    await settle();

    expect(transport.calls.map(c => c.id)).toEqual(['first']);
    transport.succeed();
    await settle();
    expect(transport.calls.map(c => c.id)).toEqual(['second']);
  });

  it('never uploads the same capture twice when flushes overlap', async () => {
    await engine.add(makeCapture('a'));
    engine.setOnline(true);
    engine.flush(true);
    engine.flush(true);
    await settle();

    expect(transport.inFlight).toBe(1);
    transport.succeed();
    await settle();
    expect(transport.inFlight).toBe(0);
    expect(statusOf(engine, 'a')).toBe('synced');
  });

  it('retries with exponential back-off, then marks the capture as error', async () => {
    engine.setOnline(true);
    await engine.add(makeCapture('a'));
    await settle();

    transport.fail(); // attempt 1
    await settle();
    expect(statusOf(engine, 'a')).toBe('pending');
    expect(transport.inFlight).toBe(0);

    jest.advanceTimersByTime(999);
    await settle();
    expect(transport.inFlight).toBe(0); // still backing off

    jest.advanceTimersByTime(1);
    await settle();
    expect(transport.inFlight).toBe(1);
    transport.fail(); // attempt 2
    await settle();

    jest.advanceTimersByTime(2000); // doubled delay
    await settle();
    transport.fail(); // attempt 3 → exhausted
    await settle();

    const a = engine.getSnapshot().captures[0];
    expect(a.syncStatus).toBe('error');
    expect(a.retryCount).toBe(3);
    expect(a.errorMessage).toBe('500');

    jest.advanceTimersByTime(60_000);
    await settle();
    expect(transport.inFlight).toBe(0); // no more automatic retries
  });

  it('marks non-retryable failures as error immediately', async () => {
    engine.setOnline(true);
    await engine.add(makeCapture('a'));
    await settle();

    transport.fail(new SyncError('400 bad request', false));
    await settle();

    expect(statusOf(engine, 'a')).toBe('error');
  });

  it('manual retry resets attempts and uploads again', async () => {
    engine.setOnline(true);
    await engine.add(makeCapture('a'));
    await settle();
    transport.fail(new SyncError('400', false));
    await settle();

    await engine.retry('a');
    await settle();
    expect(statusOf(engine, 'a')).toBe('syncing');
    transport.succeed();
    await settle();

    const a = engine.getSnapshot().captures[0];
    expect(a.syncStatus).toBe('synced');
    expect(a.retryCount).toBe(0);
  });

  it('retries error captures when the device reconnects', async () => {
    engine.setOnline(true);
    await engine.add(makeCapture('a'));
    await settle();
    transport.fail(new SyncError('503', false));
    await settle();
    expect(statusOf(engine, 'a')).toBe('error');

    engine.setOnline(false);
    engine.setOnline(true);
    await settle();
    transport.succeed();
    await settle();

    expect(statusOf(engine, 'a')).toBe('synced');
  });

  it('does not count a failure caused by losing signal', async () => {
    engine.setOnline(true);
    await engine.add(makeCapture('a'));
    await settle();

    engine.setOnline(false);
    transport.fail(new Error('Network request failed'));
    await settle();

    const a = engine.getSnapshot().captures[0];
    expect(a.syncStatus).toBe('pending');
    expect(a.retryCount).toBe(0);
  });

  it('resets captures stuck in syncing after an app restart', async () => {
    const restartedStore = new MemoryStore();
    restartedStore.data = [
      makeCapture('a', 'syncing'),
      makeCapture('b', 'synced'),
    ];
    const restarted = new SyncEngine(restartedStore, transport);

    await restarted.start();

    expect(statusOf(restarted, 'a')).toBe('pending');
    expect(statusOf(restarted, 'b')).toBe('synced');
    expect(restartedStore.data[0].syncStatus).toBe('pending');
    restarted.stop();
  });

  it('ignores the upload result of a capture deleted mid-upload', async () => {
    engine.setOnline(true);
    await engine.add(makeCapture('a'));
    await settle();

    await engine.remove('a');
    transport.succeed();
    await settle();

    expect(engine.getSnapshot().captures).toEqual([]);
    expect(store.data).toEqual([]);
  });

  it('reports a failed write to device storage and clears it once a write succeeds', async () => {
    const saveAll = jest
      .spyOn(store, 'saveAll')
      .mockRejectedValueOnce(new Error('Disk full'));
    await engine.add(makeCapture('a'));

    expect(engine.getSnapshot().storageError).toBe('Disk full');
    expect(engine.getSnapshot().captures).toHaveLength(1); // still in memory

    await engine.update('a', {notes: 'retry write'});
    expect(engine.getSnapshot().storageError).toBeNull();
    expect(store.data[0].notes).toBe('retry write');
    saveAll.mockRestore();
  });
});
