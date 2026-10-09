import AsyncStorage from '@react-native-async-storage/async-storage';
import {FieldCapture} from '../types';

const STORAGE_KEY = '@sledge_captures';

export const StorageService = {
  async getAll(): Promise<FieldCapture[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as FieldCapture[]) : [];
    } catch {
      return [];
    }
  },

  async save(capture: FieldCapture): Promise<void> {
    const all = await this.getAll();
    const idx = all.findIndex(c => c.id === capture.id);
    if (idx >= 0) {
      all[idx] = capture;
    } else {
      all.unshift(capture); // newest first
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  async update(
    id: string,
    patch: Partial<FieldCapture>,
  ): Promise<FieldCapture | null> {
    const all = await this.getAll();
    const idx = all.findIndex(c => c.id === id);
    if (idx < 0) {return null;}
    all[idx] = {...all[idx], ...patch};
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return all[idx];
  },

  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter(c => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
