import { hasGuard, spellDamage, transferPotCount } from './engine.js';

const effects = {
  supplement: { kind: 'combo', label: '连击', icon: 'chain', base: 2 },
  chainDamage: { kind: 'combo', label: '连击', icon: 'chain', base: 1 },
  minutes: { kind: 'pot', label: '挂锅', icon: 'flame', base: 3 },
  cashPots: { kind: 'pot', label: '引爆', icon: 'flame', base: 2 },
  transfer: { kind: 'pot', label: '甩锅', icon: 'flame' },
  armorStrike: { kind: 'shield', label: '护盾反打', icon: 'shield' },
  guardGain: { kind: 'shield', label: '拦截联动', icon: 'shield' }
};

export function cardEffect(card, game) {
  const effect = effects[card.effect];
  if (!effect || game?.status !== 'playing' || game.active !== 0) return effect;

  const [player, opponent] = game.players;
  if (effect.base !== undefined) {
    const damage = spellDamage(card, player, opponent);
    const active = damage > effect.base;
    return { ...effect, active, value: `${active ? `${effect.base}→` : ''}${damage} 伤害`,
      hint: active ? '加成已就绪' : effect.kind === 'combo' ? '先打出一张话术即可触发' : '对手身上有锅时加伤' };
  }

  if (card.effect === 'armorStrike') {
    const damage = spellDamage(card, player, opponent);
    return { ...effect, active: damage > 0, value: damage ? `${damage} 伤害` : '缺护盾' };
  }

  if (card.effect === 'guardGain') {
    const active = hasGuard(player);
    return { ...effect, active, value: active ? '+1 张牌' : '需拦截' };
  }

  const count = transferPotCount(player);
  return { ...effect, active: count > 0, value: count ? `甩出 ${count} 锅` : '挂 1 锅' };
}
