import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
const modulePath=process.env.PLAYWRIGHT_MODULE;
const {chromium}=await import(modulePath?pathToFileURL(modulePath).href:'playwright');
const browser=await chromium.launch({headless:true,...process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}});
const url=process.env.BASE_URL||'http://127.0.0.1:5178';
const local=page=>page.evaluate(async()=>{const {loadLocalData}=await import('/src/storage.js');return loadLocalData();});
async function step(page,index){
 await page.waitForFunction(index=>document.querySelector('.tutorial-coach-head b')?.textContent.trim()===`${index+1} / 9`&&!document.querySelector('.save-status')?.textContent.includes('存档中'),index);
}
async function finishLesson(page){
 await page.locator('[data-action="resolve"]').click();await step(page,4);
 await page.locator('.board[data-uid="tutorial-waiting"]').click();assert.ok((await page.locator('.tutorial-instruction').textContent()).includes('现在点击'));
 assert.equal(await page.locator('.board[data-uid="tutorial-follow"]').evaluate(el=>el.classList.contains('tutorial-focus')),true);
 await page.locator('.board[data-uid="tutorial-follow"]').click();await step(page,5);
 await page.locator('.hand[data-uid="tutorial-supplement"]').click();await page.keyboard.press('Escape');assert.equal(await page.locator('.hand[data-uid="tutorial-supplement"]').evaluate(el=>el.classList.contains('tutorial-focus')),true);
 await page.locator('.hand[data-uid="tutorial-supplement"]').click();await page.locator('.board[data-uid="tutorial-follow"]').click();await step(page,6);assert.equal(await page.locator('.board-side-1 .game-card').count(),0);
 await page.locator('[data-action="power"]').click();await step(page,7);assert.equal(await page.locator('[data-action="power"]').isDisabled(),true);
 await page.locator('[data-action="end"]').click();await step(page,8);assert.ok((await page.locator('.hero-row.side-1 .hero-vitals').textContent()).includes('2 / 25'));
 await page.locator('.board[data-uid="tutorial-waiting"]').click();await page.locator('.hero-identity[data-side="1"]').click();await page.locator('[data-action="tutorial-finish"]').waitFor();
}
try{
 await mkdir('/tmp/office-ink-shots',{recursive:true});
 const desktop=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'no-preference'});const errors=[];desktop.on('pageerror',error=>errors.push(error.message));
 await desktop.goto(url);await desktop.locator('[data-action="tutorial-later"]').click();await desktop.reload();await desktop.locator('.start-button').waitFor();assert.equal(await desktop.locator('[data-action="tutorial-later"]').count(),0);
 await desktop.locator('.deck-tab[data-value="growth"]').click();await desktop.locator('.opponent-card[data-value="hard"]').click();
 const normal=await desktop.evaluate(async()=>{const {createGame}=await import('/src/engine.js');const {saveGame}=await import('/src/storage.js');const game=createGame({deckId:'growth',difficulty:'hard',opponentDeckId:'shield',seed:77119});await saveGame(game);return game;});
 await desktop.reload();await desktop.locator('.tutorial-entry').click();await step(desktop,0);assert.equal(await desktop.locator('[data-action="end"]').isDisabled(),true);
 await desktop.locator('[data-action="tutorial-next"]').click();await step(desktop,1);
 await desktop.locator('.hand[data-uid="tutorial-supplement"]').click();assert.equal((await local(desktop)).tutorial.step,1);assert.ok((await desktop.locator('#toast').textContent()).includes('大家都在等你'));
 await desktop.locator('.hand[data-uid="tutorial-waiting"]').click();await step(desktop,2);assert.equal(await desktop.locator('.board[data-uid="tutorial-waiting"] .ready-dot').count(),0);
 await desktop.locator('[data-action="end"]').click();await step(desktop,3);assert.equal((await local(desktop)).tutorial.game.players[0].pots,1);
 await desktop.locator('.tutorial-coach [data-screen="lobby"]').click();assert.deepEqual((await local(desktop)).game,normal);
 await desktop.reload();await desktop.locator('.tutorial-entry').click();await step(desktop,3);
 await finishLesson(desktop);
 const completed=await local(desktop);assert.equal(completed.settings.tutorialCompleted,true);assert.equal(completed.tutorial,null);assert.equal(completed.matches.length,0);assert.deepEqual(completed.game,normal);
 await desktop.locator('[data-action="tutorial-finish"]').click();assert.ok((await desktop.locator('.deck-tab.chosen').textContent()).includes('画饼大师'));assert.ok((await desktop.locator('.opponent-card.chosen').textContent()).includes('部门总监'));assert.equal(await desktop.locator('[data-action="resume"]').count(),1);
 await desktop.locator('.tutorial-entry').click();await step(desktop,0);await desktop.locator('[data-action="tutorial-next"]').click();await step(desktop,1);await desktop.locator('[data-action="tutorial-restart"]').click();await step(desktop,0);assert.deepEqual((await local(desktop)).game,normal);
 await desktop.screenshot({path:'/tmp/office-ink-shots/tutorial-desktop.png',fullPage:false});
 await desktop.close();
 const mobile=await browser.newPage({viewport:{width:360,height:844},reducedMotion:'no-preference'});mobile.on('pageerror',error=>errors.push(error.message));await mobile.goto(url);await mobile.locator('.modal [data-action="tutorial-start"]').click();await step(mobile,0);await mobile.locator('[data-action="tutorial-next"]').click();await step(mobile,1);await mobile.waitForTimeout(600);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 const position=await mobile.locator('.tutorial-focus').boundingBox();const coach=await mobile.locator('.tutorial-coach').boundingBox();assert.ok(position.y>=coach.y+coach.height-1&&position.y+position.height<=844,'高亮目标应滚动到提示框下方并完整可见');
 await mobile.screenshot({path:'/tmp/office-ink-shots/tutorial-mobile.png',fullPage:false});
 await mobile.locator('.hand[data-uid="tutorial-waiting"]').click();await step(mobile,2);await mobile.locator('[data-action="end"]').click();await step(mobile,3);await finishLesson(mobile);
 assert.equal((await local(mobile)).game,null);assert.equal((await local(mobile)).matches.length,0);
 await mobile.locator('[data-action="tutorial-finish"]').click();assert.ok((await mobile.locator('.opponent-card.chosen').textContent()).includes('实习小白'));await mobile.reload();await mobile.locator('.start-button').waitFor();assert.equal(await mobile.locator('[data-action="tutorial-later"]').count(),0);
 await mobile.locator('.start-button').click();await mobile.locator('.battle-layout').waitFor();assert.equal(await mobile.locator('.tutorial-coach').count(),0);assert.equal((await local(mobile)).game.mode,undefined);
 await mobile.locator('[data-action="end"]').click();for(let i=0;i<100;i++){const game=(await local(mobile)).game;if(game.active===0&&game.turn>=3)break;await mobile.waitForTimeout(150);}assert.equal((await local(mobile)).game.active,0);
 await mobile.evaluate(async()=>{const {createGame}=await import('/src/engine.js');const {saveGame}=await import('/src/storage.js');const game=createGame({seed:1221});game.players[0].hand=[{id:'boss',uid:'expensive'}];await saveGame(game);});
 await mobile.reload();await mobile.locator('[data-action="resume"]').click();assert.ok((await mobile.locator('.turn-hint').textContent()).includes('当前没有可用动作'));assert.equal(await mobile.locator('[data-action="end"]').isDisabled(),false);
 assert.deepEqual(errors,[]);await mobile.close();
 console.log('PASS 首次引导与略过、桌面和手机完整九步教学、高亮可见、错误操作、取消目标、重来、刷新续学、独立存档与战绩、正式对局保护、完成标记和正常人机开局');
}finally{await browser.close();}
