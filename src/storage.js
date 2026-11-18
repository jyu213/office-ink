const DB_NAME = 'office-ink';
let connection;
export async function openDatabase() {
  if (connection) return connection;
  connection = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('matches')) db.createObjectStore('matches', { keyPath: 'id' });
    };
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); connection = null; }; resolve(request.result); };
    request.onerror = () => { connection = null; reject(request.error); };
    request.onblocked = () => { connection = null; reject(new Error('请关闭旧版本页面后重试')); };
  });
  return connection;
}
export async function loadLocalData() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['kv', 'matches'], 'readonly');
    const settings = tx.objectStore('kv').get('settings');
    const game = tx.objectStore('kv').get('current');
    const matches = tx.objectStore('matches').getAll();
    tx.oncomplete = () => resolve({ settings: settings.result || {}, game: game.result || null, matches: matches.result || [] });
    tx.onerror = tx.onabort = () => reject(tx.error || new Error('读取失败'));
  });
}
export async function saveSettings(settings) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(settings, 'settings');
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(tx.error || new Error('保存失败'));
  });
}
export async function saveGame(game) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['kv', 'matches'], 'readwrite');
    tx.objectStore('kv').put(game, 'current');
    if (game.status === 'finished') tx.objectStore('matches').put({ id: game.id, startedAt: game.startedAt, endedAt: Date.now(), deckId: game.deckId, difficulty: game.difficulty, winner: game.winner, turns: Math.ceil(game.turn / 2) });
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(tx.error || new Error('存档失败'));
  });
}
