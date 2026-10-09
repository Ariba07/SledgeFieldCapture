import {
  Harness,
  MemoryStore,
  createHarness,
  destroyHarness,
  makeCapture,
  makeAttachment,
  settle,
  statusOf,
} from './support/syncHarness';
import {SyncEngine} from '../src/services/SyncEngine';
import {FieldCapture, SyncStatus} from '../src/types';
import {SyncError} from '../src/services/SyncService';

describe('SyncEngine editing', () => {
  let h: Harness;
  let store: Harness['store'];
  let transport: Harness['transport'];
  let engine: Harness['engine'];

  beforeEach(async () => {
    h = await createHarness();
    ({store, transport, engine} = h);
  });

  afterEach(() => destroyHarness(h));

  it('edits a pending capture in place and uploads the latest data', async () => {
    await engine.add(makeCapture('a'));
    await engine.update('a', {notes: 'edited offline'});

    const a = engine.getSnapshot().captures[0];
    expect(a.version).toBe(2);
    expect(a.syncStatus).toBe('pending');
    expect(store.data[0].notes).toBe('edited offline');

    engine.setOnline(true);
    await settle();
    expect(transport.calls[0].payload!.notes).toBe('edited offline');
  });

  it('puts a synced capture back in the queue and syncs the edit', async () => {
    engine.setOnline(true);
    await engine.add(makeCapture('a'));
    await settle();
    transport.succeed();
    await settle();
    expect(engine.getSnapshot().captures[0].syncedVersion).toBe(1);

    await engine.update('a', {priority: 'high'});
    await settle();
    expect(statusOf(engine, 'a')).toBe('syncing');
    expect(transport.calls[0].payload!.priority).toBe('high');

    transport.succeed();
    await settle();
    const a = engine.getSnapshot().captures[0];
    expect(a.syncStatus).toBe('synced');
    expect(a.syncedVersion).toBe(2);
  });

  it('re-queues a capture edited while it was uploading', async () => {
    engine.setOnline(true);
    await engine.add(makeCapture('a'));
    await settle();
    expect(transport.calls[0].payload!.notes).toBe('');

    await engine.update('a', {notes: 'changed mid-upload'});
    expect(statusOf(engine, 'a')).toBe('syncing'); // in-flight upload untouched

    transport.succeed(); // server now has version 1
    await settle();
    expect(engine.getSnapshot().captures[0].syncedVersion).toBe(1);
    expect(transport.calls.map(c => c.payload!.notes)).toEqual([
      'changed mid-upload',
    ]);

    transport.succeed();
    await settle();
    const a = engine.getSnapshot().captures[0];
    expect(a.syncStatus).toBe('synced');
    expect(a.syncedVersion).toBe(2);
  });

  it('gives a failed capture fresh attempts after an edit', async () => {
    engine.setOnline(true);
    await engine.add(makeCapture('a'));
    await settle();
    transport.fail(new SyncError('400', false));
    await settle();
    expect(statusOf(engine, 'a')).toBe('error');

    await engine.update('a', {location: 'Level 4'});
    await settle();
    const a = engine.getSnapshot().captures[0];
    expect(a.syncStatus).toBe('syncing');
    expect(a.retryCount).toBe(0);
    expect(a.errorMessage).toBeUndefined();
  });

  it('keeps upload progress for files that finished while the form was open', async () => {
    engine.setOnline(true);
    await engine.add({
      ...makeCapture('a'),
      attachments: [makeAttachment('p1', 100)],
    });
    await settle();
    const staleFormCopy = [makeAttachment('p1', 100)]; // form opened before upload finished
    transport.succeed(); // p1 uploaded
    await settle();

    await engine.update('a', {
      attachments: [...staleFormCopy, makeAttachment('p2', 100)],
    });
    const files = engine.getSnapshot().captures[0].attachments!;
    expect(files[0].remoteUrl).toBe('https://cdn.test/p1');
    expect(files[1].remoteUrl).toBeUndefined();
  });

  it('adds a photo to a synced capture that has a video, uploading only the new file', async () => {
    engine.setOnline(true);
    const video = {
      ...makeAttachment('v1', 5000),
      kind: 'video' as const,
      mimeType: 'video/mp4',
    };
    await engine.add({...makeCapture('a'), attachments: [video]});
    await settle();
    transport.succeed(); // video
    await settle();
    transport.succeed(); // record
    await settle();
    expect(statusOf(engine, 'a')).toBe('synced');

    const current = engine.getSnapshot().captures[0];
    await engine.update('a', {
      attachments: [...current.attachments!, makeAttachment('p1', 100)],
    });
    await settle();

    expect(transport.calls.map(c => [c.kind, c.id])).toEqual([['file', 'p1']]);
    transport.succeed();
    await settle();
    expect(transport.calls.map(c => [c.kind, c.id])).toEqual([['record', 'a']]);
    expect(transport.calls[0].payload!.attachments!.map(x => x.id)).toEqual([
      'v1',
      'p1',
    ]);
    transport.succeed();
    await settle();
    expect(statusOf(engine, 'a')).toBe('synced');
  });

  it('upgrades captures saved before versioning', async () => {
    const legacyStore = new MemoryStore();
    const legacy = (status: SyncStatus) => {
      const c: Partial<FieldCapture> = makeCapture(status, status);
      delete c.version;
      return c as FieldCapture;
    };
    legacyStore.data = [legacy('synced'), legacy('pending')];
    const upgraded = new SyncEngine(legacyStore, transport);
    await upgraded.start();

    const [synced, pending] = upgraded.getSnapshot().captures;
    expect(synced.version).toBe(1);
    expect(synced.syncedVersion).toBe(1);
    expect(pending.syncedVersion).toBeUndefined();
    upgraded.stop();
  });
});
