import { Platform } from 'react-native';

// Thin cross-platform key/value store. On web we use localStorage so values
// persist between sessions; on native we fall back to an in-memory map so the
// app still runs without an additional dependency.
type Store = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function createMemoryStore(): Store {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

function resolveStore(): Store {
  if (Platform.OS === 'web') {
    const w = globalThis as typeof globalThis & {
      localStorage?: Storage;
    };
    if (w.localStorage) {
      return {
        getItem: (key) => w.localStorage!.getItem(key),
        setItem: (key, value) => w.localStorage!.setItem(key, value),
        removeItem: (key) => w.localStorage!.removeItem(key),
      };
    }
  }
  return createMemoryStore();
}

const store = resolveStore();

export const STORAGE_KEYS = {
  hasCompletedOnboarding: 'hasCompletedOnboarding',
  selectedInterests: 'selectedInterests',
  savedItems: 'savedItems',
  viewedItems: 'viewedItems',
} as const;

export interface ViewedItems {
  news: string[];
  concept: string[];
}

export const EMPTY_VIEWED: ViewedItems = { news: [], concept: [] };

export function getBool(key: string): boolean {
  return store.getItem(key) === 'true';
}

export function setBool(key: string, value: boolean): void {
  store.setItem(key, value ? 'true' : 'false');
}

export function getJSON<T>(key: string, fallback: T): T {
  const raw = store.getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJSON<T>(key: string, value: T): void {
  store.setItem(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  store.removeItem(key);
}
