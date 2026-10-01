import { safeStringify } from '../lib/jsonUtils';

const CACHE_PREFIX = 'pinpro_cache_';

export const cacheService = {
  setItem: (key: string, value: any) => {
    try {
      // NOTE: This stores data in plain localstorage.
      // Do not store highly sensitive PII if not absolutely necessary.

      const safeString = safeStringify(value);
      localStorage.setItem(CACHE_PREFIX + key, safeString);
    } catch (e) {
      console.error('Error caching data:', e);
    }
  },
  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error retrieving from cache:', e);
      return null;
    }
  }
};
