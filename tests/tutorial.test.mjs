import test from 'node:test';
import assert from 'node:assert/strict';
import { createTutorial, advanceTutorial, applyTutorialAction, restoreTutorial, tutorialActions } from '../src/tutorial.js';
import { saveGame } from '../src/storage.js';

const actions = [
  { type: 'play', uid: 'tutorial-waiting' },
  { type: 'end' },
  { type: 'resolve' },
  { type: 'attack', uid: 'tutorial-waiting', target: { side: 1, id: 'tutorial-follow' } },
  { type: 'play', uid: 'tutorial-supplement', target: { side: 1, id: 'tutorial-follow' } },
  { type: 'power' },
  { type: 'end' },
  { type: 'attack', uid: 'tutorial-waiting', target: { side: 1, id: 'hero' } }
];

test('教学使用真实规则，完整练习出牌、等待、解锅、交换、话术、技能和获胜',()=>{
 let tutorial=createTutorial();
 assert.equal(tutorial.game.players[1].health,4);assert.equal(tutorial.game.players[0].energy,4);assert.deepEqual(tutorialActions(tutorial),[]);
 tutorial=advanceTutorial(tutorial);
 tutorial=applyTutorialAction(tutorial,actions[0]);
 assert.equal(tutorial.game.players[0].energy,2);assert.equal(tutorial.game.players[0].board[0].ready,false);
 tutorial=applyTutorialAction(tutorial,actions[1]);
 assert.equal(tutorial.game.active,0);assert.equal(tutorial.game.players[0].pots,1);assert.equal(tutorial.game.players[0].board[0].ready,true);
 tutorial=applyTutorialAction(tutorial,actions[2]);assert.equal(tutorial.game.players[0].pots,0);assert.equal(tutorial.game.players[0].energy,4);
 tutorial=applyTutorialAction(tutorial,actions[3]);assert.equal(tutorial.game.players[0].board[0].health,1);assert.equal(tutorial.game.players[1].board[0].health,1);
 tutorial=applyTutorialAction(tutorial,actions[4]);assert.equal(tutorial.game.players[1].board.length,0);assert.equal(tutorial.game.players[0].energy,2);
 tutorial=applyTutorialAction(tutorial,actions[5]);assert.equal(tutorial.game.players[0].powerUsed,true);assert.equal(tutorial.game.players[1].pots,1);assert.equal(tutorial.game.players[1].health,4);
 tutorial=applyTutorialAction(tutorial,actions[6]);assert.equal(tutorial.game.players[1].health,2);assert.equal(tutorial.game.players[1].pots,0);
 tutorial=applyTutorialAction(tutorial,actions[7]);assert.equal(tutorial.completed,true);assert.equal(tutorial.game.winner,0);assert.equal(tutorial.step,9);assert.deepEqual(tutorialActions(tutorial),[]);
});
test('错误操作不会修改进度、消耗卡牌或让学生跳过当前步骤',()=>{
 const tutorial=advanceTutorial(createTutorial());const before=structuredClone(tutorial);
 assert.throws(()=>applyTutorialAction(tutorial,{type:'end'}),/点击下方手牌/);
 assert.throws(()=>applyTutorialAction(tutorial,{type:'play',uid:'tutorial-supplement',target:{side:1,id:'hero'}}));
 assert.throws(()=>advanceTutorial(tutorial),/完成当前/);assert.deepEqual(tutorial,before);
});
test('每一步都可经 JSON 存储后恢复并继续，原状态保持不变',()=>{
 let tutorial=advanceTutorial(createTutorial());
 for(const action of actions){const before=structuredClone(tutorial);const restored=restoreTutorial(JSON.parse(JSON.stringify(tutorial)));assert.ok(restored);assert.deepEqual(tutorialActions(restored),[action]);tutorial=applyTutorialAction(restored,action);assert.deepEqual(restored,before);}
 assert.equal(restoreTutorial(tutorial),null);
});
test('拒绝不兼容或无法继续的教学存档，重练创建独立状态',()=>{
 const first=createTutorial(),second=createTutorial();assert.notEqual(first.game.id,second.game.id);assert.deepEqual(first.game.players,second.game.players);
 assert.equal(restoreTutorial({...first,version:999}),null);assert.equal(restoreTutorial({...first,step:99}),null);
 const broken=advanceTutorial(first);broken.game.players[0].hand=[];assert.equal(restoreTutorial(broken),null);
 const opponent=structuredClone(second);opponent.game.active=1;assert.equal(restoreTutorial(opponent),null);
});
test('教学游戏不能误写入正式存档与战绩接口',async()=>{
 await assert.rejects(saveGame(createTutorial().game),/独立保存/);
});
