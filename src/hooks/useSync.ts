/**
 * useSync – connects the SyncEngine to React and to NetInfo.
 *
 * All queue/retry logic lives in SyncEngine; this hook only owns the engine
 * instance, feeds it connectivity changes, and re-renders on state changes.
 */
import {useEffect, useMemo, useState, useSyncExternalStore} from 'react';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import {StorageService} from '../services/StorageService';
import {SyncService} from '../services/SyncService';
import {SyncEngine} from '../services/SyncEngine';
import {MediaService} from '../services/MediaService';
import {CaptureDraft} from '../types';

// isInternetReachable is null while unknown; only treat an explicit false as offline.
const isReachable = (state: NetInfoState) =>
  !!state.isConnected && state.isInternetReachable !== false;

export const useSync = () => {
  const [engine, setEngine] = useState(
    () => new SyncEngine(StorageService, SyncService),
  );

  // Dev only: Fast Refresh swaps in a new SyncEngine class but keeps hook
  // state, leaving an instance of the old class (missing any new methods).
  // Replace it; the effect below stops the old one and starts the new one.
  if (__DEV__ && !(engine instanceof SyncEngine)) {
    setEngine(new SyncEngine(StorageService, SyncService));
  }

  useEffect(() => {
    engine.start();
    const unsubscribe = NetInfo.addEventListener(state =>
      engine.setOnline(isReachable(state)),
    );
    return () => {
      unsubscribe();
      engine.stop();
    };
  }, [engine]);

  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot);

  return useMemo(
    () => ({
      ...state,
      addCapture: engine.add,
      retryCapture: engine.retry,
      updateCapture: async (id: string, changes: Partial<CaptureDraft>) => {
        const before = state.captures.find(c => c.id === id);
        await engine.update(id, changes);
        // Delete files the edit removed, now that the change is persisted.
        if (before && changes.attachments) {
          const kept = new Set(changes.attachments.map(a => a.id));
          await MediaService.remove(
            before.attachments?.filter(a => !kept.has(a.id)),
          );
        }
      },
      deleteCapture: async (id: string) => {
        const capture = state.captures.find(c => c.id === id);
        await engine.remove(id);
        await MediaService.remove(capture?.attachments);
      },
      flushPendingCaptures: () => engine.flush(true),
    }),
    [state, engine],
  );
};
