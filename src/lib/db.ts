import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AppDB extends DBSchema {
  cache: {
    key: string;
    value: any;
    indexes: { 'by-updated': number };
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>('pinpro-catalog-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
};

export const saveToLocalCache = async (data: any) => {
  try {
    const db = await initDB();
    await db.put('cache', { ...data, updatedAt: Date.now() });
  } catch (err) {
    console.error('[IDB] Error saving cache:', err);
  }
};

export const getFromLocalCache = async (id: string) => {
  try {
    const db = await initDB();
    return await db.get('cache', id);
  } catch (err) {
    console.error('[IDB] Error reading cache:', err);
    return null;
  }
};

export const getAllLocalCache = async () => {
  try {
    const db = await initDB();
    return await db.getAll('cache');
  } catch (err) {
    console.error('[IDB] Error reading all cache:', err);
    return [];
  }
};
