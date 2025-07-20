const DB_NAME = 'TabSenseDB';
const DB_VERSION = 1;
const STORE_NAME = 'archivedTabs';

let db;

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject('Error opening IndexedDB');
    };
  });
};

export const addArchivedTab = (tab, notes) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add({ ...tab, notes });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject('Error adding tab to archive');
    };
  });
};

export const getArchivedTabs = () => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject('Error getting archived tabs');
    };
  });
};

export const removeArchivedTab = (tabId) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(tabId);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject('Error removing tab from archive');
    };
  });
}; 