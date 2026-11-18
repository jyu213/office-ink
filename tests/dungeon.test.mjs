import test from 'node:test';
import assert from 'node:assert/strict';
import { DECKS } from '../src/cards.js';
import { chooseAIAction } from '../src/engine.js';
import { advanceDungeon, applyDungeonAction, createDungeon, DUNGEON_STAGES, restoreDungeon } from '../src/dungeon.js';
import { saveGame } from '../src/storage.js';

function winStage(run, remainingHealth) {
  const [player, opponent] = run.game.players;
  player.energy = 3;
  player.health = remainingHealth;
  player.hand = [{ id: 'minutes', uid: 'finisher' }];
  opponent.health = 1;
  return applyDungeonAction(run, { type: 'play', uid: 'finisher', target: { side: 1, id: 'hero' } });
}

function startBoss() {
  const first = winStage(createDungeon('blame', 321), 12);
  const second = winStage(advanceDungeon(first, 456), 5);
  return advanceDungeon(second, 789);
}

test('副本锁定预设卡组，逐关解锁，击败最终 Boss 才算通关', () => {
  for (const deck of DECKS) {
    let run = createDungeon(deck.id, 31);
    const runId = run.id;
    for (const [index, stage] of DUNGEON_STAGES.entries()) {
      assert.equal(run.stageIndex, index);
      assert.equal(run.game.players[1].name, stage.opponent);
      assert.equal(run.game.players[1].health, stage.health);
      assert.equal(run.game.deckId, deck.id);
      assert.equal(run.game.players[0].health, [25, 21, 21][index]);
      assert.equal(run.id, runId);
      assert.throws(() => advanceDungeon(run), /无法进入/);
      run = winStage(run, index === 0 ? 12 : 5);
      assert.equal(run.status, stage.boss ? 'cleared' : 'between');
      assert.deepEqual(restoreDungeon(JSON.parse(JSON.stringify(run))), run);
      if (!stage.boss) run = advanceDungeon(run, 32 + index);
    }
    assert.throws(() => advanceDungeon(run), /无法进入/);
  }
});

test('Boss 按频率发动临时述职，护盾吸收伤害，落败后重试本关', () => {
  let run = startBoss();
  run = applyDungeonAction(run, { type: 'end' });
  assert.equal(run.game.players[0].health, 21);
  run = applyDungeonAction(run, { type: 'end' });
  assert.equal(run.game.turn, 3);
  run.game.turn = 5;
  run.game.players[0].armor = 1;
  run = applyDungeonAction(run, { type: 'end' });
  assert.equal(run.game.players[0].health, 20);
  assert.equal(run.game.players[0].armor, 0);
  assert.match(run.game.log.at(-1).text, /临时述职/);
  run = applyDungeonAction(run, { type: 'end' });
  run.game.turn = 11;
  run.game.players[0].health = 1;
  run = applyDungeonAction(run, { type: 'end' });
  assert.equal(run.status, 'failed');
  assert.equal(restoreDungeon(run), run);
  assert.throws(() => applyDungeonAction(run, { type: 'end' }), /请先进入/);
  const retry = advanceDungeon(run, 555);
  assert.equal(retry.id, run.id);
  assert.notEqual(retry.game.id, run.game.id);
  assert.equal(retry.stageIndex, 2);
  assert.equal(retry.game.players[0].health, 21);
  assert.equal(retry.game.players[1].health, 24);
  assert.equal(retry.game.turn, 1);
});

test('一套默认卡组使用合法动作，可以从首关完整打到 Boss 通关', () => {
  let run = createDungeon('growth', 10001);
  for (let stage = 0; stage < DUNGEON_STAGES.length; stage++) {
    for (let n = 0; run.status === 'playing' && n < 700; n++) {
      const game = run.game;
      run = applyDungeonAction(run, chooseAIAction(game, game.active === 0 ? 'hard' : game.difficulty));
    }
    assert.equal(run.status, stage === 2 ? 'cleared' : 'between');
    if (run.status === 'between') run = advanceDungeon(run, 30197 + stage);
  }
});

test('副本存档独立于正式对局并拒绝无效关卡或版本', async () => {
  const run = createDungeon('blame', 1);
  assert.equal(restoreDungeon(null), null);
  assert.equal(restoreDungeon({ ...run, stageIndex: 2 }), null);
  assert.equal(restoreDungeon({ ...run, status: 'cleared' }), null);
  assert.equal(restoreDungeon({ ...run, version: 8 }), null);
  await assert.rejects(saveGame(run.game), /独立保存/);
});
