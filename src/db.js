const DB_NAME = 'heavy-duty-personal';
let connection;
export function openDatabase() {
  if (!connection) connection = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('app');
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); connection = undefined; };
      resolve(db);
    };
    request.onerror = () => { connection = undefined; reject(request.error); };
    request.onblocked = () => { connection = undefined; reject(new Error('Cierra las otras pestañas para abrir los datos.')); };
  });
  return connection;
}
export async function loadState() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('app', 'readonly');
    const request = transaction.objectStore('app').get('state');
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
export async function saveState(state) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('app', 'readwrite');
    transaction.objectStore('app').put(state, 'state');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

// Read-modify-write in one transaction prevents another tab from losing a log.
export async function updateState(updater) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('app', 'readwrite');
    const store = transaction.objectStore('app');
    const request = store.get('state');
    let next;
    request.onsuccess = () => {
      try { next = updater(request.result); store.put(next, 'state'); }
      catch (error) { transaction.abort(); reject(error); }
    };
    transaction.oncomplete = () => resolve(next);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
