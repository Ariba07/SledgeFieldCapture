// @refresh reset
/**
 * SyncContext – exposes a single shared useSync() instance to every screen,
 * so navigation doesn't spin up duplicate NetInfo listeners / capture state.
 *
 * `@refresh reset` (dev only): when SyncEngine or useSync change, Fast Refresh
 * remounts the provider so a fresh engine is built from the new code, instead
 * of keeping an instance of the old class that lacks new methods.
 */
import React, {createContext, useContext} from 'react';
import {useSync} from '../hooks/useSync';

type SyncContextValue = ReturnType<typeof useSync>;

const SyncContext = createContext<SyncContextValue | null>(null);

export const SyncProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const sync = useSync();
  return <SyncContext.Provider value={sync}>{children}</SyncContext.Provider>;
};

export const useSyncContext = (): SyncContextValue => {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return ctx;
};
