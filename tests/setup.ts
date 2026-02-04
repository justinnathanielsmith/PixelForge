
// Mock indexedDB classes
if (!globalThis.IDBRequest) globalThis.IDBRequest = class {} as any;
if (!globalThis.IDBTransaction) globalThis.IDBTransaction = class {} as any;
if (!globalThis.IDBKeyRange) globalThis.IDBKeyRange = class {} as any;
if (!globalThis.IDBCursor) globalThis.IDBCursor = class {} as any;
if (!globalThis.IDBDatabase) globalThis.IDBDatabase = class {} as any;
if (!globalThis.IDBObjectStore) globalThis.IDBObjectStore = class {} as any;
if (!globalThis.IDBIndex) globalThis.IDBIndex = class {} as any;
if (!globalThis.IDBFactory) globalThis.IDBFactory = class {} as any;
if (!globalThis.IDBOpenDBRequest) globalThis.IDBOpenDBRequest = class extends globalThis.IDBRequest {} as any;

// Mock indexedDB
if (!globalThis.indexedDB) {
  globalThis.indexedDB = {
    open: () => {
        const req = new globalThis.IDBOpenDBRequest();
        req.addEventListener = () => {};
        req.removeEventListener = () => {};

        setTimeout(() => {
             req.result = {
                objectStoreNames: { contains: () => false },
                createObjectStore: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
             };
             if (req.onsuccess) req.onsuccess({ target: req } as any);
        }, 0);
        return req;
    },
  } as any;
}
