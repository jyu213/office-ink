import { CARD_MAP, DECKS, OPPONENTS } from './cards.js';
export const RULES_VERSION = 1;
export const MAX_HEALTH = 25;
export const MAX_HAND = 8;
export const MAX_BOARD = 5;
export const MAX_POTS = 3;
const clone = value => structuredClone(value);
const enemy = side => 1 - side;
function random(state) {
  let x = state.seed | 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  state.seed = x >>> 0;
  return state.seed / 4294967296;
}
function shuffle(state, cards) {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random(state) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function log(state, text, side = null, kind = 'normal') {
  state.log.push({ text, side, kind, turn: state.turn, id: state.nextId++ });
  if (state.log.length > 100) state.log.shift();
}
function damageHero(state, side, amount) {
  const player = state.players[side];
  const blocked = Math.min(player.armor, amount);
  player.armor -= blocked;
  player.health -= amount - blocked;
}
function addPots(state, target, count, source) {
  const player = state.players[target];
  const secretIndex = player.secrets.findIndex(card => card.id === 'receipts');
  if (source !== target && secretIndex >= 0) {
    player.secrets.splice(secretIndex, 1);
    damageHero(state, source, 3);
    log(state, `${player.name}亮出「我有聊天记录」：挂锅被反制，对手受到 3 点伤害。`, target, 'secret');
    return;
  }
  const added = Math.min(MAX_POTS - player.pots, count);
  player.pots += added;
  if (added) log(state, `${player.name}背上 ${added} 个锅。`, target, 'pot');
}
function draw(state, side, count = 1) {
  const player = state.players[side];
  for (let i = 0; i < count; i++) {
    if (!player.deck.length) {
      player.fatigue++;
      damageHero(state, side, player.fatigue);
      log(state, `${player.name}牌库已空，疲劳造成 ${player.fatigue} 点伤害。`, side, 'damage');
    } else {
      const id = player.deck.shift();
      if (player.hand.length < MAX_HAND) player.hand.push({ id, uid: `c${state.nextId++}` });
      else log(state, `${player.name}手牌已满，弃掉抽到的牌。`, side);
    }
  }
}
function settle(state) {
  let deaths = true;
  while (deaths) {
    deaths = false;
    for (let side = 0; side < 2; side++) {
      const dead = state.players[side].board.filter(unit => unit.health <= 0);
      state.players[side].board = state.players[side].board.filter(unit => unit.health > 0);
      for (const unit of dead) {
        deaths = true;
        log(state, `「${CARD_MAP[unit.id].name}」被击破。`, side);
        if (CARD_MAP[unit.id].effect === 'deathPot') addPots(state, enemy(side), 1, side);
      }
    }
  }
  const lost = state.players.map(player => player.health <= 0);
  if (lost[0] || lost[1]) {
    state.status = 'finished';
    state.winner = lost[0] && lost[1] ? 'draw' : lost[0] ? 1 : 0;
    log(state, state.winner === 'draw' ? '两边心态同时归零，本局平局。' : `${state.players[state.winner].name}赢下了这一局。`, null, 'finish');
  }
}
function startTurn(state, side) {
  state.active = side;
  state.turn++;
  const player = state.players[side];
  player.maxEnergy = Math.min(8, player.maxEnergy + 1);
  player.energy = player.maxEnergy;
  player.spellsPlayed = 0;
  for (const unit of player.board) {
    unit.ready = unit.frozen === 0;
    if (unit.frozen > 0) unit.frozen--;
    if (CARD_MAP[unit.id].effect === 'startArmor') player.armor++;
  }
  log(state, `${player.name}的回合 · ${player.energy} 点精力`, side, 'turn');
  draw(state, side);
  settle(state);
}
export function createGame({ deckId = 'blame', difficulty = 'normal', seed = Date.now() >>> 0 } = {}) {
  if (!DECKS.some(deck => deck.id === deckId) || !OPPONENTS.some(item => item.id === difficulty)) throw new Error('无效的套牌或对手');
  const state = { rulesVersion: RULES_VERSION, id: globalThis.crypto?.randomUUID?.() || `match-${Date.now()}-${seed}`, startedAt: Date.now(), seed: seed || 1, nextId: 1, difficulty, deckId, turn: 0, active: 0, status: 'playing', winner: null, log: [], players: [] };
  const opponentDeck = difficulty === 'hard' ? 'control' : difficulty === 'easy' ? 'combo' : 'blame';
  for (const [side, id] of [deckId, opponentDeck].entries()) {
    const recipe = DECKS.find(deck => deck.id === id);
    state.players.push({ name: side === 0 ? '你' : OPPONENTS.find(item => item.id === difficulty).name, deckId: id, health: MAX_HEALTH, armor: 0, energy: 0, maxEnergy: 0, pots: 0, fatigue: 0, spellsPlayed: 0, deck: shuffle(state, recipe.cards.flatMap(card => [card, card])), hand: [], board: [], secrets: [] });
    draw(state, side, 4);
  }
  startTurn(state, 0);
  return state;
}
function spellTargets(state, side, card) {
  const other = enemy(side);
  if (!card.target) return [null];
  if (card.target === 'allyUnit') return state.players[side].board.map(unit => ({ side, id: unit.uid }));
  const targets = state.players[other].board.filter(unit => card.target !== 'weakEnemy' || unit.attack <= 3).map(unit => ({ side: other, id: unit.uid }));
  if (card.target === 'enemy') targets.unshift({ side: other, id: 'hero' });
  return targets;
}
export function legalActions(state) {
  if (state.status !== 'playing') return [];
  const side = state.active;
  const player = state.players[side];
  const opponent = state.players[enemy(side)];
  const actions = [];
  for (const instance of player.hand) {
    const card = CARD_MAP[instance.id];
    if (!card || card.cost > player.energy) continue;
    if (card.type === 'unit' && player.board.length >= MAX_BOARD) continue;
    if (card.type === 'secret' && player.secrets.some(secret => secret.id === card.id)) continue;
    if (card.effect === 'transfer' && player.pots === 0) continue;
    for (const target of spellTargets(state, side, card)) actions.push({ type: 'play', uid: instance.uid, ...(target ? { target } : {}) });
  }
  const guards = opponent.board.filter(unit => CARD_MAP[unit.id].tags?.includes('guard'));
  const targets = guards.length ? guards.map(unit => ({ side: enemy(side), id: unit.uid })) : [{ side: enemy(side), id: 'hero' }, ...opponent.board.map(unit => ({ side: enemy(side), id: unit.uid }))];
  for (const unit of player.board) if (unit.ready && unit.attack > 0) for (const target of targets) actions.push({ type: 'attack', uid: unit.uid, target });
  if (player.pots > 0 && player.energy > 0) actions.push({ type: 'resolve' });
  actions.push({ type: 'end' });
  return actions;
}
const key = action => `${action.type}|${action.uid || ''}|${action.target?.side ?? ''}|${action.target?.id || ''}`;
export function isLegalAction(state, action) { return legalActions(state).some(legal => key(legal) === key(action)); }
function hit(state, target, amount) {
  if (target.id === 'hero') damageHero(state, target.side, amount);
  else state.players[target.side].board.find(unit => unit.uid === target.id).health -= amount;
}
export function applyAction(original, action) {
  if (!isLegalAction(original, action)) throw new Error('当前无法进行此操作');
  const state = clone(original);
  const side = state.active;
  const other = enemy(side);
  const player = state.players[side];
  const opponent = state.players[other];
  if (action.type === 'play') {
    const index = player.hand.findIndex(card => card.uid === action.uid);
    const instance = player.hand.splice(index, 1)[0];
    const card = CARD_MAP[instance.id];
    const combo = player.spellsPlayed > 0;
    player.energy -= card.cost;
    log(state, `${player.name}${card.type === 'secret' ? '埋下一张伏笔' : `打出「${card.name}」`}${card.type !== 'secret' && combo && card.tags?.includes('combo') ? '，连击触发！' : '。'}`, side, card.tags?.includes('combo') && combo ? 'combo' : 'play');
    if (card.type === 'unit') {
      player.board.push({ ...instance, attack: card.attack, health: card.health, maxHealth: card.health, ready: !!card.tags?.includes('haste'), frozen: 0 });
      if (card.effect === 'pot') addPots(state, other, 1, side);
      if (card.effect === 'draw') draw(state, side);
      if (card.effect === 'sweep') opponent.board.forEach(unit => unit.health -= 2);
    } else if (card.type === 'secret') player.secrets.push(instance);
    else {
      switch (card.effect) {
        case 'ack': player.armor += 3; draw(state, side); break;
        case 'supplement': hit(state, action.target, combo ? 4 : 2); break;
        case 'transfer': { const count = Math.min(2, player.pots); player.pots -= count; addPots(state, other, count, side); break; }
        case 'minutes': hit(state, action.target, opponent.pots ? 5 : 3); break;
        case 'freeze': { const unit = opponent.board.find(unit => unit.uid === action.target.id); unit.frozen = 1; unit.ready = false; draw(state, side); break; }
        case 'coffee': player.health = Math.min(MAX_HEALTH, player.health + 4); draw(state, side); break;
        case 'overtime': player.energy += 2; damageHero(state, side, 2); break;
        case 'align': opponent.board.forEach(unit => unit.health -= 2); break;
        case 'circle': draw(state, side, 2); addPots(state, side, 1, side); break;
        case 'buff': { const unit = player.board.find(unit => unit.uid === action.target.id); unit.attack += 2; unit.health += 2; unit.maxHealth += 2; break; }
        case 'fire': opponent.board.forEach(unit => unit.health -= 3); damageHero(state, other, 3); break;
        case 'remove': opponent.board.find(unit => unit.uid === action.target.id).health = 0; break;
      }
      player.spellsPlayed++;
    }
  } else if (action.type === 'attack') {
    const unit = player.board.find(unit => unit.uid === action.uid);
    unit.ready = false;
    if (action.target.id === 'hero') {
      const secretIndex = opponent.secrets.findIndex(secret => secret.id === 'quiet');
      if (secretIndex >= 0) {
        opponent.secrets.splice(secretIndex, 1);
        opponent.armor += 5;
        log(state, `${opponent.name}亮出「你先别急」，获得 5 点护盾。`, other, 'secret');
      }
      damageHero(state, other, unit.attack);
      log(state, `「${CARD_MAP[unit.id].name}」向${opponent.name}施压 ${unit.attack} 点。`, side, 'damage');
    } else {
      const target = opponent.board.find(target => target.uid === action.target.id);
      target.health -= unit.attack;
      unit.health -= target.attack;
      log(state, `「${CARD_MAP[unit.id].name}」与「${CARD_MAP[target.id].name}」交锋。`, side, 'damage');
    }
  } else if (action.type === 'resolve') {
    player.energy--; player.pots--;
    log(state, `${player.name}花费 1 点精力，处理了 1 个锅。`, side, 'pot');
  } else if (action.type === 'end') {
    for (const unit of player.board) if (CARD_MAP[unit.id].effect === 'endPot') addPots(state, other, 1, side);
    if (player.pots) {
      const amount = player.pots * 2;
      damageHero(state, side, amount);
      log(state, `${player.name}的锅结算，受到 ${amount} 点伤害。`, side, 'pot');
      player.pots = 0;
    }
    settle(state);
    if (state.status === 'playing') startTurn(state, other);
    return state;
  }
  settle(state);
  return state;
}
function evaluate(state, side) {
  if (state.status === 'finished') return state.winner === 'draw' ? 0 : state.winner === side ? 100000 : -100000;
  const value = (player, own) => player.health * (own ? 2 : 2.35) + player.armor * 1.2 - player.pots * (own ? 1.7 : 1.2) + player.hand.length * 0.8 + player.energy * 0.12 + player.board.reduce((sum, unit) => sum + unit.attack * 1.4 + unit.health * 0.6 + (CARD_MAP[unit.id].tags?.includes('guard') ? 0.6 : 0) + (CARD_MAP[unit.id].effect === 'endPot' ? 1.5 : 0), 0);
  return value(state.players[side], true) - value(state.players[enemy(side)], false);
}
export function chooseAIAction(state, difficulty = state.difficulty) {
  const side = state.active;
  // 搜索只看公开信息，避免读取人类手牌、伏笔和抽牌顺序。
  const visible = clone(state);
  const rival = visible.players[enemy(side)];
  rival.hand = rival.hand.map(card => ({ ...card, id: 'unknown' }));
  rival.secrets = rival.secrets.map(card => ({ ...card, id: 'unknown' }));
  rival.deck = rival.deck.map(() => 'unknown');
  visible.players[side].deck = shuffle({ seed: 82937 + state.turn }, visible.players[side].deck);
  const actions = legalActions(visible);
  const baseline = evaluate(visible, side);
  const ranked = actions.map(action => {
    const next = action.type === 'end' ? visible : applyAction(visible, action);
    return { action, next, score: action.type === 'end' ? baseline - 0.01 : evaluate(next, side) };
  }).sort((a, b) => b.score - a.score);
  if (difficulty === 'easy') {
    const playable = ranked.filter(item => item.action.type !== 'end' && item.score >= baseline - 3);
    if (!playable.length) return { type: 'end' };
    const position = (state.seed + state.nextId * 7) % Math.min(playable.length, 5);
    return playable[position].action;
  }
  if (difficulty === 'hard') {
    for (const item of ranked.slice(0, 8)) {
      if (item.action.type === 'end' || item.next.status !== 'playing') continue;
      let best = item.score;
      for (const follow of legalActions(item.next).filter(action => action.type !== 'end')) best = Math.max(best, evaluate(applyAction(item.next, follow), side));
      item.score = best + item.score * 0.001;
    }
    ranked.sort((a, b) => b.score - a.score);
  }
  return ranked[0]?.action || { type: 'end' };
}
export function validSavedGame(value) {
  return value?.rulesVersion === RULES_VERSION && value.status === 'playing' && Array.isArray(value.players) && value.players.length === 2 && DECKS.some(deck => deck.id === value.deckId) && OPPONENTS.some(item => item.id === value.difficulty) && value.players.every(player => Array.isArray(player.hand) && Array.isArray(player.board) && Array.isArray(player.deck) && player.hand.every(card => CARD_MAP[card.id]) && player.deck.every(id => CARD_MAP[id]) && player.board.every(card => CARD_MAP[card.id])) && [0, 1].includes(value.active);
}
