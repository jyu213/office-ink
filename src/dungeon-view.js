import { DECKS } from './cards.js';
import { BOSS_PRESSURE, DUNGEON_STAGES, dungeonRecovery } from './dungeon.js';
import { MAX_HEALTH } from './engine.js';

const stageAction = {
  playing: '继续当前关',
  between: '挑战下一关',
  failed: '重试本关'
};

function routeMarkup(run, art, icon) {
  return DUNGEON_STAGES.map((stage, index) => {
    const cleared = run && (index < run.stageIndex || index === run.stageIndex && ['between', 'cleared'].includes(run.status));
    const currentIndex = run ? run.stageIndex + Number(run.status === 'between') : 0;
    const current = index === currentIndex && !cleared;
    let label = '未解锁';
    if (cleared) label = '已击败';
    else if (current) label = { failed: '可重试', between: '可挑战', playing: '当前关卡' }[run?.status] ?? '首关';
    return `<li class="dungeon-node ${cleared ? 'cleared' : ''} ${current ? 'current' : ''} ${stage.boss ? 'boss-node' : ''}" ${current ? 'aria-current="step"' : ''}>
      <div class="dungeon-art">${art(stage.art)}<span class="dungeon-seal">${stage.seal}</span></div>
      <div class="dungeon-node-copy">
        <span class="stage-state">${stage.boss ? '最终 Boss' : `第 ${index + 1} 关`} <b>${label}</b></span>
        <h2>${stage.name}</h2>
        <p class="stage-opponent">${stage.opponent} <span>${stage.health} 点心态</span></p>
        <p>${stage.tip}</p>
      </div>
      ${index < DUNGEON_STAGES.length - 1 ? `<span class="dungeon-path" aria-hidden="true">${icon('arrow', 17)}</span>` : ''}
    </li>`;
  }).join('');
}

function runSummary(run, saving, icon) {
  const stage = DUNGEON_STAGES[run.stageIndex];
  const deck = DECKS.find(item => item.id === run.deckId);
  const health = run.game.players[0].health;
  const summaries = {
    playing: [`正在挑战「${stage.name}」`, `${deck.name} · 当前 ${health} / ${MAX_HEALTH} 点心态`],
    between: [`已通过「${stage.name}」`, `休整后以 ${dungeonRecovery(health)} / ${MAX_HEALTH} 点心态进入「${DUNGEON_STAGES[run.stageIndex + 1]?.name}」。`],
    failed: [run.game.winner === 'draw' ? '这一关打成了平局' : `在「${stage.name}」落败`, `可用「${deck.name}」以 ${run.stageHealth} 点心态重试，之前通过的关卡会保留。`],
    cleared: ['副本通关，考核总监已被击败', `「${deck.name}」连过 ${DUNGEON_STAGES.length} 关，最终剩余 ${health} 点心态。`]
  };
  const [title, message] = summaries[run.status];
  return `<section class="dungeon-checkpoint ${run.status === 'cleared' ? 'dungeon-victory' : ''}" aria-label="副本进度">
    <div><h2>${title}</h2><p>${message}</p></div>
    ${run.status === 'cleared' ? '' : `<button class="primary-button" data-action="dungeon-continue" ${saving ? 'disabled' : ''}>${stageAction[run.status]} ${icon('arrow', 17)}</button>`}
  </section>`;
}

export function dungeonPage(run, deckId, saving, icon, art) {
  const deck = DECKS.find(item => item.id === deckId);
  const hasUnfinishedRun = run && run.status !== 'cleared';
  return `<main data-key="dungeon-page" class="dungeon-page page-enter">
    <header class="dungeon-header"><h1>下班之前</h1><p>用一套预设卡组连过三关，击败最终 Boss 考核总监。</p></header>
    ${run ? runSummary(run, saving, icon) : ''}
    <ol class="dungeon-route" aria-label="副本关卡路线">${routeMarkup(run, art, icon)}</ol>
    <section class="dungeon-deck-panel" aria-labelledby="dungeon-deck-title">
      <h2 id="dungeon-deck-title">${hasUnfinishedRun ? '更换卡组，重开副本' : '选择本次挑战的卡组'}</h2>
      <p>卡组贯穿整条路线。每场胜利后休整，恢复 8 点心态，至少补到 21 点，最高 25 点。</p>
      <div class="deck-tabs dungeon-deck-tabs" role="group" aria-label="副本预设卡组">${DECKS.map(item => `<button class="deck-tab ${item.id === deckId ? 'chosen' : ''}" data-action="dungeon-deck" data-value="${item.id}" aria-pressed="${item.id === deckId}">${item.name}<small>${item.style}</small></button>`).join('')}</div>
      <div class="dungeon-start"><p>${deck.description}</p><button class="primary-button" data-action="dungeon-start" ${saving ? 'disabled' : ''}>${hasUnfinishedRun ? '重开副本' : run ? '再次挑战' : '挑战第一关'} ${icon('arrow', 17)}</button></div>
    </section>
  </main>`;
}

export function dungeonBattleBanner(run) {
  const stage = DUNGEON_STAGES[run.stageIndex];
  const { every, damage, name } = BOSS_PRESSURE;
  const bossTurns = Math.floor(run.game.turn / 2);
  const next = (Math.floor(bossTurns / every) + 1) * every;
  const note = stage.boss ? `总监第 ${next} 回合开始时发动「${name}」，对你造成 ${damage} 点伤害。` : stage.tip;
  return `<aside class="dungeon-battle-banner ${stage.boss ? 'boss-banner' : ''}" aria-label="副本关卡提示"><strong>${stage.boss ? '最终 Boss' : `第 ${run.stageIndex + 1} / ${DUNGEON_STAGES.length} 关`} · ${stage.name}</strong><p>${note}</p></aside>`;
}
