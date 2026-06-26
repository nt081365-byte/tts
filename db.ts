import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { HistoryItem, TextFilterRule } from '../types';
import { defaultSystemRules } from './vietnormalizer';

interface TTSDB extends DBSchema {
  history: {
    key: string;
    value: HistoryItem;
    indexes: { 'by-date': number };
  };
  rules: {
    key: string;
    value: TextFilterRule;
  };
}

let dbPromise: Promise<IDBPDatabase<TTSDB>> | null = null;

async function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<TTSDB>('tts-app-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('by-date', 'createdAt');
        }
        if (!db.objectStoreNames.contains('rules')) {
          db.createObjectStore('rules', { keyPath: 'id' });
        }
      },
    });
    
    // Seed default rules if empty
    const db = await dbPromise;
    const count = await db.count('rules');
    if (count === 0) {
      const tx = db.transaction('rules', 'readwrite');
      for (const rule of defaultSystemRules) {
        await tx.store.put(rule);
      }
      await tx.done;
    }
  }
  return dbPromise;
}

export const db = {
  async getHistory(): Promise<HistoryItem[]> {
    const db = await initDB();
    return db.getAllFromIndex('history', 'by-date');
  },
  async addHistory(item: HistoryItem) {
    const db = await initDB();
    await db.put('history', item);
  },
  async deleteHistory(id: string) {
    const db = await initDB();
    await db.delete('history', id);
  },
  async clearHistory() {
    const db = await initDB();
    await db.clear('history');
  },
  async updateHistoryTitle(id: string, newTitle: string) {
    const db = await initDB();
    const item = await db.get('history', id);
    if (item) {
      item.title = newTitle;
      await db.put('history', item);
    }
  },
  async getRules(): Promise<TextFilterRule[]> {
    const db = await initDB();
    return db.getAll('rules');
  },
  async putRule(rule: TextFilterRule) {
    const db = await initDB();
    await db.put('rules', rule);
  },
  async deleteRule(id: string) {
    const db = await initDB();
    await db.delete('rules', id);
  }
};
