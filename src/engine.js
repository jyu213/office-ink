import { CARD_MAP, DECKS, OPPONENTS } from './cards.js';
import { validCustomDeck } from './custom-decks.js';
export const RULES_VERSION = 2;
export const MAX_HEALTH = 25;
export const MAX_HAND = 8;
export const MAX_BOARD = 5;
export const MAX_POTS = 3;
const clone = value => structuredClone(value);
const enemy = side => 1 - side;
const deckOf = player => DECKS.find(deck => deck.id === player.deckId);
const effectOf = unit => unit.silenced ? null : CARD_MAP[unit.id].effect;
export const unitTags = unit => unit.silenced ? [] : CARD_MAP[unit.id].tags || [];
export const cardCost = (player, card) => Math.max(0, card.cost - (card.type === 'spell' ? player.spellDiscount || 0 : 0));
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
  const before = Math.max(0, player.health);
  const blocked = Math.min(player.armor, amount);
  player.armor -= blocked;
  player.health -= amount - blocked;
  return before - Math.max(0, player.health);
}
function addPots(state, target, count, source) {
  const player = state.players[target];
  const secretIndex = player.secrets.findIndex(card => card.id === 'receipts');
  if (source !== target && secretIndex >= 0) {
    player.secrets.splice(secretIndex, 1);
    damageHero(state, source, 3);
    log(state, `${player.name}亮出「我这有留痕」：挂锅被反制，对手受到 3 点伤害。`, target, 'secret');
    return;
  }
  const added = Math.min(MAX_POTS - player.pots, count);
  player.pots += added;
  if (added) log(state, `${player.name}背上 ${added} 个锅。`, target, 'pot');
}
function putInHand(state, side, id) {
  const player = state.players[side];
  if (player.hand.length < MAX_HAND) player.hand.push({ id, uid: `c${state.nextId++}` });
  else log(state, `${player.name}手牌已满，弃掉进入手牌的牌。`, side);
}
function draw(state, side, count = 1) {
  const player = state.players[side];
  for (let i = 0; i < count; i++) {
    if (!player.deck.length) {
      player.fatigue++;
      damageHero(state, side, player.fatigue);
      log(state, `${player.name}牌库已空，疲劳造成 ${player.fatigue} 点伤害。`, side, 'damage');
    } else putInHand(state, side, player.deck.shift());
  }
}
function grow(unit, attack, health = 0) {
  unit.attack += attack; unit.health += health; unit.maxHealth += health;
}
function summon(state, side, id, instance = null, health = null) {
  const player = state.players[side];
  if (player.board.length >= MAX_BOARD) return;
  const card = CARD_MAP[id];
  for (const ally of player.board) if (effectOf(ally) === 'summonGrow') grow(ally, 1);
  const unit = { id, uid: instance?.uid || `u${state.nextId++}`, attack: card.attack, health: health ?? card.health, maxHealth: card.health, ready: !!card.tags?.includes('haste'), frozen: 0, silenced: false };
  player.board.push(unit);
  return unit;
}
function settle(state) {
  if (state.status !== 'playing') return;
  while (true) {
    const deaths = state.players.flatMap((player, side) => player.board.filter(unit => unit.health <= 0).map(unit => ({ side, unit })));
    if (!deaths.length) break;
    for (const player of state.players) player.board = player.board.filter(unit => unit.health > 0);
    for (const { side, unit } of deaths) {
      const player = state.players[side];
      if (!CARD_MAP[unit.id].temporary) player.graveyard.push(unit.id);
      log(state, `「${CARD_MAP[unit.id].name}」被击破。`, side);
      for (const ally of player.board) if (effectOf(ally) === 'deathGrow') grow(ally, 1, 1);
      if (effectOf(unit) === 'deathPot') addPots(state, enemy(side), 1, side);
      if (effectOf(unit) === 'deathToken') summon(state, side, 'helper');
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
  state.active = side; state.turn++;
  const player = state.players[side];
  player.maxEnergy = Math.min(8, player.maxEnergy + 1);
  player.energy = player.maxEnergy;
  player.spellsPlayed = 0; player.powerUsed = false; player.spellDiscount = 0;
  for (const unit of player.board) {
    unit.ready = unit.frozen === 0;
    if (unit.frozen > 0) unit.frozen--;
    if (effectOf(unit) === 'startArmor') player.armor++;
  }
  log(state, `${player.name}的回合 · ${player.energy} 点精力`, side, 'turn');
  const pressure = side === 1 ? state.bossPressure : null;
  if (pressure && (state.turn / 2) % pressure.every === 0) {
    damageHero(state, 0, pressure.damage);
    log(state, `${player.name}发动「${pressure.name}」：你受到 ${pressure.damage} 点伤害。`, 1, 'power');
  }
  if (state.players[0].health > 0) draw(state, side);
  settle(state);
}
export function createGame({ deckId = 'blame', difficulty = 'normal', opponentDeckId = 'random', customDeck = null, seed = Date.now() >>> 0 } = {}) {
  if (customDeck !== null) {
    if (!validCustomDeck(customDeck, { complete: true })) throw new Error('自组套牌需要 20 张牌，每张最多 2 张。');
    deckId = customDeck.baseDeckId;
  }
  if (!DECKS.some(deck => deck.id === deckId) || !OPPONENTS.some(item => item.id === difficulty) || opponentDeckId !== 'random' && !DECKS.some(deck => deck.id === opponentDeckId)) throw new Error('无效的套牌或对手');
  const state = { rulesVersion: RULES_VERSION, id: globalThis.crypto?.randomUUID?.() || `match-${Date.now()}-${seed}`, startedAt: Date.now(), seed: seed || 1, nextId: 1, difficulty, deckId, turn: 0, active: 0, status: 'playing', winner: null, log: [], players: [] };
  if (customDeck) state.customDeck = clone(customDeck);
  const opponentDeck = opponentDeckId === 'random' ? DECKS[Math.floor(random(state) * DECKS.length)].id : opponentDeckId;
  for (const [side, id] of [deckId, opponentDeck].entries()) {
    const recipe = DECKS.find(deck => deck.id === id);
    const cards = side === 0 && customDeck ? customDeck.cards : recipe.cards.flatMap(card => [card, card]);
    state.players.push({ name: side === 0 ? '你' : OPPONENTS.find(item => item.id === difficulty).name, deckId: id, health: MAX_HEALTH, armor: 0, energy: 0, maxEnergy: 0, pots: 0, fatigue: 0, spellsPlayed: 0, powerUsed: false, spellDiscount: 0, graveyard: [], deck: shuffle(state, cards), hand: [], board: [], secrets: [] });
    draw(state, side, 4);
  }
  putInHand(state, 1, 'coin');
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
function powerAvailable(state, side) {
  const player = state.players[side];
  const power = deckOf(player).power;
  if (player.powerUsed || player.energy < power.cost) return false;
  if (power.effect === 'pot' && state.players[enemy(side)].pots >= MAX_POTS) return false;
  if (power.effect === 'recruit' && player.board.length >= MAX_BOARD) return false;
  if (power.effect === 'recall' && (!player.graveyard.length || player.hand.length >= MAX_HAND)) return false;
  if (power.effect === 'discount' && player.hand.length >= MAX_HAND) return false;
  return true;
}
export function legalActions(state) {
  if (state.status !== 'playing') return [];
  const side = state.active;
  const player = state.players[side];
  const opponent = state.players[enemy(side)];
  const actions = [];
  for (const instance of player.hand) {
    const card = CARD_MAP[instance.id];
    if (!card || cardCost(player, card) > player.energy) continue;
    if (card.type === 'unit' && player.board.length >= MAX_BOARD) continue;
    if (card.type === 'secret' && player.secrets.some(secret => secret.id === card.id)) continue;
    if (card.effect === 'armorStrike' && player.armor === 0) continue;
    if (['recruit', 'revive'].includes(card.effect) && player.board.length >= MAX_BOARD) continue;
    if (card.effect === 'revive' && !player.graveyard.length) continue;
    if (['rally', 'promotion'].includes(card.effect) && !player.board.length) continue;
    for (const target of spellTargets(state, side, card)) actions.push({ type: 'play', uid: instance.uid, ...(target ? { target } : {}) });
  }
  const guards = opponent.board.filter(unit => unitTags(unit).includes('guard'));
  const targets = guards.length ? guards.map(unit => ({ side: enemy(side), id: unit.uid })) : [{ side: enemy(side), id: 'hero' }, ...opponent.board.map(unit => ({ side: enemy(side), id: unit.uid }))];
  for (const unit of player.board) if (unit.ready && unit.attack > 0) for (const target of targets) actions.push({ type: 'attack', uid: unit.uid, target });
  if (player.pots > 0 && player.energy > 0) actions.push({ type: 'resolve' });
  if (powerAvailable(state, side)) actions.push({ type: 'power' });
  actions.push({ type: 'end' });
  return actions;
}
const key = action => `${action.type}|${action.uid || ''}|${action.target?.side ?? ''}|${action.target?.id || ''}`;
export function isLegalAction(state, action) { return legalActions(state).some(legal => key(legal) === key(action)); }
function hit(state, target, amount) {
  if (target.id === 'hero') return damageHero(state, target.side, amount);
  const unit = state.players[target.side].board.find(unit => unit.uid === target.id);
  const dealt = Math.min(Math.max(0, unit.health), amount);
  unit.health -= amount;
  return dealt;
}
function usePower(state, side) {
  const player = state.players[side];
  const power = deckOf(player).power;
  player.energy -= power.cost; player.powerUsed = true;
  log(state, `${player.name}使用流派技能「${power.name}」。`, side, 'power');
  switch (power.effect) {
    case 'pot': addPots(state, enemy(side), 1, side); break;
    case 'discount': draw(state, side); player.spellDiscount = 1; break;
    case 'order': player.armor += 2; player.pots = Math.max(0, player.pots - 1); break;
    case 'rest': player.health = Math.min(player.maxHealth ?? MAX_HEALTH, player.health + 2); player.armor += 2; break;
    case 'recruit': summon(state, side, 'helper'); break;
    case 'recall': putInHand(state, side, player.graveyard.pop()); break;
  }
}
export function spellDamage(card, player, opponent) {
  switch (card.effect) {
    case 'supplement': return player.spellsPlayed ? 4 : 2;
    case 'chainDamage': return Math.min(4, 1 + player.spellsPlayed);
    case 'minutes': return opponent.pots ? 5 : 3;
    case 'cashPots': return 2 + opponent.pots * 3;
    case 'armorStrike': return Math.min(6, player.armor);
  }
}

export const hasGuard = player => player.board.some(unit => unitTags(unit).includes('guard'));
export const transferPotCount = player => Math.min(2, player.pots);

function spellEffect(state, side, card, action) {
  const player = state.players[side], opponent = state.players[enemy(side)];
  switch (card.effect) {
    case 'ack': player.armor += 3; draw(state, side); break;
    case 'supplement':
    case 'chainDamage':
    case 'minutes': hit(state, action.target, spellDamage(card, player, opponent)); break;
    case 'transfer': { const count = transferPotCount(player); player.pots -= count; addPots(state, enemy(side), count || 1, side); break; }
    case 'freeze': { const unit = opponent.board.find(unit => unit.uid === action.target.id); unit.frozen = 1; unit.ready = false; draw(state, side); break; }
    case 'coffee': player.health = Math.min(player.maxHealth ?? MAX_HEALTH, player.health + 4); draw(state, side); break;
    case 'overtime': player.energy += 2; damageHero(state, side, 2); break;
    case 'coin': player.energy++; break;
    case 'align': opponent.board.forEach(unit => unit.health -= 2); break;
    case 'circle': draw(state, side, 2); addPots(state, side, 1, side); break;
    case 'buff': grow(player.board.find(unit => unit.uid === action.target.id), 2, 2); break;
    case 'fire': opponent.board.forEach(unit => unit.health -= 3); damageHero(state, enemy(side), 3); break;
    case 'remove': opponent.board.find(unit => unit.uid === action.target.id).health = 0; break;
    case 'silence': opponent.board.find(unit => unit.uid === action.target.id).silenced = true; break;
    case 'bounce': { const index = opponent.board.findIndex(unit => unit.uid === action.target.id); const unit = opponent.board.splice(index, 1)[0]; putInHand(state, enemy(side), unit.id); break; }
    case 'armorStrike': hit(state, action.target, spellDamage(card, player, opponent)); player.armor = Math.max(0, player.armor - 3); break;
    case 'guardGain': player.armor += 4; if (hasGuard(player)) draw(state, side); break;
    case 'recruit': summon(state, side, 'helper'); summon(state, side, 'helper'); break;
    case 'rally': player.board.forEach(unit => grow(unit, 1, 1)); break;
    case 'promotion': player.board.forEach(unit => grow(unit, 2)); draw(state, side); break;
    case 'sacrifice': player.board.find(unit => unit.uid === action.target.id).health = 0; draw(state, side, 2); break;
    case 'revive': summon(state, side, player.graveyard.pop()); break;
    case 'cashPots': { const damage = spellDamage(card, player, opponent); opponent.pots = 0; hit(state, action.target, damage); break; }
  }
}
export function applyAction(original, action) {
  if (!isLegalAction(original, action)) throw new Error('当前无法进行此操作');
  const state = clone(original), side = state.active, other = enemy(side);
  const player = state.players[side], opponent = state.players[other];
  if (action.type === 'play') {
    const index = player.hand.findIndex(card => card.uid === action.uid);
    const instance = player.hand.splice(index, 1)[0];
    const card = CARD_MAP[instance.id], previousSpells = player.spellsPlayed;
    player.energy -= cardCost(player, card);
    log(state, `${player.name}${card.type === 'secret' ? '埋下一张伏笔' : `打出「${card.name}」`}${card.type !== 'secret' && previousSpells && card.tags?.includes('combo') ? '，连击触发！' : '。'}`, side, card.tags?.includes('combo') && previousSpells ? 'combo' : 'play');
    if (card.type === 'unit') {
      summon(state, side, card.id, instance);
      if (card.effect === 'pot') addPots(state, other, 1, side);
      if (card.effect === 'draw') draw(state, side);
      if (card.effect === 'sweep') opponent.board.forEach(unit => unit.health -= 2);
    } else if (card.type === 'secret') player.secrets.push(instance);
    else {
      player.spellDiscount = 0;
      const secretIndex = opponent.secrets.findIndex(secret => secret.id === 'cancel');
      if (secretIndex >= 0) {
        opponent.secrets.splice(secretIndex, 1);
        log(state, `${opponent.name}亮出「会议改看文档」，话术效果被反制。`, other, 'secret');
      } else spellEffect(state, side, card, action);
      player.spellsPlayed++;
      // 先结算牺牲和伤害，离场的成长引擎不能被后续加成救回。
      settle(state);
      if (state.status === 'playing') for (const unit of player.board) {
        if (effectOf(unit) === 'spellGrow') grow(unit, 1, 1);
        if (effectOf(unit) === 'spellPing') damageHero(state, other, 1);
      }
    }
  } else if (action.type === 'power') usePower(state, side);
  else if (action.type === 'attack') {
    const unit = player.board.find(unit => unit.uid === action.uid);
    const tags = unitTags(unit);
    unit.ready = false;
    let dealt;
    if (action.target.id === 'hero') {
      const secretIndex = opponent.secrets.findIndex(secret => secret.id === 'quiet');
      if (secretIndex >= 0) {
        opponent.secrets.splice(secretIndex, 1); opponent.armor += 5;
        log(state, `${opponent.name}亮出「你先别急」，获得 5 点护盾。`, other, 'secret');
      }
      dealt = damageHero(state, other, unit.attack);
      log(state, `「${CARD_MAP[unit.id].name}」向${opponent.name}施压 ${unit.attack} 点。`, side, 'damage');
      if (effectOf(unit) === 'attackPot') addPots(state, other, 1, side);
    } else {
      const target = opponent.board.find(target => target.uid === action.target.id);
      dealt = hit(state, action.target, unit.attack);
      unit.health -= target.attack + (unitTags(target).includes('thorns') ? 1 : 0);
      log(state, `「${CARD_MAP[unit.id].name}」与「${CARD_MAP[target.id].name}」交锋。`, side, 'damage');
    }
    if (tags.includes('lifesteal')) player.health = Math.min(player.maxHealth ?? MAX_HEALTH, player.health + dealt);
  } else if (action.type === 'resolve') {
    player.energy--; player.pots--;
    log(state, `${player.name}花费 1 点精力，处理了 1 个锅。`, side, 'pot');
  } else if (action.type === 'end') {
    for (const unit of player.board) if (effectOf(unit) === 'endPot') addPots(state, other, 1, side);
    if (player.pots) {
      const amount = player.pots * 2; damageHero(state, side, amount);
      log(state, `${player.name}的锅结算，受到 ${amount} 点伤害。`, side, 'pot'); player.pots = 0;
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
  const effectValue = { endPot: 1.5, spellGrow: 1.8, spellPing: 1.5, summonGrow: 1.1, deathGrow: 1.1, deathToken: .8, deathPot: .7, attackPot: .7 };
  const value = (player, own) => player.health * (own ? 2 : 2.35) + player.armor * 1.2 - player.pots * (own ? 1.7 : 1.2) + player.hand.length * .8 + player.energy * .12 + player.spellDiscount * .8 + Math.min(5, player.graveyard.length) * .12 + player.board.reduce((sum, unit) => sum + unit.attack * 1.4 + unit.health * .6 + (unitTags(unit).includes('guard') ? .6 : 0) + (unitTags(unit).includes('lifesteal') ? .7 : 0) + (unitTags(unit).includes('thorns') ? .4 : 0) + (effectValue[effectOf(unit)] || 0) - (unit.frozen ? unit.attack * .6 : 0), 0);
  return value(state.players[side], true) - value(state.players[enemy(side)], false);
}
export function chooseAIAction(state, difficulty = state.difficulty) {
  const side = state.active;
  const visible = clone(state), rival = visible.players[enemy(side)];
  // 搜索只使用公开场面、自己的手牌和随机化的剩余牌库组成。
  rival.hand = rival.hand.map(card => ({ ...card, id: 'unknown' }));
  rival.secrets = rival.secrets.map(card => ({ ...card, id: 'unknown' }));
  rival.deck = rival.deck.map(() => 'unknown');
  visible.players[side].deck = shuffle({ seed: 82937 + state.turn }, [...visible.players[side].deck].sort());
  const baseline = evaluate(visible, side);
  const ranked = legalActions(visible).map(action => {
    const next = action.type === 'end' ? visible : applyAction(visible, action);
    return { action, next, score: action.type === 'end' ? baseline - .01 : evaluate(next, side) };
  }).sort((a, b) => b.score - a.score);
  if (difficulty !== 'easy') for (const item of ranked) {
    const instance = item.action.type === 'play' && visible.players[side].hand.find(card => card.uid === item.action.uid);
    const enablingEffect = instance ? CARD_MAP[instance.id]?.effect : item.action.type === 'power' ? deckOf(visible.players[side]).power.effect : null;
    if (!['coin', 'overtime', 'pot', 'transfer'].includes(enablingEffect) || item.next.status !== 'playing') continue;
    for (const follow of legalActions(item.next).filter(action => action.type !== 'end')) item.score = Math.max(item.score, evaluate(applyAction(item.next, follow), side) - .1);
  }
  ranked.sort((a, b) => b.score - a.score);
  if (ranked[0]?.next.status === 'finished' && ranked[0].next.winner === side) return ranked[0].action;
  if (difficulty === 'easy') {
    const playable = ranked.filter(item => item.action.type !== 'end' && item.score >= baseline - 3);
    if (!playable.length) return { type: 'end' };
    return playable[(state.seed + state.nextId * 7) % Math.min(playable.length, 5)].action;
  }
  if (difficulty === 'hard') {
    for (const item of ranked.slice(0, 8)) {
      if (item.action.type === 'end' || item.next.status !== 'playing') continue;
      let best = item.score;
      for (const follow of legalActions(item.next).filter(action => action.type !== 'end')) best = Math.max(best, evaluate(applyAction(item.next, follow), side));
      item.score = best + item.score * .001;
    }
    ranked.sort((a, b) => b.score - a.score);
  }
  return ranked[0]?.action || { type: 'end' };
}
export function validSavedGame(value) {
  if (value?.customDeck && (!validCustomDeck(value.customDeck, { complete: true }) || value.deckId !== value.customDeck.baseDeckId || value.players?.[0]?.deckId !== value.deckId)) return false;
  return value?.rulesVersion === RULES_VERSION && value.status === 'playing' && Array.isArray(value.players) && value.players.length === 2 && DECKS.some(deck => deck.id === value.deckId) && OPPONENTS.some(item => item.id === value.difficulty) && value.players.every(player => DECKS.some(deck => deck.id === player.deckId) && Array.isArray(player.hand) && Array.isArray(player.board) && Array.isArray(player.deck) && Array.isArray(player.graveyard) && Array.isArray(player.secrets) && typeof player.powerUsed === 'boolean' && Number.isFinite(player.spellDiscount) && player.hand.every(card => CARD_MAP[card?.id]) && player.deck.every(id => CARD_MAP[id]) && player.board.every(card => CARD_MAP[card?.id]?.type === 'unit') && player.graveyard.every(id => CARD_MAP[id]?.type === 'unit') && player.secrets.every(card => CARD_MAP[card?.id]?.type === 'secret')) && [0, 1].includes(value.active);
}
export function restoreSavedGame(value) {
  if (!value || ![1, RULES_VERSION].includes(value.rulesVersion) || !Array.isArray(value.players) || value.players.length !== 2) return null;
  const restored = clone(value);
  if (restored.rulesVersion === 1) {
    restored.rulesVersion = RULES_VERSION;
    for (const player of restored.players) { player.powerUsed = false; player.spellDiscount = 0; player.graveyard = []; }
  }
  return validSavedGame(restored) ? restored : null;
}
