
import { openDB, IDBPDatabase } from 'idb';
import { GeneratedArt } from '../domain/entities';

const DB_NAME = 'PixelForgeDB';
const DB_VERSION = 1;
const STORE_NAME = 'art_history';

export class PixelDatabase {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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
    
    // Optional: Keep only last 48 items to prevent disk bloat over time
    const all = await this.getAllHistory();
    if (all.length > 48) {
      const toDelete = all.slice(48);
      for (const item of toDelete) {
        await db.delete(STORE_NAME, item.id);
      }
    }
  }

  async deleteArt(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(STORE_NAME, id);
  }
}

export const pixelDB = new PixelDatabase();
