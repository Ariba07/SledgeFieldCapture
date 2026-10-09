import {
  Harness,
  createHarness,
  destroyHarness,
  makeCapture,
  makeAttachment,
  settle,
  statusOf,
} from './support/syncHarness';

describe('SyncEngine attachments', () => {
  let h: Harness;
  let store: Harness['store'];
  let transport: Harness['transport'];
  let engine: Harness['engine'];

  beforeEach(async () => {
    h = await createHarness();
    ({store, transport, engine} = h);
  });

  afterEach(() => destroyHarness(h));

  const withMedia = () => ({
    ...makeCapture('a'),
    attachments: [makeAttachment('p1', 300), makeAttachment('p2', 100)],
  });

  it('uploads each file before the record and reports progress', async () => {
    engine.setOnline(true);
    await engine.add(withMedia());
    await settle();

    expect(transport.calls.map(c => [c.kind, c.id])).toEqual([['file', 'p1']]);
    transport.calls[0].onProgress!(0.5);
    expect(engine.getSnapshot().progress.a).toBe(0.38); // 150 of 400 bytes

    transport.succeed();
    await settle();
    expect(engine.getSnapshot().progress.a).toBe(0.75);
    expect(transport.calls.map(c => [c.kind, c.id])).toEqual([['file', 'p2']]);

    transport.succeed();
    await settle();
    expect(transport.calls.map(c => [c.kind, c.id])).toEqual([['record', 'a']]);

    transport.succeed();
    await settle();
    const a = engine.getSnapshot().captures[0];
    expect(a.syncStatus).toBe('synced');
    expect(a.attachments!.map(x => x.remoteUrl)).toEqual([
      'https://cdn.test/p1',
      'https://cdn.test/p2',
    ]);
    expect(store.data[0].attachments![0].remoteUrl).toBe('https://cdn.test/p1');
    expect(engine.getSnapshot().progress).toEqual({});
  });

  it('resumes after a failure without re-uploading finished files', async () => {
    engine.setOnline(true);
    await engine.add(withMedia());
    await settle();

    transport.succeed(); // p1 done
    await settle();
    transport.fail(); // p2 fails
    await settle();

    expect(statusOf(engine, 'a')).toBe('pending');
    expect(engine.getSnapshot().progress).toEqual({});

    jest.advanceTimersByTime(1000);
    await settle();
    expect(transport.calls.map(c => [c.kind, c.id])).toEqual([['file', 'p2']]);
  });
});
