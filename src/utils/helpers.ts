import 'react-native-get-random-values'; // polyfill for uuid
import {v4 as uuidv4} from 'uuid';
import {Attachment} from '../types';

export const generateId = (): string => uuidv4();

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** "Today, 14:32", "Yesterday, 09:10", "7 Oct, 16:05" — in the device's locale. */
export const formatTimestamp = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (sameDay(d, now)) {
    return `Today, ${time}`;
  }
  if (sameDay(d, yesterday)) {
    return `Yesterday, ${time}`;
  }
  const date = d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
  return `${date}, ${time}`;
};

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDuration = (seconds: number): string => {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const plural = (n: number, word: string) =>
  `${n} ${word}${n === 1 ? '' : 's'}`;

/** "Video · 0:12 · 1.2 MB" */
export const describeAttachment = (a: Attachment, withSize = true) =>
  [
    a.kind === 'video' ? 'Video' : 'Photo',
    a.durationSec != null ? formatDuration(a.durationSec) : null,
    withSize && a.sizeBytes ? formatBytes(a.sizeBytes) : null,
  ]
    .filter(Boolean)
    .join(' · ');
