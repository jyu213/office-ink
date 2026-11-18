import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' })
});
const failures = [];
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5178';

async function measure(page, label, action, { scroll = false } = {}) {
  await page.evaluate(() => {
    window.renderFrames = [];
    const until = performance.now() + 450;
    function frame() {
      const main = document.querySelector('.battle-layout');
      const anchor = document.querySelector('.hero-row.side-1');
      const hand = document.querySelector('.hand-scroll');
      const handArea = document.querySelector('.hand-area');
      window.renderFrames.push({
        opacity: Number(getComputedStyle(main).opacity),
        anchorY: anchor.getBoundingClientRect().top + scrollY,
        handY: handArea.getBoundingClientRect().top + scrollY,
        handScroll: hand.scrollLeft,
        pageScroll: scrollY
      });
      if (performance.now() < until) requestAnimationFrame(frame);
    }
    frame();
  });
  await action();
  await page.waitForTimeout(500);
  const frames = await page.evaluate(() => window.renderFrames);
  const spread = field => Math.max(...frames.map(frame => frame[field])) - Math.min(...frames.map(frame => frame[field]));
  const result = { opacity: Math.min(...frames.map(frame => frame.opacity)), battlefield: spread('anchorY'), hand: spread('handY'), scroll: spread('handScroll'), viewport: spread('pageScroll') };
  try {
    assert.ok(result.opacity >= .99, '整个战场重新淡入');
    assert.ok(result.battlefield <= .5, `战场位移 ${result.battlefield}px`);
    assert.ok(result.hand <= .5, `手牌区域位移 ${result.hand}px`);
    if (scroll) {
      assert.ok(result.scroll <= 1, `手牌滚动位置变化 ${result.scroll}px`);
      assert.ok(result.viewport <= 1, `页面滚动位置变化 ${result.viewport}px`);
    }
    console.log(`PASS ${label}`);
  } catch (error) {
    failures.push(`${label}: ${error.message} ${JSON.stringify(result)}`);
    console.error(`FAIL ${failures.at(-1)}`);
  }
}

try {
  for (const viewport of [{ width: 1280, height: 1000 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseURL);
    await page.locator('.start-button').waitFor();
    await page.evaluate(async () => {
      const { createGame } = await import('/src/engine.js');
      const { saveGame } = await import('/src/storage.js');
      const game = createGame({ seed: 777 });
      const player = game.players[0];
      player.energy = player.maxEnergy = 8;
      player.board = [{ id: 'waiting', uid: 'ready-unit', attack: 2, health: 3, maxHealth: 3, ready: true, frozen: 0 }];
      player.hand = Array.from({ length: 8 }, (_, index) => ({ id: index === 0 ? 'intern' : 'supplement', uid: `hand-${index}` }));
      game.players[1].board = [{ id: 'leader', uid: 'guard-unit', attack: 1, health: 5, maxHealth: 5, ready: false, frozen: 0 }];
      await saveGame(game);
    });
    await page.reload();
    await page.locator('[data-action="resume"]').click();
    await page.waitForTimeout(400);
    const prefix = `${viewport.width}px`;
    await measure(page, `${prefix} 选中立场`, () => page.locator('.board[data-uid="ready-unit"]').click());
    await measure(page, `${prefix} 取消选择`, () => page.keyboard.press('Escape'));
    await page.evaluate(() => {
      const hand = document.querySelector('.hand-scroll');
      hand.scrollLeft = hand.scrollWidth;
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.locator('.hand[data-uid="hand-6"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await measure(page, `${prefix} 滚动后选中话术`, () => page.locator('.hand[data-uid="hand-6"]').click(), { scroll: true });
    await measure(page, `${prefix} 滚动后取消话术`, () => page.keyboard.press('Escape'), { scroll: true });
    await page.locator('.hand[data-uid="hand-0"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.evaluate(() => { window.retainedCard = document.querySelector('.hand[data-uid="hand-2"]'); });
    await measure(page, `${prefix} 出牌和自动存档`, () => page.locator('.hand[data-uid="hand-0"]').click());
    try {
      assert.equal(await page.evaluate(() => window.retainedCard === document.querySelector('.hand[data-uid="hand-2"]')), true, '出牌不应重建其他手牌');
    } catch (error) { failures.push(`${prefix}: ${error.message}`); }
    if (viewport.width > 650) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await measure(page, `${prefix} 打开规则`, () => page.locator('.rules-button').click());
      await measure(page, `${prefix} 关闭规则`, () => page.keyboard.press('Escape'));
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
assert.deepEqual(failures, [], '渲染交互回归失败');
