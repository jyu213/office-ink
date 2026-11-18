import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel:'chrome' })
});
const base = process.env.BASE_URL || 'http://127.0.0.1:5178/';

try {
  for (const width of [320, 1280]) {
    const page = await browser.newPage({viewport:{width,height:844},isMobile:width<650,hasTouch:width<650,reducedMotion:'reduce'});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const click = selector => width<650 ? page.locator(selector).tap() : page.locator(selector).click();
    const hand = id => `.hand[data-card="${id}"]`;
    const badge = id => page.locator(`${hand(id)} .card-effect`);
    const value = id => badge(id).locator('span').textContent();
    const state = id => badge(id).getAttribute('data-effect-state');
    const checkLayout = () => page.evaluate(() => [...document.querySelectorAll('.card-effect')].flatMap(badge => {
      const card = badge.closest('.game-card');
      const inner = badge.closest('.card-inner');
      const overflows = badge.scrollWidth > badge.clientWidth + 1 || inner.scrollHeight > inner.clientHeight + 1;
      const small = parseFloat(getComputedStyle(badge).fontSize) < 12;
      return overflows || small ? [card.dataset.card] : [];
    }));
    await page.goto(base);
    await click('[data-action="tutorial-later"]');
    await click('.nav-item[data-screen="cards"]');
    assert.equal(await page.locator('.collection[data-card="supplement"] [data-effect="combo"]').getAttribute('data-effect-state'),'reference');
    assert.deepEqual(await checkLayout(), []);
    await page.evaluate(async base => {
      const { createGame } = await import(new URL('src/engine.js', base));
      const { saveGame } = await import(new URL('src/storage.js', base));
      const game = createGame({deckId:'combo',opponentDeckId:'blame',seed:17});
      const [player, opponent] = game.players;
      player.energy = player.maxEnergy = 8;
      player.hand = ['overtime','supplement','finalword','minutes','armorStrike','guardGain','escalate','notmine'].map(id=>({id,uid:`test-${id}`}));
      player.board = [{id:'leader',uid:'guard',health:5,maxHealth:5,attack:1,ready:true,frozen:0,silenced:false}];
      player.deck = ['intern','waiting','leader'];
      opponent.hand = [];
      opponent.deck = ['boss','boss'];
      opponent.board = [];
      await saveGame(game);
    }, base);
    await page.reload();
    await click('[data-action="resume"]');
    assert.equal(await state('supplement'),'waiting');
    assert.equal(await value('supplement'),'2 伤害');
    assert.equal(await value('finalword'),'1 伤害');
    assert.equal(await value('armorStrike'),'缺护盾');
    assert.equal(await value('guardGain'),'+1 张牌');
    assert.equal(await badge('supplement').evaluate(el=>getComputedStyle(el).borderTopStyle),'dashed');
    assert.deepEqual(await checkLayout(), []);

    await click(hand('overtime'));
    assert.equal(await value('supplement'),'2→4 伤害');
    assert.equal(await value('finalword'),'1→2 伤害');
    assert.equal(await badge('supplement').evaluate(el=>getComputedStyle(el).borderTopStyle),'solid');
    await click('[data-action="power"]');
    assert.equal(await page.locator(`${hand('supplement')} .card-cost-original`).textContent(),'2');
    assert.equal(await state('supplement'),'ready');

    await click(hand('notmine'));
    assert.equal(await page.locator(`${hand('supplement')} .card-cost-original`).count(),0);
    assert.equal(await value('finalword'),'1→3 伤害');
    assert.equal(await value('minutes'),'3→5 伤害');
    assert.equal(await value('escalate'),'2→5 伤害');
    await click(hand('guardGain'));
    assert.equal(await value('armorStrike'),'4 伤害');
    assert.equal(await value('finalword'),'1→4 伤害');
    assert.deepEqual(await checkLayout(), []);

    await click(hand('supplement'));
    await click('.hero-identity[data-side="1"]');
    assert.equal(await page.locator('.hero-row.side-1 .hero-vitals b').textContent(),'21');
    assert.equal(await value('finalword'),'1→4 伤害');
    await click('[data-action="end"]');
    assert.equal(await state('finalword'),'reference');
    await page.locator('.round-label').filter({hasText:'轮到你出招'}).waitFor();
    assert.equal(await state('finalword'),'waiting');
    assert.equal(await value('finalword'),'1 伤害');
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS ${width}px 连击、挂锅、护盾、减费、实战伤害与跨回合刷新`);
  }
} finally {
  await browser.close();
}
