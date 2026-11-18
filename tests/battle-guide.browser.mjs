import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
const modulePath=process.env.PLAYWRIGHT_MODULE;
const {chromium}=await import(modulePath?pathToFileURL(modulePath).href:'playwright');
const browser=await chromium.launch({headless:true,...process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}});
const url=process.env.BASE_URL||'http://127.0.0.1:5178';
const read=page=>page.evaluate(async()=>{const {loadLocalData}=await import('/src/storage.js');return(await loadLocalData()).game;});
async function fixture(page){
 await page.goto(url);await page.locator('.start-button').waitFor();if(await page.locator('[data-action="tutorial-later"]').count())await page.locator('[data-action="tutorial-later"]').click();
 await page.evaluate(async()=>{
  const {createGame}=await import('/src/engine.js');const {saveGame}=await import('/src/storage.js');const {CARD_MAP}=await import('/src/cards.js');
  const game=createGame({seed:77119,opponentDeckId:'control'}),player=game.players[0];
  const unit=(id,uid,ready)=>({id,uid,attack:CARD_MAP[id].attack,health:CARD_MAP[id].health,maxHealth:CARD_MAP[id].health,ready,frozen:0,silenced:false});
  player.energy=player.maxEnergy=2;player.hand=[{id:'waiting',uid:'h-wait'},{id:'supplement',uid:'h-hit'},{id:'boss',uid:'h-boss'},{id:'armorStrike',uid:'h-armor'}];player.board=[unit('waiting','u-ready',true),unit('waiting','u-sleep',false)];
  game.players[1].board=[unit('leader','u-guard',false),unit('waiting','u-enemy',false)];await saveGame(game);
 });
 await page.reload();await page.locator('[data-action="resume"]').click();await page.waitForTimeout(400);
}
try{
 await mkdir('/tmp/office-ink-shots',{recursive:true});
 for(const width of [1280,360]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'no-preference'});const errors=[];page.on('pageerror',error=>errors.push(error.message));await fixture(page);
  assert.equal(await page.locator('.hand.cue-playable').count(),2);assert.equal(await page.locator('.board.cue-attackable').count(),1);
  assert.equal(await page.locator('.hand[data-uid="h-boss"] .card-action-badge').textContent(),'精力不足');assert.equal(await page.locator('.hand[data-uid="h-armor"] .card-action-badge').textContent(),'需要护盾');
  assert.equal(await page.locator('.board[data-uid="u-sleep"] .card-action-badge').textContent(),'等待下回合');assert.equal(await page.locator('.board[data-uid="u-ready"] .card-action-badge').textContent(),'可攻击');
  assert.equal(await page.locator('.assist-actions [data-value="hand"] b').textContent(),'2');assert.equal(await page.locator('.assist-actions [data-value="attack"] b').textContent(),'1');
  const initial=await read(page);await page.locator('[data-action="locate-action"][data-value="hand"]').click();await page.waitForTimeout(500);assert.deepEqual(await read(page),initial);
  await page.locator('.hand[data-uid="h-boss"]').click();assert.ok((await page.locator('#toast').textContent()).includes('需要 6 点精力'));
  await page.locator('[data-action="locate-action"][data-value="attack"]').click();await page.waitForTimeout(500);assert.equal(await page.locator('.board.selected').count(),0);assert.deepEqual(await read(page),initial);
  await page.screenshot({path:`/tmp/office-ink-shots/action-guide-${width}.png`,fullPage:false});
  await page.locator('.board[data-uid="u-ready"]').click();assert.equal(await page.locator('.board.cue-target').count(),1);assert.equal(await page.locator('.board[data-uid="u-guard"] .card-action-badge').textContent(),'点击攻击');assert.equal(await page.locator('.hero-target-label').count(),0);assert.ok((await page.locator('.assist-message').textContent()).includes('拦截'));
  await page.locator('.assist-header [data-action="cancel"]').click();assert.equal(await page.locator('.board.cue-attackable').count(),1);
  await page.locator('.hand[data-uid="h-hit"]').click();assert.equal(await page.locator('.board.cue-target').count(),2);assert.equal(await page.locator('.hero-target-label').textContent(),'选对手为目标');assert.equal(await page.locator('[data-value="target"] b').textContent(),'3');
  await page.locator('[data-action="locate-action"][data-value="target"]').click();await page.waitForTimeout(500);await page.locator('.hero-identity[data-side="1"]').click();await page.waitForTimeout(100);assert.equal((await read(page)).players[1].health,23);assert.equal(await page.locator('.hand.cue-playable').count(),0);assert.equal(await page.locator('.board.cue-attackable').count(),1);
  await page.locator('.board[data-uid="u-ready"]').click();await page.locator('.board[data-uid="u-guard"]').click();await page.waitForTimeout(100);assert.equal(await page.locator('.board.cue-attackable').count(),0);assert.ok((await page.locator('.assist-message').textContent()).includes('没有可用动作'));assert.equal(await page.locator('.end-button.recommended-end').count(),1);
  await page.locator('[data-action="end"]').click();assert.equal(await page.locator('.board.cue-attackable').count(),0);assert.equal(await page.locator('.ready-dot').count(),0);assert.ok((await page.locator('.assist-header').textContent()).includes('对手正在行动'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS 桌面/手机：可出牌与攻击标记、不可用原因、数量去重、定位不代打、拦截目标、话术目标与头像、行动后更新、结束回合提示和对手回合禁用');
}finally{await browser.close();}
