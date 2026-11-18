import { createGame, applyAction, legalActions, validSavedGame } from './engine.js';

export const TUTORIAL_VERSION = 1;
export const TUTORIAL_STEPS = [
  { id: 'table', title: '先看懂桌面', instruction: '上方是教练，下方是你。把教练的心态打到 0 就能获胜。', detail: '正式开局有 25 点心态、1 点精力。这是准备好的练习残局：教练只剩 4 点，你有 4 点精力。', selector: '.hero-row.side-1', nextLabel: '看懂了，试着出牌' },
  { id: 'summon', title: '用精力打出一张牌', instruction: '点击下方手牌里的「大家都在等你」。', detail: '左上角的 2 是费用；左下角的 2 是攻击力，右下角的 3 是生命值。打出后它会留在场上。', selector: '.hand[data-uid="tutorial-waiting"]', action: { type: 'play', uid: 'tutorial-waiting' } },
  { id: 'wait', title: '刚入场，要等一回合', instruction: '点击「结束回合」，让教练行动。', detail: '这张立场刚入场，还不能攻击。等回到你的回合，右上角亮起绿点，就能行动了。', selector: '[data-action="end"]', action: { type: 'end' } },
  { id: 'pot', title: '先处理身上的锅', instruction: '点击「处理一个锅」，花 1 点精力把它处理掉。', detail: '教练刚打出了「这个谁来跟一下」，让你背了 1 个锅。如果留到自己回合结束，会损失 2 点心态。', selector: '[data-action="resolve"]', action: { type: 'resolve' } },
  { id: 'trade', title: '攻击要点两次', instruction: '先点己方场上的「大家都在等你」，再点对面的立场。', detail: '立场交锋会互相扣生命：你的 2 攻打掉对面 2 点生命，也会承受对面的 2 点攻击。', selector: '.board[data-uid="tutorial-waiting"]', targetSelector: '.board[data-uid="tutorial-follow"]', selectedInstruction: '已经选好攻击者。现在点击发光的「这个谁来跟一下」。', action: { type: 'attack', uid: 'tutorial-waiting', target: { side: 1, id: 'tutorial-follow' } } },
  { id: 'spell', title: '话术也要选目标', instruction: '先点手牌「我补充两句」，再点对面剩 1 点生命的立场。', detail: '这张话术花费 2 精力，立即造成 2 点伤害。生命归零的立场会离场，给你腾出进攻机会。', selector: '.hand[data-uid="tutorial-supplement"]', targetSelector: '.board[data-uid="tutorial-follow"]', selectedInstruction: '话术已选中。现在点击发光的敌方立场，打出伤害。', action: { type: 'play', uid: 'tutorial-supplement', target: { side: 1, id: 'tutorial-follow' } } },
  { id: 'power', title: '每回合还有一次流派技能', instruction: '点击「明确分工」，给教练挂一个锅。', detail: '技能也消耗精力，每回合只能用一次。现在还剩 2 精力，刚好够用；本回合用过后按钮会变暗。', selector: '[data-action="power"]', action: { type: 'power' } },
  { id: 'settle', title: '锅要等到对方回合结束', instruction: '再点一次「结束回合」，观察教练的心态从 4 变成 2。', detail: '挂锅不会立即扣血。教练这次不处理它，等自己的回合结束时，就会受到 2 点伤害。', selector: '[data-action="end"]', action: { type: 'end' } },
  { id: 'finish', title: '最后，直接攻击对手', instruction: '先点己方立场，再点击教练的头像。', detail: '教练只剩 2 点心态，你的立场攻击力正好是 2。对手的立场已清空，可以直接向对手进攻。', selector: '.board[data-uid="tutorial-waiting"]', targetSelector: '.hero-identity[data-side="1"]', selectedInstruction: '现在点击发光的教练头像，这一击就能获胜。', action: { type: 'attack', uid: 'tutorial-waiting', target: { side: 1, id: 'hero' } } }
];
const actionKey = action => `${action.type}:${action.uid || ''}:${action.target?.side ?? ''}:${action.target?.id || ''}`;
export const tutorialStep = tutorial => TUTORIAL_STEPS[tutorial.step] || null;
export function tutorialActions(tutorial) {
  const expected = tutorialStep(tutorial)?.action;
  if (!expected || tutorial.completed) return [];
  return legalActions(tutorial.game).filter(action => actionKey(action) === actionKey(expected));
}
export function createTutorial() {
  const game = createGame({ deckId: 'blame', difficulty: 'easy', opponentDeckId: 'control', seed: 20261118 });
  game.id = `tutorial-${game.id}`;
  game.mode = 'tutorial'; game.turn = 7; game.log = [];
  for (const player of game.players) {
    player.board = []; player.secrets = []; player.graveyard = [];
    player.armor = 0; player.pots = 0; player.powerUsed = false; player.spellsPlayed = 0; player.spellDiscount = 0;
  }
  const [player, coach] = game.players;
  player.energy = player.maxEnergy = 4;
  player.hand = [{ id: 'waiting', uid: 'tutorial-waiting' }, { id: 'supplement', uid: 'tutorial-supplement' }];
  player.deck = ['ack', 'notmine', 'minutes'];
  coach.name = '教学教练'; coach.health = 4; coach.energy = coach.maxEnergy = 3;
  coach.hand = [{ id: 'follow', uid: 'tutorial-follow' }];
  coach.deck = ['leader', 'ack', 'waiting'];
  return { version: TUTORIAL_VERSION, step: 0, completed: false, game };
}
export function advanceTutorial(tutorial) {
  if (tutorial.step !== 0 || tutorial.completed) throw new Error('请先完成当前提示的操作。');
  return { ...tutorial, step: 1 };
}
export function applyTutorialAction(tutorial, action) {
  if (!tutorialActions(tutorial).some(allowed => actionKey(allowed) === actionKey(action))) throw new Error(tutorialStep(tutorial)?.instruction || '教学已经完成。');
  let game = applyAction(tutorial.game, action);
  if (tutorial.step === 2) {
    game = applyAction(game, { type: 'play', uid: 'tutorial-follow' });
    game = applyAction(game, { type: 'end' });
  } else if (tutorial.step === 7) game = applyAction(game, { type: 'end' });
  const step = tutorial.step + 1;
  return { ...tutorial, step, game, completed: step === TUTORIAL_STEPS.length && game.winner === 0 };
}
export function restoreTutorial(value) {
  if (value?.version !== TUTORIAL_VERSION || value.completed !== false || !Number.isInteger(value.step) || value.step < 0 || value.step >= TUTORIAL_STEPS.length || value.game?.mode !== 'tutorial' || value.game.active !== 0 || !validSavedGame(value.game)) return null;
  const restored = structuredClone(value);
  if (restored.step > 0 && tutorialActions(restored).length !== 1) return null;
  return restored;
}
