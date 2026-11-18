import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
const modulePath=process.env.PLAYWRIGHT_MODULE;
const {chromium}=await import(modulePath?pathToFileURL(modulePath).href:'playwright');
const browser=await chromium.launch({headless:true,...process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}});
const page=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'no-preference'});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const url=process.env.BASE_URL||'http://127.0.0.1:5178';
const read=()=>page.evaluate(async()=>{const {loadLocalData}=await import('/src/storage.js');return(await loadLocalData()).game;});
async function fixture(deckId,legacy=false){
 await page.evaluate(async({deckId,legacy})=>{
  const {createGame}=await import('/src/engine.js');const {saveGame}=await import('/src/storage.js');
  const game=createGame({deckId,opponentDeckId:'control',seed:10243});const player=game.players[0];
  player.energy=player.maxEnergy=8;player.board=[];player.hand=[{id:'supplement',uid:'target-spell'}];player.deck=['ack','waiting','waiting'];
  if(deckId==='recur')player.graveyard=['cc','cc'];
  if(legacy){game.rulesVersion=1;for(const item of game.players){delete item.powerUsed;delete item.graveyard;delete item.spellDiscount;}}
  await saveGame(game);
 },{deckId,legacy});
 await page.reload();await page.locator('[data-action="resume"]').click();await page.waitForTimeout(350);
}
const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
try{
 await page.goto(url);await page.locator('.start-button').waitFor();if(await page.locator('[data-action="tutorial-later"]').count())await page.locator('[data-action="tutorial-later"]').click();assert.equal(await page.locator('.deck-tab').count(),6);
 for(const id of ['blame','combo','control','shield','growth','recur']){
  await page.locator(`.deck-tab[data-value="${id}"]`).click();await page.locator('[data-action="deck-details"]').click();assert.equal(await page.locator('.deck-card-list>button').count(),10);assert.ok((await page.locator('.deck-detail-power').textContent()).includes('每回合一次'));await page.keyboard.press('Escape');
 }
 await page.locator('#opponent-deck').selectOption('growth');await page.locator('[data-action="opponent"][data-value="hard"]').click();await page.reload();await page.locator('.start-button').waitFor();if(await page.locator('[data-action="tutorial-later"]').count())await page.locator('[data-action="tutorial-later"]').click();assert.equal(await page.locator('#opponent-deck').inputValue(),'growth');assert.ok((await page.locator('.opponent-card.chosen').textContent()).includes('部门总监'));
 await page.locator('[data-screen="cards"]').click();assert.equal(await page.locator('.collection-grid .game-card').count(),44);
 const clipped=await page.locator('.collection-grid .game-card').evaluateAll(cards=>cards.filter(card=>{const stats=card.querySelector('.card-stats');return stats&&stats.getBoundingClientRect().bottom>card.querySelector('.card-inner').getBoundingClientRect().bottom+1;}).map(card=>card.dataset.card));
 assert.deepEqual(clipped,[],'卡面文本不能挤掉攻防数值');
 await page.locator('#card-search').fill('沉默');assert.ok(await page.locator('.collection-grid .game-card').count()>0);
 await page.locator('[data-screen="lobby"]').first().click();
 await mkdir('/tmp/office-ink-shots',{recursive:true});await page.screenshot({path:'/tmp/office-ink-shots/lobby-enhanced.png',fullPage:true});
 for(const width of [360,390,768,1280]){await page.setViewportSize({width,height:900});assert.equal(await overflow(),false,`六流派首页 ${width}px 溢出`);}
 await page.setViewportSize({width:360,height:844});
 let selectionTop;
 for(const id of ['blame','combo','control','shield','growth','recur']){await page.locator(`.deck-tab[data-value="${id}"]`).click();const top=await page.locator('.bottom-strip').evaluate(el=>el.getBoundingClientRect().top+scrollY);if(selectionTop===undefined)selectionTop=top;assert.ok(Math.abs(top-selectionTop)<=.5,`切换 ${id} 不应改变主页高度`);}
 await page.setViewportSize({width:390,height:844});
 await fixture('combo');const before=await page.locator('.hand-area').evaluate(el=>el.getBoundingClientRect().top+scrollY);
 await page.locator('[data-action="power"]').click();await page.locator('.ability-button.used').waitFor();const after=await page.locator('.hand-area').evaluate(el=>el.getBoundingClientRect().top+scrollY);assert.ok(Math.abs(after-before)<=.5,'技能状态变化不应推动手牌');assert.equal(await page.locator('.hand[data-uid="target-spell"] .card-cost').textContent(),'1');assert.equal(await page.locator('.ability-button').isDisabled(),true);assert.equal(await overflow(),false);
 await page.locator('.hand[data-card="ack"]').click();assert.equal(await page.locator('.hand[data-uid="target-spell"] .card-cost').textContent(),'2');
 await fixture('growth');await page.locator('[data-action="power"]').click();await page.locator('.board[data-card="helper"]').waitFor();assert.equal((await read()).players[0].board[0].id,'helper');await page.screenshot({path:'/tmp/office-ink-shots/skill-mobile.png',fullPage:true});
 await fixture('recur');await page.locator('[data-action="grave"]').click();assert.ok((await page.locator('.deck-card-list').textContent()).includes('已抄送相关领导'));assert.equal(await page.locator('.deck-card-list>button').count(),2);await page.locator('[data-action="grave"]').evaluate(button=>button.click());assert.equal(await page.locator('.deck-card-list>button').count(),2);await page.keyboard.press('Escape');await page.locator('[data-action="power"]').click();await page.locator('.hand[data-card="cc"]').waitFor();assert.equal((await read()).players[0].graveyard.length,1);
 await fixture('blame',true);await page.locator('[data-action="power"]').click();await page.locator('.ability-button.used').waitFor();assert.equal((await read()).rulesVersion,2);assert.equal((await read()).players[1].pots,1);
 await page.locator('[data-action="end"]').click();
 for(let i=0;i<100;i++){const game=await read();if(game.turn>=3&&game.active===0)break;await page.waitForTimeout(150);}
 assert.equal((await read()).active,0);assert.equal((await read()).players[0].powerUsed,false);
 assert.deepEqual(errors,[]);console.log('PASS 六流派详情、对手流派持久化、44张图鉴、四种宽度、技能与减费、召唤、交接回收、旧存档恢复、技能跨回合重置');
}finally{await browser.close();}
