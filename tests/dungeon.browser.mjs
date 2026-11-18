import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' })
});
const origin = process.env.BASE_URL || 'http://127.0.0.1:5178';
const page = await browser.newPage({ viewport: { width: 1280, height: 950 }, reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const data = () => page.evaluate(async () => {
  const { loadLocalData } = await import('/src/storage.js');
  return loadLocalData();
});
const openMap = () => page.locator('.nav-item[data-screen="dungeon"]').click();
const continueRun = () => page.locator('[data-action="dungeon-continue"]').click();

async function resumeWithFixture(remainingHealth, { defeat = false } = {}) {
  await page.evaluate(async ({ remainingHealth, defeat }) => {
    const { loadLocalData, saveDungeon } = await import('/src/storage.js');
    const { dungeon } = await loadLocalData();
    const [player, opponent] = dungeon.game.players;
    player.health = remainingHealth;
    if (defeat) {
      dungeon.game.turn = 5;
      player.armor = 0;
    } else {
      player.energy = 3;
      player.hand = [{ id: 'minutes', uid: 'dungeon-finisher' }];
      opponent.health = 2;
      opponent.armor = 0;
    }
    await saveDungeon(dungeon);
  }, { remainingHealth, defeat });
  await page.reload();
  await openMap();
  await continueRun();
}

async function winStage() {
  await page.locator('.hand[data-uid="dungeon-finisher"]').click();
  await page.locator('.hero-identity[data-side="1"]').click();
  await page.locator('.dungeon-page').waitFor();
}

try {
  await page.goto(origin);
  const later = page.locator('[data-action="tutorial-later"]');
  await later.click();
  const normal = await page.evaluate(async () => {
    const { createGame } = await import('/src/engine.js');
    const { saveGame } = await import('/src/storage.js');
    const game = createGame({ deckId: 'shield', seed: 3000 });
    await saveGame(game);
    return game;
  });
  await page.reload();
  await page.locator('.dungeon-entry').click();
  assert.equal(await page.locator('.dungeon-route li').count(), 3);
  assert.equal(await page.locator('.dungeon-deck-tabs .deck-tab').count(), 6);
  await page.locator('.dungeon-deck-tabs [data-value="growth"]').click();
  await page.locator('[data-action="dungeon-start"]').click();
  await page.locator('.dungeon-battle-banner').waitFor();
  await page.waitForFunction(async () => {
    const { loadLocalData } = await import('/src/storage.js');
    return (await loadLocalData()).dungeon?.status === 'playing';
  });
  const first = (await data()).dungeon;
  assert.equal(first.deckId, 'growth');
  assert.equal(first.stageIndex, 0);
  assert.match(await page.locator('.side-1 .hero-vitals').textContent(), /15\s*\/\s*15/);
  assert.ok(await page.locator('.battle-assist').isVisible());
  await page.locator('.battle-heading [data-screen="dungeon"]').click();
  await page.locator('[data-action="dungeon-start"]').click();
  await page.getByRole('button', { name: '保留进度' }).click();
  assert.equal((await data()).dungeon.id, first.id);

  await page.setViewportSize({ width: 360, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await resumeWithFixture(12);
  assert.equal((await data()).dungeon.game.id, first.game.id);
  await winStage();
  assert.match(await page.locator('.dungeon-checkpoint').textContent(), /21 \/ 25/);
  assert.match(await page.locator('.dungeon-node.current').textContent(), /可挑战/);
  await continueRun();
  await page.locator('.dungeon-battle-banner').waitFor();
  assert.match(await page.locator('.dungeon-battle-banner').textContent(), /跨部门评审/);
  await page.waitForFunction(async () => {
    const { loadLocalData } = await import('/src/storage.js');
    return (await loadLocalData()).dungeon?.stageIndex === 1;
  });
  await resumeWithFixture(5);
  await winStage();
  await continueRun();
  await page.locator('.boss-banner').waitFor();
  assert.match(await page.locator('.boss-banner').textContent(), /第 3 回合/);
  assert.match(await page.locator('.side-1 .hero-vitals').textContent(), /24\s*\/\s*24/);
  await page.waitForFunction(async () => {
    const { loadLocalData } = await import('/src/storage.js');
    return (await loadLocalData()).dungeon?.stageIndex === 2;
  });
  await resumeWithFixture(1, { defeat: true });
  await page.locator('[data-action="end"]').click();
  await page.locator('.dungeon-page').waitFor();
  assert.match(await page.locator('[data-action="dungeon-continue"]').textContent(), /重试本关/);
  assert.equal(await page.locator('.dungeon-node.cleared').count(), 2);
  await continueRun();
  await page.locator('.boss-banner').waitFor();
  assert.match(await page.locator('.side-0 .hero-vitals').textContent(), /21\s*\/\s*25/);
  await page.waitForFunction(async () => {
    const { loadLocalData } = await import('/src/storage.js');
    return (await loadLocalData()).dungeon?.status === 'playing';
  });
  await resumeWithFixture(21);
  await winStage();
  await page.reload();
  await openMap();
  assert.match(await page.locator('.dungeon-victory').textContent(), /副本通关/);
  assert.equal(await page.locator('.dungeon-node.cleared').count(), 3);
  assert.deepEqual((await data()).game, normal);
  assert.deepEqual((await data()).matches, []);
  await page.locator('.nav-item[data-screen="lobby"]').click();
  await page.locator('[data-action="resume"]').click();
  assert.equal(await page.locator('.dungeon-battle-banner').count(), 0);
  assert.match(await page.locator('.side-0 .hero-identity-copy').textContent(), /带薪摸鱼/);
  assert.deepEqual(errors, []);
  console.log('PASS 六套牌入口、三关推进、Boss 落败重试与通关、手机布局、刷新恢复、正式对局与战绩独立');
} finally {
  await browser.close();
}
