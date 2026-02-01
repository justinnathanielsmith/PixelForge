
import { openDB, IDBPDatabase } from 'idb';
import { GeneratedArt } from '../domain/entities';

const DB_NAME = 'PixelForgeDB';
const DB_VERSION = 2;
const STORE_NAME = 'art_history';
const SESSION_STORE = 'session_data';

export class PixelDatabase {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SESSION_STORE)) {
          db.createObjectStore(SESSION_STORE);
        }
      },
    });
  }

  async getAllHistory(): Promise<GeneratedArt[]> {
    const db = await this.dbPromise;
    const items = await db.getAll(STORE_NAME);
    // Sort by timestamp descending
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }

  async putArt(art: GeneratedArt): Promise<void> {
    const db = await this.dbPromise;
    await db.put(STORE_NAME, art);
    // Limit removed to support hundreds of items as requested
  }

  async deleteArt(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, id);
  }

  async getSessionValue(key: string): Promise<any> {
    const db = await this.dbPromise;
    return await db.get(SESSION_STORE, key);
  }

  async putSessionValue(key: string, value: any): Promise<void> {
    const db = await this.dbPromise;
    await db.put(SESSION_STORE, value, key);
  }
}

export const pixelDB = new PixelDatabase();
