import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, legalActions, applyAction } from '../src/engine.js';
import { CARD_MAP } from '../src/cards.js';
import { actionGuide, handCue, boardCue } from '../src/battle-guide.js';
function fixture(){
 const game=createGame({seed:77119,opponentDeckId:'control'});const player=game.players[0];
 player.energy=player.maxEnergy=2;player.hand=[{id:'waiting',uid:'h-wait'},{id:'supplement',uid:'h-hit'},{id:'boss',uid:'h-boss'},{id:'armorStrike',uid:'h-armor'}];
 player.board=[unit('waiting','u-ready',true),unit('waiting','u-sleep',false)];
 game.players[1].board=[unit('leader','u-guard',false),unit('waiting','u-enemy',false)];
 return game;
}
function unit(id,uid,ready){const card=CARD_MAP[id];return{id,uid,attack:card.attack,health:card.health,maxHealth:card.health,ready,frozen:0,silenced:false};}
test('行动数量按不同手牌和立场统计，不把多个目标重复计数',()=>{
 const game=fixture(),actions=legalActions(game),guide=actionGuide(game,actions);
 assert.deepEqual([...guide.playable],['h-wait','h-hit']);assert.deepEqual([...guide.attackers],['u-ready']);assert.equal(guide.power,true);
 assert.equal(handCue(game,game.players[0].hand[0],actions).label,'可出牌');assert.equal(boardCue(game,0,game.players[0].board[0],actions).label,'可攻击');
});
test('选攻击者后只提示拦截目标，话术可以选择头像和其他合法目标',()=>{
 const game=fixture(),actions=legalActions(game),selection={type:'attack',uid:'u-ready'};
 const attack=actionGuide(game,actions,selection);assert.deepEqual(attack.targets,[{side:1,id:'u-guard'}]);assert.ok(attack.message.includes('拦截'));
 assert.equal(boardCue(game,1,game.players[1].board[0],actions,selection).label,'点击攻击');assert.equal(boardCue(game,1,game.players[1].board[1],actions,selection).state,'not-target');assert.equal(boardCue(game,0,game.players[0].board[0],actions,selection).label,'已选攻击者');
 const spell={type:'play',uid:'h-hit'};assert.equal(actionGuide(game,actions,spell).targets.length,3);assert.equal(handCue(game,game.players[0].hand[1],actions,spell).label,'已选中');
});
test('不可出牌明确区分精力不足、需要护盾和场位已满',()=>{
 const game=fixture();let actions=legalActions(game);
 assert.equal(handCue(game,game.players[0].hand[2],actions).label,'精力不足');assert.ok(handCue(game,game.players[0].hand[2],actions).reason.includes('现在有 2'));
 assert.equal(handCue(game,game.players[0].hand[3],actions).label,'需要护盾');
 while(game.players[0].board.length<5)game.players[0].board.push(unit('waiting',`full-${game.players[0].board.length}`,false));actions=legalActions(game);assert.equal(handCue(game,game.players[0].hand[0],actions).label,'场位已满');
});
test('已就绪立场在对手回合也不能标记可攻击，结束后停止所有行动提示',()=>{
 const game=fixture();game.active=1;let actions=legalActions(game);
 assert.equal(actionGuide(game,actions).attackers.size,0);assert.equal(actionGuide(game,actions).playable.size,0);assert.equal(boardCue(game,0,game.players[0].board[0],actions).label,'对手回合');assert.equal(handCue(game,game.players[0].hand[0],actions).label,'对手回合');
 game.status='finished';actions=legalActions(game);assert.equal(handCue(game,game.players[0].hand[0],actions).label,'对局结束');
});
test('新入场立场提示等待，到了下一个己方回合才允许攻击',()=>{
 let game=fixture();game=applyAction(game,{type:'play',uid:'h-wait'});let own=game.players[0].board.find(unit=>unit.uid==='h-wait');assert.equal(boardCue(game,0,own,legalActions(game)).label,'等待下回合');
 game=applyAction(game,{type:'end'});game=applyAction(game,{type:'end'});own=game.players[0].board.find(unit=>unit.uid==='h-wait');assert.equal(boardCue(game,0,own,legalActions(game)).label,'可攻击');
});
test('没有动作时提醒结束回合，仍能用技能时不会误报无动作',()=>{
 const game=fixture();game.players[0].hand=[];game.players[0].board=[];game.players[0].energy=1;
 let guide=actionGuide(game,legalActions(game));assert.equal(guide.onlyEnd,true);assert.ok(guide.message.includes('结束回合'));
 game.players[0].energy=2;guide=actionGuide(game,legalActions(game));assert.equal(guide.onlyEnd,false);assert.ok(guide.message.includes('技能'));
});
