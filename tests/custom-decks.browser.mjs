import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel:'chrome' })
});
const base = process.env.BASE_URL || 'http://127.0.0.1:5178/';
const read = page => page.evaluate(async () => {
  const { loadLocalData } = await import(new URL('src/storage.js', location.href));
  return loadLocalData();
});

try {
  for (const width of [1280, 320]) {
    const page = await browser.newPage({viewport:{width,height:850},isMobile:width<650,hasTouch:width<650,reducedMotion:'reduce'});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const click = selector => width<650 ? page.locator(selector).tap() : page.locator(selector).click();
    const assertWidth = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const name = '异步 <开会> & 复盘';
    await page.goto(base);
    await click('[data-action="tutorial-later"]');
    await click('[data-action="builder-new"]');
    await assertWidth();
    await page.locator('#builder-name').fill(name);
    await page.locator('#builder-search').fill('已同步');
    await click('[data-action="builder-add"][data-card="ack"]');
    await click('[data-action="builder-add"][data-card="ack"]');
    assert.ok(await page.locator('[data-action="builder-add"][data-card="ack"]').isDisabled());
    await click('[data-action="builder-save"]');
    await page.locator('#custom-deck').waitFor();
    assert.ok(await page.locator('.start-button').isDisabled());
    assert.match(await page.locator('.start-caption').textContent(), /还差 18 张/);
    await page.reload();
    assert.equal((await read(page)).customDecks.find(deck => deck.name===name).cards.length, 2);

    await click('[data-action="builder-edit"]');
    assert.equal(await page.locator('#builder-name').inputValue(), name);
    await click('[data-action="builder-view"]');
    assert.equal(await page.locator('.builder-card').count(), 1);
    await click('[data-action="builder-remove"][data-card="ack"]');
    await click('[data-action="builder-remove"][data-card="ack"]');
    await page.locator('#builder-power').selectOption('shield');
    await click('[data-action="builder-fill"]');
    await click('[data-action="builder-remove"][data-card="ack"]');
    await click('[data-action="builder-view"]');
    await page.locator('#builder-search').fill('我补充');
    await click('[data-action="builder-add"][data-card="supplement"]');
    assert.match(await page.locator('.builder-count').textContent(), /20 \/ 20/);
    assert.ok(await page.locator('[data-action="builder-add"][data-card="supplement"]').isDisabled());
    await click('[data-action="builder-save"]');
    await page.locator('#custom-deck').waitFor();
    await assertWidth();
    await click('[data-action="deck-details"]');
    assert.equal(await page.locator('#modal-title').textContent(), name);
    assert.equal(await page.locator('.deck-card-list [data-card="supplement"] small').textContent(), '话术 ×1');
    await click('.modal-close');
    await click('.start-button');
    await page.locator('.battle-layout').waitFor();
    const { game } = await read(page);
    assert.equal(game.customDeck.name, name);
    assert.equal(game.players[0].deckId, 'shield');
    assert.equal(await page.locator('.ability-button strong').textContent(), '带薪续航每回合一次');
    assert.deepEqual([...game.players[0].deck, ...game.players[0].hand.map(card=>card.id)].sort(), [...game.customDeck.cards].sort());

    await click('.battle-heading [data-screen="lobby"]');
    await click('[data-action="builder-new"]');
    await page.locator('#builder-name').fill('第二套');
    await click('[data-action="builder-save"]');
    await page.locator('#custom-deck').waitFor();
    assert.equal((await read(page)).customDecks.length, 2);
    await page.locator('#custom-deck').selectOption(game.customDeck.id);
    await click('[data-action="builder-edit"]');
    await page.locator('#builder-name').fill('未保存的改名');
    await click('.builder-header [data-action="route"]');
    await click('[data-action="builder-discard"]');
    await click('[data-action="builder-edit"]');
    assert.equal(await page.locator('#builder-name').inputValue(), name);
    await click('[data-action="builder-confirm-delete"]');
    await click('[data-action="builder-delete"]');
    await page.locator('#custom-deck').waitFor();
    assert.equal((await read(page)).customDecks.length, 1);
    await page.reload();
    await click('[data-action="resume"]');
    await page.locator('.battle-layout').waitFor();
    assert.deepEqual((await read(page)).game.customDeck, game.customDeck);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`PASS ${width}px 自组套牌、草稿、上限、套牌技能、刷新、对局快照、删除与续战`);
  }
} finally {
  await browser.close();
}
