import { validCustomDeck } from './custom-decks.js';

const DB_NAME = 'office-ink';
const CUSTOM_DECK_PREFIX = 'custom-deck:';
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
    const tutorial = tx.objectStore('kv').get('tutorial');
    const dungeon = tx.objectStore('kv').get('dungeon');
    const decks = tx.objectStore('kv').getAll(IDBKeyRange.bound(CUSTOM_DECK_PREFIX, `${CUSTOM_DECK_PREFIX}\uffff`));
    const matches = tx.objectStore('matches').getAll();
    tx.oncomplete = () => resolve({ settings: settings.result || {}, game: game.result || null, tutorial: tutorial.result || null, dungeon: dungeon.result || null, customDecks: decks.result.filter(deck => validCustomDeck(deck)), matches: matches.result || [] });
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
async function writeCustomDeck(id, deck) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    const store = tx.objectStore('kv');
    const key = CUSTOM_DECK_PREFIX + id;
    if (deck) store.put(deck, key);
    else store.delete(key);
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(tx.error || new Error('自组套牌保存失败'));
  });
}
export async function saveCustomDeck(deck) {
  if (!validCustomDeck(deck)) throw new Error('自组套牌无效');
  await writeCustomDeck(deck.id, deck);
}
export function deleteCustomDeck(id) {
  return writeCustomDeck(id, null);
}

export function matchRecord(game) {
  return { id: game.id, startedAt: game.startedAt, endedAt: Date.now(), deckId: game.deckId,
    ...(game.customDeck ? { deckName: game.customDeck.name } : {}), difficulty: game.difficulty,
    winner: game.winner, turns: Math.ceil(game.turn / 2) };
}

export async function saveGame(game) {
  if (game.mode === 'tutorial') throw new Error('教学进度应独立保存');
  if (game.mode === 'dungeon') throw new Error('副本进度应独立保存');
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['kv', 'matches'], 'readwrite');
    tx.objectStore('kv').put(game, 'current');
    if (game.status === 'finished') tx.objectStore('matches').put(matchRecord(game));
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(tx.error || new Error('存档失败'));
  });
}

export async function saveTutorial(tutorial) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    if (tutorial.completed) tx.objectStore('kv').delete('tutorial');
    else tx.objectStore('kv').put(tutorial, 'tutorial');
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(tx.error || new Error('教学进度保存失败'));
  });
}

export async function saveDungeon(run) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(run, 'dungeon');
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(tx.error || new Error('副本进度保存失败'));
  });
}
