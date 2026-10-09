import 'react-native-get-random-values'; // polyfill for uuid
import {v4 as uuidv4} from 'uuid';

export const generateId = (): string => uuidv4();

export const formatTimestamp = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
