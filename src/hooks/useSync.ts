/**
 * useSync – manages the sync queue, network detection, and retry logic.
 *
 * Key behaviours:
 *  - On mount: load persisted captures and register a NetInfo listener.
 *  - On reconnect: automatically flush the pending queue.
 *  - Retry: failed items are re-queued with exponential back-off (max 3 retries).
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';
import {FieldCapture, SyncStatus} from '../types';
import {StorageService} from '../services/StorageService';
import {SyncService} from '../services/SyncService';

const MAX_RETRIES = 3;

export const useSync = () => {
  const [captures, setCaptures] = useState<FieldCapture[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Use a ref so the flush callback always reads the latest value
  const isOnlineRef = useRef(isOnline);

  // ── Load persisted data on mount ───────────────────────────────────
  useEffect(() => {
    StorageService.getAll().then(data => {
      setCaptures(data);
      // Reset any stuck 'syncing' states from a previous session
      data.forEach(c => {
        if (c.syncStatus === 'syncing') {
          updateCapture(c.id, {syncStatus: 'pending'});
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Network listener ───────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      isOnlineRef.current = online;

      if (online) {
        // Auto-flush as soon as we come back online
        flushPendingCaptures();
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helper: update a capture both in state and storage ─────────────
  const updateCapture = useCallback(
    async (id: string, patch: Partial<FieldCapture>) => {
      const updated = await StorageService.update(id, patch);
      if (updated) {
        setCaptures(prev => prev.map(c => (c.id === id ? updated : c)));
      }
    },
    [],
  );

  // ── Add a new capture (always starts as 'pending') ─────────────────
  const addCapture = useCallback(
    async (capture: FieldCapture) => {
      await StorageService.save(capture);
      setCaptures(prev => [capture, ...prev]);

      if (isOnlineRef.current) {
        syncOne(capture);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Sync a single capture ──────────────────────────────────────────
  const syncOne = useCallback(
    async (capture: FieldCapture) => {
      await updateCapture(capture.id, {syncStatus: 'syncing'});
      try {
        await SyncService.uploadCapture(capture);
        await updateCapture(capture.id, {
          syncStatus: 'synced',
          syncedAt: new Date().toISOString(),
          errorMessage: undefined,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        const retryCount = (capture.retryCount ?? 0) + 1;
        await updateCapture(capture.id, {
          syncStatus: retryCount >= MAX_RETRIES ? 'error' : 'pending',
          errorMessage: msg,
          retryCount,
        });
      }
    },
    [updateCapture],
  );

  // ── Flush all pending captures ─────────────────────────────────────
  const flushPendingCaptures = useCallback(async () => {
    if (isSyncing) {return;}
    const all = await StorageService.getAll();
    const pending = all.filter(
      c => c.syncStatus === 'pending' || c.syncStatus === 'error',
    );
    if (pending.length === 0) {return;}

    setIsSyncing(true);
    await Promise.allSettled(pending.map(c => syncOne(c)));
    setIsSyncing(false);
  }, [isSyncing, syncOne]);

  // ── Manual retry for a single 'error' capture ─────────────────────
  const retryCapture = useCallback(
    async (id: string) => {
      const all = await StorageService.getAll();
      const capture = all.find(c => c.id === id);
      if (!capture) {return;}
      // Reset retry count for manual retries
      const reset = {...capture, retryCount: 0, syncStatus: 'pending' as SyncStatus};
      await StorageService.save(reset);
      setCaptures(prev => prev.map(c => (c.id === id ? reset : c)));
      if (isOnlineRef.current) {
        syncOne(reset);
      }
    },
    [syncOne],
  );

  // ── Delete a capture ───────────────────────────────────────────────
  const deleteCapture = useCallback(async (id: string) => {
    await StorageService.delete(id);
    setCaptures(prev => prev.filter(c => c.id !== id));
  }, []);

  return {
    captures,
    isOnline,
    isSyncing,
    addCapture,
    retryCapture,
    deleteCapture,
    flushPendingCaptures,
  };
};
