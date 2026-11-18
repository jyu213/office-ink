import { CARD_MAP, DECKS } from './cards.js';
import { unitTags } from './engine.js';

const board = (side, uid) => `board-${side}-${uid}`;
const hero = side => `hero-${side}`;
const pots = side => `pots-${side}`;
const secret = side => `secrets-${side}`;

function describeEffects(before, after, action) {
  const side = before.active;
  const other = 1 - side;
  const actor = before.players[side];
  const card = CARD_MAP[actor.hand.find(instance => instance.uid === action.uid)?.id];
  const power = DECKS.find(deck => deck.id === actor.deckId).power;
  const combo = card?.tags?.includes('combo') && actor.spellsPlayed > 0;
  const source = {
    play: side === 0 ? `hand-${action.uid}` : 'enemy-hand',
    attack: board(side, action.uid),
    power: side === 0 ? 'player-power' : hero(side),
    resolve: pots(side),
    end: hero(side)
  }[action.type];
  const effects = [];
  const add = (kind, target, label, from = source) => effects.push({ kind, target, label, source: from });
  const loss = (owner, id, amount) => `${combo && action.target?.side === owner && action.target.id === id ? '连击 ' : ''}−${amount}`;
  const revealed = id => before.players[other].secrets.some(item => item.id === id) &&
    !after.players[other].secrets.some(item => item.id === id);
  const potReflected = revealed('receipts');

  if (action.type === 'play' && card?.type === 'spell' && revealed('cancel')) {
    add('control', secret(other), '话术被反制');
  } else if (action.type === 'play' && card?.type === 'secret') {
    add('control', secret(side), '埋下伏笔');
  }
  if (potReflected) add('control', secret(other), '挂锅被反制');
  if (action.type === 'attack' && revealed('quiet')) add('shield', hero(other), '伏笔护盾', secret(other));

  for (const [owner, old] of before.players.entries()) {
    const next = after.players[owner];
    const health = Math.max(0, next.health) - Math.max(0, old.health);
    const armor = next.armor - old.armor;
    if (health < 0) add('hit', hero(owner), loss(owner, 'hero', -health), owner === side && potReflected
      ? secret(other) : action.type === 'end' && owner === side ? pots(side) : source);
    if (health > 0) add('gain', hero(owner), `心态 +${health}`, action.type === 'attack' ? hero(owner) : source);
    if (armor > 0) add('shield', hero(owner), `护盾 +${armor}`, action.type === 'attack' || action.type === 'end' ? hero(owner) : source);
    if (armor < 0) add('shield', hero(owner), `护盾 −${-armor}`, health < 0 || owner === side && card?.effect === 'armorStrike' ? hero(owner) : source);

    const potChange = next.pots - old.pots;
    if (potChange > 0) {
      const potUnits = before.players[1 - owner].board.filter(unit => !unit.silenced &&
        (action.type === 'end' && CARD_MAP[unit.id].effect === 'endPot' ||
          CARD_MAP[unit.id].effect === 'deathPot' && !after.players[1 - owner].board.some(item => item.uid === unit.uid)));
      const potSource = potUnits.length === 1 ? board(1 - owner, potUnits[0].uid)
        : card?.effect === 'pot' ? board(side, action.uid)
        : card?.effect === 'transfer' && actor.pots ? pots(side) : source;
      add('pot', pots(owner), `挂锅 +${potChange}`, potSource);
    } else if (potChange < 0) {
      const label = action.type === 'end' ? '锅已结算' : card?.effect === 'transfer' ? '锅已甩出'
        : card?.effect === 'cashPots' ? '引爆' : '解锅';
      add('pot', pots(owner), label, pots(owner));
    }

    for (const unit of next.board) {
      if (!old.board.some(item => item.uid === unit.uid)) {
        add(unitTags(unit).includes('guard') ? 'shield' : 'gain', board(owner, unit.uid),
          unit.uid === action.uid ? '入场' : '召唤', owner === side ? source : 'enemy-hand');
      }
    }

    for (const unit of old.board) {
      const current = next.board.find(item => item.uid === unit.uid);
      const key = board(owner, unit.uid);
      const origin = action.type === 'attack' && action.uid === unit.uid
        ? (action.target.id === 'hero' ? key : board(action.target.side, action.target.id)) : source;
      if (!current) {
        const returned = card?.effect === 'bounce' && action.target?.id === unit.uid;
        add(returned ? 'control' : 'hit', key, returned ? '退回手牌' : '击破', origin);
      } else if (current.health < unit.health) {
        add('hit', key, loss(owner, unit.uid, unit.health - current.health), origin);
      } else if (current.attack > unit.attack || current.health > unit.health) {
        add('gain', key, '强化');
      } else if (current.silenced && !unit.silenced || current.frozen > unit.frozen) {
        add('control', key, current.silenced && !unit.silenced ? '沉默' : '冻结');
      }
    }
  }

  if (!effects.length && action.type !== 'end') {
    const target = action.target;
    const point = !target ? hero(side) : target.id === 'hero' ? hero(target.side) : board(target.side, target.id);
    const label = card?.effect === 'coin' ? '精力 +1' : action.type === 'power' ? power.name
      : action.type === 'attack' ? '格挡' : '话术生效';
    add(action.type === 'attack' ? 'shield' : 'gain', point, label);
  }
  return effects;
}

function capture(root, points) {
  return new Map([...points].flatMap(key => {
    const node = root.querySelector(`[data-fx="${CSS.escape(key)}"]`);
    if (!node) return [];
    const rect = node.getBoundingClientRect();
    return [[key, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2,
      visible: rect.bottom > 0 && rect.top < window.innerHeight &&
        rect.right > 0 && rect.left < window.innerWidth }]];
  }));
}

function fxNode(className, point, values = {}) {
  const node = document.createElement('i');
  node.className = className;
  node.style.left = `${point.x}px`;
  node.style.top = `${point.y}px`;
  for (const [name, value] of Object.entries(values)) node.style.setProperty(`--fx-${name}`, value);
  return node;
}

function clamp(point) {
  return {
    x: Math.min(window.innerWidth - 26, Math.max(26, point.x)),
    y: Math.min(window.innerHeight - 38, Math.max(38, point.y))
  };
}

// 在 DOM 更新前存下手牌与离场立场的位置，更新后再定位入场牌。
export function stageBattleEffects(root, layer, before, after, action) {
  const effects = describeEffects(before, after, action);
  const points = new Set(effects.flatMap(effect => [effect.source, effect.target]));
  const previous = capture(root, points);
  return () => {
    const current = capture(root, points);
    const sequence = document.createElement('div');
    sequence.className = 'battle-fx-sequence';
    const seenRoutes = new Set();
    const hitsPerTarget = new Map();
    for (const effect of effects) {
      const origin = previous.get(effect.source) || current.get(effect.source);
      const target = current.get(effect.target) || previous.get(effect.target);
      if (!target) continue;
      const to = clamp(target);
      const from = origin ? clamp(origin) : to;
      const dx = to.x - from.x, dy = to.y - from.y;
      const distance = Math.hypot(dx, dy);
      const key = `${effect.source}:${effect.target}`;
      const travels = distance > 18 && (target.visible || origin?.visible) && !seenRoutes.has(key);
      const group = document.createElement('div');
      group.className = `battle-fx-event fx-${effect.kind}${travels ? ' fx-from-source' : ''}`;
      if (travels) {
        seenRoutes.add(key);
        const values = {
          dx: `${dx}px`, dy: `${dy}px`, length: `${distance}px`,
          angle: `${Math.atan2(dy, dx)}rad`, arc: `${Math.min(40, distance * .2)}px`
        };
        group.append(fxNode('battle-fx-trail', from, values), fxNode('battle-fx-mote', from, values));
      }
      const count = hitsPerTarget.get(effect.target) || 0;
      const label = fxNode('battle-fx-label', {
        x: Math.min(window.innerWidth - 58, Math.max(58, to.x)),
        y: Math.max(20, to.y - count * 22)
      });
      label.textContent = effect.label;
      hitsPerTarget.set(effect.target, count + 1);
      if (!count) group.append(fxNode('battle-fx-ring', to));
      group.append(label);
      sequence.append(group);
    }
    if (!sequence.childElementCount) return false;
    layer.append(sequence);
    const { scrollX, scrollY } = window;
    const followScroll = () => {
      sequence.style.transform = `translate(${scrollX - window.scrollX}px, ${scrollY - window.scrollY}px)`;
    };
    window.addEventListener('scroll', followScroll, { passive: true });
    setTimeout(() => {
      sequence.remove();
      window.removeEventListener('scroll', followScroll);
    }, 730);
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
}
