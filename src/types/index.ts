export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export type CaptureType =
  | 'daily_log'
  | 'rfi' // Request for Information
  | 'punchlist'
  | 'issue'
  | 'inspection';

export type Priority = 'low' | 'medium' | 'high';

export type AttachmentKind = 'photo' | 'video';

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  fileName: string; // Under <Documents>/attachments — the absolute path is rebuilt at
  // runtime because the iOS app container path changes on reinstall
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSec?: number;
  remoteUrl?: string; // Set once uploaded; uploaded files are skipped on retry
}

export interface FieldCapture {
  id: string;
  captureType: CaptureType;
  projectName: string;
  location: string;
  notes: string;
  priority: Priority;
  workerCount?: number; // Daily logs only
  weather?: string; // Daily logs only
  attachments?: Attachment[];
  capturedAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601 — last local edit
  version: number; // +1 on every local edit
  syncedVersion?: number; // Last version the server confirmed; version > syncedVersion ⇒ needs sync
  syncStatus: SyncStatus;
  syncedAt?: string; // ISO 8601 — set once synced
  errorMessage?: string;
  retryCount: number; // Failed attempts since last manual retry
  nextRetryAt?: string; // ISO 8601 — earliest time an automatic retry may run
}

/** The fields a person fills in on the form (create or edit). */
export type CaptureDraft = Pick<
  FieldCapture,
  | 'captureType'
  | 'projectName'
  | 'location'
  | 'notes'
  | 'priority'
  | 'workerCount'
  | 'weather'
  | 'attachments'
>;

export interface AppState {
  captures: FieldCapture[];
  isOnline: boolean;
  isSyncing: boolean;
}

export const CAPTURE_TYPE_LABELS: Record<CaptureType, string> = {
  daily_log: 'Daily log',
  rfi: 'RFI',
  punchlist: 'Punch item',
  issue: 'Issue',
  inspection: 'Inspection',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
