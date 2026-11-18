import { DECKS } from './cards.js';
import { applyAction, createGame, MAX_HEALTH, validSavedGame } from './engine.js';

export const DUNGEON_VERSION = 1;
export const BOSS_PRESSURE = { name: '临时述职', every: 3, damage: 2 };
export const DUNGEON_STAGES = [
  { id: 'standup', name: '晨会点名', opponent: '值班组长', seal: '晨', deckId: 'combo', difficulty: 'easy', health: 15, art: 0, tip: '组长擅长用低费话术接连击。优先处理会在出话术时补刀的敌方立场。' },
  { id: 'review', name: '跨部门评审', opponent: '流程经理', seal: '审', deckId: 'control', difficulty: 'normal', health: 20, art: 5, tip: '经理会用拦截、冻结和伏笔拖住你。可以先打出低费话术试探伏笔。' },
  { id: 'director', name: '季度述职', opponent: '考核总监', seal: '考', deckId: 'blame', difficulty: 'hard', health: 24, art: 1, boss: true, tip: '总监会挂锅并用话术引爆。每逢他的第 3、6、9… 回合开始，他还会发动「临时述职」，对你造成 2 点伤害。' }
];

function beginStage(run, seed) {
  const stage = DUNGEON_STAGES[run.stageIndex];
  const game = createGame({ deckId: run.deckId, difficulty: stage.difficulty, opponentDeckId: stage.deckId, seed });
  game.mode = 'dungeon';
  game.encounterId = stage.id;
  game.players[0].health = run.stageHealth;
  Object.assign(game.players[1], { name: stage.opponent, health: stage.health, maxHealth: stage.health });
  if (stage.boss) game.bossPressure = BOSS_PRESSURE;
  return { ...run, status: 'playing', game };
}

export function createDungeon(deckId, seed) {
  const run = beginStage({ version: DUNGEON_VERSION, deckId, stageIndex: 0, stageHealth: MAX_HEALTH }, seed);
  return { ...run, id: run.game.id };
}

export function dungeonRecovery(health) {
  return Math.min(MAX_HEALTH, Math.max(21, health + 8));
}

export function applyDungeonAction(run, action) {
  if (run.status !== 'playing') throw new Error('请先进入副本关卡');
  const game = applyAction(run.game, action);
  if (game.status !== 'finished') return { ...run, game };
  if (game.winner !== 0) return { ...run, status: 'failed', game };
  const isLastStage = run.stageIndex === DUNGEON_STAGES.length - 1;
  return { ...run, status: isLastStage ? 'cleared' : 'between', game };
}

export function advanceDungeon(run, seed) {
  if (run.status === 'failed') return beginStage(run, seed);
  if (run.status !== 'between') throw new Error('当前无法进入下一关');
  return beginStage({ ...run, stageIndex: run.stageIndex + 1, stageHealth: dungeonRecovery(run.game.players[0].health) }, seed);
}

export function restoreDungeon(run) {
  const stage = DUNGEON_STAGES[run?.stageIndex];
  const game = run?.game;
  if (run?.version !== DUNGEON_VERSION || typeof run.id !== 'string' || !Number.isInteger(run.stageIndex) || !stage || !Number.isInteger(run.stageHealth) || run.stageHealth < 1 || run.stageHealth > MAX_HEALTH) return null;
  if (!DECKS.some(deck => deck.id === run.deckId) || game?.mode !== 'dungeon' || game.encounterId !== stage.id || game.deckId !== run.deckId || !validSavedGame({ ...game, status: 'playing' })) return null;
  if (game.status === 'playing' && run.status === 'playing') return run;
  if (game.status !== 'finished') return null;
  if (game.winner === 0) return run.status === (stage.boss ? 'cleared' : 'between') ? run : null;
  return ['draw', 1].includes(game.winner) && run.status === 'failed' ? run : null;
}
