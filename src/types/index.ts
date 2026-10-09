// ──────────────────────────────────────────────
//  Core domain types for Sledge Field Capture
// ──────────────────────────────────────────────

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface FieldCapture {
  id: string;              // uuid v4
  projectName: string;
  location: string;
  notes: string;
  photoUri?: string;       // local file URI
  capturedAt: string;      // ISO 8601
  syncStatus: SyncStatus;
  syncedAt?: string;       // ISO 8601 – set once synced
  errorMessage?: string;   // last sync error
  retryCount: number;
}

export interface SyncQueueItem {
  captureId: string;
  enqueuedAt: string;
}

export interface AppState {
  captures: FieldCapture[];
  isOnline: boolean;
  isSyncing: boolean;
}
