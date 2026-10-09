/**
 * StorageService – AsyncStorage persistence for captures.
 *
 * The SyncEngine owns the in-memory list and persists full snapshots through
 * `saveAll`. Writes are chained so they hit disk in call order: a slow write
 * can never land after (and overwrite) a newer one.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FieldCapture} from '../types';

const STORAGE_KEY = '@sledge_captures';

export interface CaptureStore {
  getAll(): Promise<FieldCapture[]>;
  saveAll(captures: FieldCapture[]): Promise<void>;
}

let writeChain: Promise<void> = Promise.resolve();

export const StorageService: CaptureStore & {clearAll(): Promise<void>} = {
  async getAll() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as FieldCapture[]) : [];
    } catch {
      return [];
    }
  },

  saveAll(captures) {
    const json = JSON.stringify(captures); // snapshot now, not when the write runs
    const write = writeChain.then(() => AsyncStorage.setItem(STORAGE_KEY, json));
    // Keep the chain alive even if this write fails; the caller still sees the error.
    writeChain = write.catch(() => {});
    return write;
  },

  async clearAll() {
    await writeChain;
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
