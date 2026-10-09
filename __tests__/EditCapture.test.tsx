/**
 * Integration: the real Edit screen + SyncProvider. Saving an edit must update
 * the existing entry (same id, new values) rather than add a new one.
 */
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {SyncProvider, useSyncContext} from '../src/context/SyncContext';
import {EditCaptureScreen} from '../src/screens/EditCaptureScreen';
import {FieldCapture} from '../src/types';

const seed: FieldCapture = {
  id: 'cap-1',
  captureType: 'issue',
  projectName: 'Harbour Point Tower',
  location: 'Level 12',
  notes: 'Original note',
  priority: 'medium',
  capturedAt: '2026-10-09T10:00:00.000Z',
  version: 1,
  syncedVersion: 1,
  syncStatus: 'synced',
  syncedAt: '2026-10-09T10:01:00.000Z',
  retryCount: 0,
  attachments: [
    {
      id: 'v1',
      kind: 'video',
      fileName: 'v1.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 5000,
      remoteUrl: 'https://cdn/v1',
    },
  ],
};

let latest: FieldCapture[] = [];
const Probe = () => {
  latest = useSyncContext().captures;
  return null;
};

const flush = async () => {
  for (let i = 0; i < 5; i++) {
    await act(async () => {});
  }
};

it('saving an edit updates the existing entry in place', async () => {
  await AsyncStorage.setItem('@sledge_captures', JSON.stringify([seed]));
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    setOptions: jest.fn(),
  };

  let root!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    root = ReactTestRenderer.create(
      <SafeAreaProvider
        initialMetrics={{
          frame: {x: 0, y: 0, width: 390, height: 844},
          insets: {top: 0, left: 0, right: 0, bottom: 0},
        }}>
        <SyncProvider>
          <Probe />
        </SyncProvider>
      </SafeAreaProvider>,
    );
  });
  await flush();
  expect(latest.map(c => c.id)).toEqual(['cap-1']);

  // Mount the edit screen once captures have loaded (as when opened from the detail screen).
  await act(async () => {
    root.update(
      <SafeAreaProvider
        initialMetrics={{
          frame: {x: 0, y: 0, width: 390, height: 844},
          insets: {top: 0, left: 0, right: 0, bottom: 0},
        }}>
        <SyncProvider>
          <Probe />
          <EditCaptureScreen
            navigation={navigation as any}
            route={
              {
                key: 'edit',
                name: 'EditCapture',
                params: {captureId: 'cap-1'},
              } as any
            }
          />
        </SyncProvider>
      </SafeAreaProvider>,
    );
  });
  await flush();

  const notes = root.root.findByProps({
    accessibilityLabel: 'Notes',
    multiline: true,
  });
  await act(async () => notes.props.onChangeText('Edited note'));
  const save = root.root.findAll(
    n => n.props.accessibilityLabel === 'Save changes' && n.props.onPress,
  )[0];
  await act(async () => save.props.onPress());
  await flush();

  expect(navigation.goBack).toHaveBeenCalled();
  expect(latest).toHaveLength(1); // updated, not duplicated
  const edited = latest[0];
  expect(edited.id).toBe('cap-1');
  expect(edited.notes).toBe('Edited note');
  expect(edited.version).toBe(2);
  expect(edited.updatedAt).toBeDefined();
  expect(edited.attachments!.map(a => a.id)).toEqual(['v1']);

  const stored = JSON.parse(
    (await AsyncStorage.getItem('@sledge_captures'))!,
  ) as FieldCapture[];
  expect(stored).toHaveLength(1);
  expect(stored[0].notes).toBe('Edited note');
});
