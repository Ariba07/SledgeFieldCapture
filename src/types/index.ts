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

export interface FieldCapture {
  id: string;              // uuid v4
  captureType: CaptureType;
  projectName: string;
  location: string;        // Section / level / grid reference
  notes: string;
  priority: Priority;
  workerCount?: number;    // Relevant for daily logs
  weather?: string;        // Relevant for daily logs (jobsite condition)
  photoUri?: string;       // Local file URI
  capturedAt: string;      // ISO 8601
  syncStatus: SyncStatus;
  syncedAt?: string;       // ISO 8601 — set once synced
  errorMessage?: string;   // Last sync error message
  retryCount: number;
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
