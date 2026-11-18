import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, CARD_MAP, DECKS } from '../src/cards.js';
import { createGame, applyAction, legalActions, cardCost, unitTags, chooseAIAction, restoreSavedGame, validSavedGame } from '../src/engine.js';
function fixture(deckId='blame') {
 const game=createGame({deckId,opponentDeckId:'blame',seed:999999});
 for(const player of game.players){player.hand=[];player.board=[];player.secrets=[];player.deck=['waiting','waiting','waiting','waiting'];player.energy=player.maxEnergy=8;player.pots=player.armor=0;player.graveyard=[];}
 return game;
}
function hand(game,side,id){const card={id,uid:`t${game.nextId++}`};game.players[side].hand.push(card);return card.uid;}
function unit(game,side,id,values={}){const card=CARD_MAP[id];const item={id,uid:`t${game.nextId++}`,attack:card.attack,health:card.health,maxHealth:card.health,ready:true,frozen:0,silenced:false,...values};game.players[side].board.push(item);return item.uid;}
const play=(uid,side,id)=>({type:'play',uid,...id?{target:{side,id}}:{}});
test('六个不同流派均有合法二十张套牌和独立技能',()=>{
 assert.equal(CARDS.length,44);assert.equal(new Set(CARDS.map(card=>card.id)).size,44);assert.equal(DECKS.length,6);
 for(const deck of DECKS){assert.equal(deck.cards.length*2,20);assert.equal(new Set(deck.cards).size,10);assert.ok(deck.cards.every(id=>CARD_MAP[id]&&id!=='helper'));assert.equal(deck.power.cost,deck.id==='recur'?1:2);}
 assert.equal(new Set(DECKS.map(deck=>deck.power.effect)).size,6);
});
test('技能花费精力、每回合限一次，不算话术，并在下一回合恢复',()=>{
 for(const deck of DECKS){
  let game=fixture(deck.id);game.players[0].health=20;game.players[0].pots=2;game.players[0].graveyard=['cc'];
  game=applyAction(game,{type:'power'});const player=game.players[0];assert.equal(player.energy,8-deck.power.cost);assert.equal(player.powerUsed,true);assert.equal(player.spellsPlayed,0);assert.ok(!legalActions(game).some(action=>action.type==='power'));
  if(deck.id==='blame')assert.equal(game.players[1].pots,1);
  if(deck.id==='combo'){assert.equal(player.hand.length,1);assert.equal(player.spellDiscount,1);}
  if(deck.id==='control'){assert.equal(player.armor,2);assert.equal(player.pots,1);}
  if(deck.id==='shield'){assert.equal(player.health,22);assert.equal(player.armor,2);}
  if(deck.id==='growth')assert.equal(player.board[0].id,'helper');
  if(deck.id==='recur'){assert.equal(player.hand[0].id,'cc');assert.equal(player.graveyard.length,0);}
  game=applyAction(game,{type:'end'});game=applyAction(game,{type:'end'});assert.equal(game.players[0].powerUsed,false);assert.equal(game.players[0].spellDiscount,0);
 }
});
test('技能服从锅位、场位、交接区和手牌上限',()=>{
 for(const deckId of ['blame','growth','recur','combo']){
  const game=fixture(deckId);game.players[1].pots=3;
  if(deckId==='growth')for(let i=0;i<5;i++)unit(game,0,'helper');
  if(deckId==='combo')for(let i=0;i<8;i++)hand(game,0,'ack');
  assert.ok(!legalActions(game).some(action=>action.type==='power'),deckId);
 }
});
test('腹稿只减免下一张话术，不产生负费用或提前触发连击',()=>{
 let game=fixture('combo');const spell=hand(game,0,'supplement');game=applyAction(game,{type:'power'});assert.equal(cardCost(game.players[0],CARD_MAP.supplement),1);
 game=applyAction(game,play(spell,1,'hero'));assert.equal(game.players[0].energy,5);assert.equal(game.players[1].health,23);assert.equal(game.players[0].spellDiscount,0);
 game=fixture('combo');game.players[0].spellDiscount=1;const overtime=hand(game,0,'overtime');assert.equal(cardCost(game.players[0],CARD_MAP.overtime),0);game=applyAction(game,play(overtime));assert.equal(game.players[0].spellDiscount,0);
});
test('召唤受五个场位约束，带新人仅由其他立场触发',()=>{
 let game=fixture('growth');unit(game,0,'mentor');for(let i=0;i<3;i++)unit(game,0,'helper');const card=hand(game,0,'recruit');game=applyAction(game,play(card));assert.equal(game.players[0].board.length,5);assert.equal(game.players[0].board[0].attack,3);
});
test('成长引擎能成长，被牺牲的引擎不能靠成长复活',()=>{
 let game=fixture();unit(game,0,'partner');const ack=hand(game,0,'ack');game=applyAction(game,play(ack));assert.equal(game.players[0].board[0].attack,4);assert.equal(game.players[0].board[0].health,5);
 const target=game.players[0].board[0].uid;const sacrifice=hand(game,0,'handover');game=applyAction(game,play(sacrifice,0,target));assert.equal(game.players[0].board.length,0);assert.equal(game.players[0].graveyard.at(-1),'partner');
});
test('沉默移除拦截、汲取和离场能力，保留当前攻防',()=>{
 let game=fixture();const guard=unit(game,1,'leader',{attack:5,health:7,maxHealth:7});const attacker=unit(game,0,'waiting');const silence=hand(game,0,'silence');game=applyAction(game,play(silence,1,guard));assert.deepEqual(unitTags(game.players[1].board[0]),[]);assert.equal(game.players[1].board[0].attack,5);assert.ok(legalActions(game).some(action=>action.type==='attack'&&action.uid===attacker&&action.target.id==='hero'));
 game=fixture();const cc=unit(game,1,'cc',{health:2});const mute=hand(game,0,'silence');const hit=hand(game,0,'supplement');game=applyAction(game,play(mute,1,cc));game=applyAction(game,play(hit,1,cc));assert.equal(game.players[0].pots,0);
});
test('退回手牌不触发离场，再入场恢复基础状态',()=>{
 let game=fixture();const cc=unit(game,1,'cc',{attack:9,health:9,maxHealth:9,silenced:true,frozen:1});const bounce=hand(game,0,'redirect');game=applyAction(game,play(bounce,1,cc));assert.equal(game.players[1].graveyard.length,0);assert.equal(game.players[0].pots,0);game.active=1;
 game=applyAction(game,play(game.players[1].hand[0].uid));const returned=game.players[1].board[0];assert.equal(returned.attack,2);assert.equal(returned.health,4);assert.equal(returned.ready,false);assert.equal(returned.silenced,false);assert.equal(returned.frozen,0);
});
test('话术反制仍消耗费用与手牌，只反制一次，并保留已使用话术计数',()=>{
 let game=fixture();game.players[1].secrets=[{id:'cancel',uid:'hidden'}];const ack=hand(game,0,'ack');const follow=hand(game,0,'supplement');game=applyAction(game,play(ack));assert.equal(game.players[0].energy,7);assert.equal(game.players[0].armor,0);assert.equal(game.players[0].hand.length,1);assert.equal(game.players[1].secrets.length,0);game=applyAction(game,play(follow,1,'hero'));assert.equal(game.players[1].health,21);
});
test('护盾转换伤害遵守六点上限，并支付护盾成本',()=>{
 let game=fixture('shield');game.players[0].armor=8;const uid=hand(game,0,'armorStrike');game=applyAction(game,play(uid,1,'hero'));assert.equal(game.players[1].health,19);assert.equal(game.players[0].armor,5);
 game=fixture('shield');const dead=hand(game,0,'armorStrike');assert.ok(!legalActions(game).some(action=>action.uid===dead));
});
test('汲取按实际伤害恢复，过量伤害和护盾吸收不提供额外恢复',()=>{
 let game=fixture('shield');game.players[0].health=20;const attacker=unit(game,0,'lifesteal');const target=unit(game,1,'intern');game=applyAction(game,{type:'attack',uid:attacker,target:{side:1,id:target}});assert.equal(game.players[0].health,21);
 game=fixture('shield');game.players[0].health=20;game.players[1].armor=3;const next=unit(game,0,'lifesteal');game=applyAction(game,{type:'attack',uid:next,target:{side:1,id:'hero'}});assert.equal(game.players[0].health,20);
});
test('反伤参与立场交锋，沉默后不再反伤',()=>{
 for(const silenced of [false,true]){let game=fixture();const attacker=unit(game,0,'waiting',{health:2});const tank=unit(game,1,'tank',{silenced});game=applyAction(game,{type:'attack',uid:attacker,target:{side:1,id:tank}});assert.equal(game.players[0].board.length,silenced?1:0);assert.equal(game.players[1].board[0].health,4);}
});
test('离场可触发召唤和成长，返聘消耗交接记录且恢复基础攻防',()=>{
 let game=fixture('recur');unit(game,0,'veteran');const heir=unit(game,0,'heir');const sacrifice=hand(game,0,'handover');game=applyAction(game,play(sacrifice,0,heir));assert.equal(game.players[0].board[0].attack,4);assert.equal(game.players[0].board[0].health,5);assert.ok(game.players[0].board.some(unit=>unit.id==='helper'));assert.deepEqual(game.players[0].graveyard,['heir']);const revive=hand(game,0,'rehire');game=applyAction(game,play(revive));assert.equal(game.players[0].graveyard.length,0);const revived=game.players[0].board.find(unit=>unit.id==='heir');assert.equal(revived.health,CARD_MAP.heir.health);assert.equal(revived.ready,false);
});
test('挂锅能立即引爆，话术连击按此前使用数增长且封顶',()=>{
 let game=fixture();game.players[1].pots=3;const explode=hand(game,0,'escalate');game=applyAction(game,play(explode,1,'hero'));assert.equal(game.players[1].health,14);assert.equal(game.players[1].pots,0);
 for(const count of [0,1,5]){game=fixture('combo');game.players[0].spellsPlayed=count;const final=hand(game,0,'finalword');game=applyAction(game,play(final,1,'hero'));assert.equal(game.players[1].health,25-Math.min(4,1+count));}
});
test('旧版存档保留对局和手牌，补齐新机制字段后可继续',()=>{
 const old=fixture();old.rulesVersion=1;for(const player of old.players){delete player.graveyard;delete player.powerUsed;delete player.spellDiscount;}const restored=restoreSavedGame(old);assert.ok(validSavedGame(restored));assert.equal(restored.id,old.id);assert.deepEqual(restored.players[0].hand,old.players[0].hand);assert.equal(restored.turn,old.turn);assert.deepEqual(restored.players[0].graveyard,[]);assert.equal(restoreSavedGame({...old,rulesVersion:99}),null);
});
test('难度不限定流派，六种流派全部组合均能完成对局',()=>{
 for(const deck of DECKS)for(const opponent of DECKS){
  let game=createGame({deckId:deck.id,opponentDeckId:opponent.id,difficulty:'normal',seed:7919});assert.equal(game.players[1].deckId,opponent.id);let steps=0;
  while(game.status==='playing'&&steps++<800){game=applyAction(game,chooseAIAction(game,'normal'));for(const player of game.players){assert.ok(player.energy>=0);assert.ok(player.health<=25);assert.ok(player.board.length<=5);assert.ok(player.hand.length<=8);assert.ok(player.pots<=3);}}
  assert.equal(game.status,'finished',`${deck.id}/${opponent.id}`);
 }
});
test('新增流派在所有电脑难度下均能完成对局',()=>{
 for(const deck of DECKS)for(const difficulty of ['easy','normal','hard']){
  let game=createGame({deckId:deck.id,opponentDeckId:deck.id,difficulty,seed:99137});let steps=0;
  while(game.status==='playing'&&steps++<900)game=applyAction(game,chooseAIAction(game,game.active===0?'normal':difficulty));
  assert.equal(game.status,'finished',`${deck.id}/${difficulty}`);
 }
});
test('普通电脑能识别先挂锅再引爆的致胜路线',()=>{
 let game=fixture();game.players[0].energy=6;game.players[1].health=5;hand(game,0,'notmine');const finish=hand(game,0,'escalate');const setup=chooseAIAction(game,'normal');assert.ok(setup.type==='power'||setup.type==='play'&&setup.uid!==finish);game=applyAction(game,setup);const next=chooseAIAction(game,'normal');assert.equal(next.uid,finish);assert.equal(applyAction(game,next).winner,0);
});
test('临时帮手离场仍触发成长，但不进入交接区',()=>{
 let game=fixture('recur');unit(game,0,'veteran');const helper=unit(game,0,'helper');const sacrifice=hand(game,0,'handover');game=applyAction(game,play(sacrifice,0,helper));assert.equal(game.players[0].board[0].attack,4);assert.deepEqual(game.players[0].graveyard,[]);
});
test('无锅时甩锅也可启动，后手拥有一次临时精力补偿',()=>{
 let game=fixture();const mark=hand(game,0,'notmine');game=applyAction(game,play(mark));assert.equal(game.players[1].pots,1);
 const opening=createGame({seed:99137});assert.equal(opening.players[1].hand.filter(card=>card.id==='coin').length,1);assert.equal(opening.players[0].hand.some(card=>card.id==='coin'),false);
});
