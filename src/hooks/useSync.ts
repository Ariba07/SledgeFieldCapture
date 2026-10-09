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

// isInternetReachable is null while unknown; only treat an explicit false as offline.
const isReachable = (state: NetInfoState) =>
  !!state.isConnected && state.isInternetReachable !== false;

export const useSync = () => {
  const [engine] = useState(() => new SyncEngine(StorageService, SyncService));

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
      deleteCapture: engine.remove,
      flushPendingCaptures: () => engine.flush(true),
    }),
    [state, engine],
  );
};
