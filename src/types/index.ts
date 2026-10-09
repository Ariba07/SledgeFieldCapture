// ──────────────────────────────────────────────────────────────────────────────
//  Core domain types for Sledge Field Capture
//  Domain: Construction AI — built for jobsite use (offline, gloves on, bad signal)
// ──────────────────────────────────────────────────────────────────────────────

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

/**
 * The type of construction field record being captured.
 * Mirrors real Sledge product features visible on their site.
 */
export type CaptureType =
  | 'daily_log'    // Daily progress logs
  | 'rfi'          // Request for Information
  | 'punchlist'    // Punchlist / deficiency item
  | 'issue'        // General site issue / observation
  | 'inspection';  // Inspection checkpoint

export type Priority = 'low' | 'medium' | 'high';

export type AttachmentKind = 'photo' | 'video';

export interface Attachment {
  id: string;              // uuid v4
  kind: AttachmentKind;
  fileName: string;        // Under <Documents>/attachments — the absolute path is rebuilt at
                           // runtime because the iOS app container path changes on reinstall
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSec?: number;    // Videos only
  remoteUrl?: string;      // Set once uploaded; uploaded files are skipped on retry
}

export interface FieldCapture {
  id: string;              // uuid v4
  captureType: CaptureType;
  projectName: string;
  location: string;        // Section / level / grid reference
  notes: string;
  priority: Priority;
  workerCount?: number;    // Relevant for daily logs
  weather?: string;        // Relevant for daily logs (jobsite condition)
  attachments?: Attachment[]; // Photos / videos, uploaded before the record itself
  capturedAt: string;      // ISO 8601
  syncStatus: SyncStatus;
  syncedAt?: string;       // ISO 8601 — set once synced
  errorMessage?: string;   // Last sync error message
  retryCount: number;      // Failed attempts since last manual retry
  nextRetryAt?: string;    // ISO 8601 — earliest time an automatic retry may run
}

export interface AppState {
  captures: FieldCapture[];
  isOnline: boolean;
  isSyncing: boolean;
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const CAPTURE_TYPE_LABELS: Record<CaptureType, string> = {
  daily_log:  '📋 Daily Log',
  rfi:        '❓ RFI',
  punchlist:  '✅ Punchlist',
  issue:      '⚠️ Issue',
  inspection: '🔍 Inspection',
};

export const PRIORITY_LABELS: Record<Priority, {label: string; color: string}> = {
  low:    {label: 'Low',    color: '#6B7280'},
  medium: {label: 'Medium', color: '#F59E0B'},
  high:   {label: 'High',   color: '#EF4444'},
};
