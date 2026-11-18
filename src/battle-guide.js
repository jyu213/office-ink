import { CARD_MAP } from './cards.js';
import { cardCost, MAX_BOARD, unitTags } from './engine.js';
const cue = (state, label, reason, extra = {}) => ({ state, label, reason, ...extra });
const playerTurn = game => game.status === 'playing' && game.active === 0;
export function handCue(game, instance, actions, selection = null) {
  const card = CARD_MAP[instance.id], player = game.players[0];
  if (game.status !== 'playing') return cue('blocked', '对局结束', '本局已经结束，可以查看战绩或再开一局。');
  if (game.active !== 0) return cue('blocked', '对手回合', '现在轮到对手，你可以先查看卡牌效果。');
  if (actions.some(action => action.type === 'play' && action.uid === instance.uid)) {
    if (selection?.type === 'play' && selection.uid === instance.uid) return cue('selected', '已选中', '再点击橙色描边的目标，完成出牌；也可以取消选择。');
    return cue('playable', '可出牌', `现在可以打出，消耗 ${cardCost(player, card)} 点精力${card.target ? '，点击后还需选择目标' : ''}。`);
  }
  if (game.mode === 'tutorial') return cue('blocked', '按提示操作', '先完成上方教学提示的操作。');
  const cost = cardCost(player, card);
  if (cost > player.energy) return cue('blocked', '精力不足', `需要 ${cost} 点精力，你现在有 ${player.energy} 点。等待下回合补充精力。`);
  if (card.type === 'unit' && player.board.length >= MAX_BOARD || ['recruit', 'revive'].includes(card.effect) && player.board.length >= MAX_BOARD) return cue('blocked', '场位已满', '场上最多 5 个立场，先腾出位置再使用。');
  if (card.type === 'secret' && player.secrets.some(secret => secret.id === card.id)) return cue('blocked', '已有伏笔', '相同的伏笔已经埋下，触发后才能再放。');
  if (card.effect === 'armorStrike' && !player.armor) return cue('blocked', '需要护盾', '先获得护盾，才能把护盾转成伤害。');
  if (card.effect === 'revive' && !player.graveyard.length) return cue('blocked', '暂无交接', '交接区需要有离场的立场，才能返聘。');
  if (card.target === 'allyUnit' || ['rally', 'promotion'].includes(card.effect)) return cue('blocked', '需要立场', '先打出一个己方立场，才有可用的目标。');
  if (card.target === 'weakEnemy') return cue('blocked', '没有目标', '需要一个压迫不超过 3 的敌方立场作为目标。');
  return cue('blocked', '没有目标', '现在没有符合这张牌要求的目标，暂时留在手中。');
}
export function boardCue(game, side, unit, actions, selection = null) {
  if (!unit) return cue('blocked', '已离场', '这个立场已经离场。');
  const own = side === 0;
  const selectedActions = selection && playerTurn(game) ? actions.filter(action => action.type === selection.type && action.uid === selection.uid) : [];
  if (selectedActions.some(action => action.target?.side === side && action.target.id === unit.uid)) return cue('target', selection.type === 'attack' ? '点击攻击' : '选为目标', selection.type === 'attack' && unitTags(unit).includes('guard') ? '拦截立场，必须优先攻击。' : '点击这里，完成当前选择。');
  if (!own) return selection?.type === 'attack' && playerTurn(game) ? cue('not-target', '', '当前不能攻击这里：敌方有拦截时，必须先攻击橙色描边的拦截立场。') : null;
  if (game.status !== 'playing') return cue('blocked', '对局结束', '本局已经结束。');
  if (!playerTurn(game)) return cue('blocked', '对手回合', '等对手结束回合后，才能操作自己的立场。');
  const canAttack = actions.some(action => action.type === 'attack' && action.uid === unit.uid);
  if (canAttack && selection?.type === 'attack' && selection.uid === unit.uid) return cue('selected', '已选攻击者', '再点橙色描边的目标发起攻击，点取消可重新选择。', { canAttack: true });
  if (canAttack) return cue('attackable', '可攻击', '点击此立场，再点敌方立场或对手头像发起攻击。', { canAttack: true });
  if (game.mode === 'tutorial' && unit.ready) return cue('blocked', '按提示操作', '先完成上方教学提示的操作。');
  if (unit.frozen) return cue('blocked', '流程暂停', '这个立场受流程影响，暂时不能攻击。');
  return cue('blocked', '等待下回合', '本回合暂时不能攻击。普通立场刚入场或已经行动后，需要等待下回合。');
}
export function actionGuide(game, actions, selection = null) {
  const active = playerTurn(game);
  const available = active ? actions : [];
  const playable = new Set(available.filter(action => action.type === 'play').map(action => action.uid));
  const attackers = new Set(available.filter(action => action.type === 'attack').map(action => action.uid));
  const selectedActions = selection ? available.filter(action => action.type === selection.type && action.uid === selection.uid) : [];
  const targets = [...new Map(selectedActions.filter(action => action.target).map(action => [`${action.target.side}:${action.target.id}`, action.target])).values()];
  const power = available.some(action => action.type === 'power');
  const canResolve = available.some(action => action.type === 'resolve');
  const onlyEnd = active && !available.some(action => action.type !== 'end');
  let title = '轮到你行动', message;
  if (game.status !== 'playing') { title = '本局已结束'; message = '可以查看战绩，或回到对战再过一招。'; }
  else if (!active) { title = '对手正在行动'; message = '现在不能出牌或攻击。可以先查看自己的卡牌，等对手结束回合。'; }
  else if (selection?.type === 'attack') {
    title = '第二步：点攻击目标';
    const guards = game.players[1].board.some(unit => unitTags(unit).includes('guard'));
    message = guards ? '先攻击带「拦截」盾标的立场。对手头像和其他立场暂时不能攻击。' : '攻击者已选中。点击橙色描边的敌方立场，或对手头像。';
  } else if (selection?.type === 'play') {
    title = '第二步：点话术目标';
    const card = game.players[0].hand.find(instance => instance.uid === selection.uid);
    message = `已选「${CARD_MAP[card?.id]?.name || '话术'}」，点击橙色描边的目标完成出牌。`;
  } else if (onlyEnd) message = '当前没有可用动作。点击「结束回合」，等待下回合补充精力和抽牌。';
  else if (canResolve && game.players[0].pots) message = `身上还有 ${game.players[0].pots} 个锅，每个结算 2 点伤害；可花 1 精力处理一个。`;
  else if (!playable.size && attackers.size) message = '现在没有可出的手牌；绿色「可攻击」仍能进攻。先点自己的立场，再选目标。';
  else if (!playable.size && !attackers.size && power) message = '暂时没有牌可出，也没有立场可攻击。还可以使用流派技能。';
  else message = '绿色「可出牌」可以打出；绿色「可攻击」先点选，再点橙色目标。';
  return { playable, attackers, targets, power, canResolve, onlyEnd, active, title, message };
}
