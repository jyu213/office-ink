import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, legalActions, chooseAIAction, validSavedGame } from '../src/engine.js';
import { CARD_MAP } from '../src/cards.js';
function fixture() {
  const state=createGame({seed:12});state.active=0;
  for(const player of state.players){player.hand=[];player.board=[];player.secrets=[];player.energy=8;player.maxEnergy=8;player.pots=0;player.armor=0;player.health=25;}
  return state;
}
function hand(state,side,id){const item={id,uid:`test-${state.nextId++}`};state.players[side].hand.push(item);return item.uid;}
function unit(state,side,id,{ready=true,...overrides}={}){const card=CARD_MAP[id];const item={id,uid:`test-${state.nextId++}`,attack:card.attack,health:card.health,maxHealth:card.health,ready,frozen:0,...overrides};state.players[side].board.push(item);return item.uid;}
const play=(uid,target)=>({type:'play',uid,...target?{target}:{}});
test('出牌扣费，护盾和抽牌生效，原始状态保持不变',()=>{
 const state=fixture();const uid=hand(state,0,'ack');const before=structuredClone(state);
 const next=applyAction(state,play(uid));assert.equal(next.players[0].energy,7);assert.equal(next.players[0].armor,3);assert.equal(next.players[0].hand.length,1);assert.deepEqual(state,before);
});
test('拦截限制立场攻击，话术可以绕过',()=>{
 const state=fixture();const attacker=unit(state,0,'waiting');const guard=unit(state,1,'leader');const spell=hand(state,0,'supplement');
 const attacks=legalActions(state).filter(action=>action.type==='attack');assert.equal(attacks.length,1);assert.equal(attacks[0].target.id,guard);
 assert.throws(()=>applyAction(state,{type:'attack',uid:attacker,target:{side:1,id:'hero'}}));
 assert.equal(applyAction(state,play(spell,{side:1,id:'hero'})).players[1].health,23);
});
test('话术触发连击，立场不能作为话术连击的前置',()=>{
 let state=fixture();const ack=hand(state,0,'ack');const spell=hand(state,0,'supplement');state=applyAction(state,play(ack));state=applyAction(state,play(spell,{side:1,id:'hero'}));assert.equal(state.players[1].health,21);
 state=fixture();const first=hand(state,0,'intern');const next=hand(state,0,'supplement');state=applyAction(state,play(first));state=applyAction(state,play(next,{side:1,id:'hero'}));assert.equal(state.players[1].health,23);
});
test('锅可主动处理，结算使用护盾，结束时清空',()=>{
 let state=fixture();state.players[0].pots=3;state.players[0].armor=1;
 state=applyAction(state,{type:'resolve'});assert.equal(state.players[0].energy,7);assert.equal(state.players[0].pots,2);
 state=applyAction(state,{type:'end'});assert.equal(state.players[0].health,22);assert.equal(state.players[0].armor,0);assert.equal(state.players[0].pots,0);assert.equal(state.active,1);
});
test('留痕伏笔消耗一次，反制整次挂锅，伏笔日志不提前泄露名称',()=>{
 let state=fixture();state.active=1;const secret=hand(state,1,'receipts');state=applyAction(state,play(secret));assert.ok(!state.log.at(-1).text.includes(CARD_MAP.receipts.name));
 state.active=0;const follower=hand(state,0,'follow');state=applyAction(state,play(follower));assert.equal(state.players[1].pots,0);assert.equal(state.players[0].health,22);assert.equal(state.players[1].secrets.length,0);
});
test('甩锅移除自己的锅，并受对方锅位上限约束',()=>{
 let state=fixture();state.players[0].pots=3;state.players[1].pots=2;const uid=hand(state,0,'notmine');state=applyAction(state,play(uid));assert.equal(state.players[0].pots,1);assert.equal(state.players[1].pots,3);
});
test('普通立场不能立即攻击，突袭立场可以',()=>{
 let state=fixture();const normal=hand(state,0,'waiting');state=applyAction(state,play(normal));assert.ok(!legalActions(state).some(action=>action.type==='attack'));
 const haste=hand(state,0,'deadline');state=applyAction(state,play(haste));assert.ok(legalActions(state).some(action=>action.type==='attack'&&action.uid===haste));
});
test('流程只跳过目标的下一个攻击回合，之后恢复',()=>{
 let state=fixture();const uid=unit(state,1,'leader');const spell=hand(state,0,'process');state=applyAction(state,play(spell,{side:1,id:uid}));state=applyAction(state,{type:'end'});assert.equal(state.players[1].board[0].ready,false);
 state=applyAction(state,{type:'end'});state=applyAction(state,{type:'end'});assert.equal(state.players[1].board[0].ready,true);
});
test('立场互相造成伤害，离场效果会挂锅',()=>{
 let state=fixture();const attacker=unit(state,0,'deadline');const target=unit(state,1,'cc');state=applyAction(state,{type:'attack',uid:attacker,target:{side:1,id:target}});assert.equal(state.players[0].board[0].health,1);assert.equal(state.players[1].board.length,0);assert.equal(state.players[0].pots,1);
});
test('心态归零立即结束，不再开始对手回合',()=>{
 let state=fixture();state.players[0].health=1;state.players[0].pots=1;const turn=state.turn;state=applyAction(state,{type:'end'});assert.equal(state.status,'finished');assert.equal(state.winner,1);assert.equal(state.turn,turn);assert.deepEqual(legalActions(state),[]);
});
test('空牌库疲劳递增并可结束游戏',()=>{
 let state=fixture();state.players[1].deck=[];state.players[1].fatigue=2;state.players[1].health=3;state=applyAction(state,{type:'end'});assert.equal(state.players[1].fatigue,3);assert.equal(state.status,'finished');assert.equal(state.winner,0);
});
test('满手牌不会超过八张，满场不能继续召唤',()=>{
 let state=fixture();for(let i=0;i<8;i++)hand(state,0,'circle');const uid=state.players[0].hand[0].uid;state=applyAction(state,play(uid));assert.equal(state.players[0].hand.length,8);
 state=fixture();for(let i=0;i<5;i++)unit(state,0,'waiting');const summon=hand(state,0,'intern');assert.ok(!legalActions(state).some(action=>action.uid===summon));
});
test('相同种子洗牌一致，存档版本和卡牌可校验',()=>{
 const a=createGame({seed:777});const b=createGame({seed:777});assert.deepEqual(a.players,b.players);assert.equal(validSavedGame(a),true);assert.equal(validSavedGame({...a,rulesVersion:0}),false);a.players[0].hand[0].id='missing';assert.equal(validSavedGame(a),false);
});
test('电脑优先选择可见的致胜攻击',()=>{
 const state=fixture();unit(state,0,'waiting');state.players[1].health=2;for(const difficulty of ['normal','hard']){const action=chooseAIAction(state,difficulty);assert.equal(action.type,'attack');assert.equal(action.target.id,'hero');assert.equal(applyAction(state,action).winner,0);}
});
test('电脑决策不因对手隐藏手牌或伏笔内容而变化',()=>{
 const state=fixture();hand(state,0,'follow');hand(state,0,'minutes');state.players[1].secrets=[{id:'quiet',uid:'hidden'}];hand(state,1,'ack');
 const changed=structuredClone(state);changed.players[1].secrets[0].id='receipts';changed.players[1].hand[0].id='boss';
 assert.deepEqual(chooseAIAction(state,'hard'),chooseAIAction(changed,'hard'));
});
test('多套牌和难度均可完成完整对局，持续行动不会卡死',()=>{
 for(const deckId of ['blame','combo','control'])for(const difficulty of ['easy','normal','hard']){
  let state=createGame({deckId,difficulty,seed:512+(deckId.length*difficulty.length)});let steps=0;
  while(state.status==='playing'&&steps++<700){const action=chooseAIAction(state,state.active===0?'normal':difficulty);state=applyAction(state,action);for(const player of state.players){assert.ok(player.energy>=0);assert.ok(player.pots<=3);assert.ok(player.hand.length<=8);assert.ok(player.board.length<=5);}}
  assert.equal(state.status,'finished',`${deckId}/${difficulty} 对局未结束`);
 }
});
