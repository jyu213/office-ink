import { CARDS, CARD_MAP, DECKS, OPPONENTS, TYPE_LABELS } from './cards.js';
import { createGame, applyAction, legalActions, chooseAIAction, validSavedGame, MAX_HEALTH } from './engine.js';
import { loadLocalData, saveSettings, saveGame } from './storage.js';
const root = document.querySelector('#app');
const ui = { screen: 'lobby', deckId: 'blame', difficulty: 'normal', sound: false, game: null, matches: [], selected: null, modal: null, type: 'all', search: '', aiBusy: false, saving: false, storage: true };
let aiTimer;
let toastTimer;
let audio;
const paths = {
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  swords: '<path d="m4 3 13 13m-3 3 6-6M3 4l1 5 5-5-6-1Zm17-1L7 16m3 3-6-6m17-9-1 5-5-5 6-1Z"/>',
  book: '<path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2V4Z"/>',
  scroll: '<path d="M7 3h12v15a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-2h11v2a3 3 0 0 0 6 0M7 3a3 3 0 0 0-3 3v3h5V6a3 3 0 0 0-2-3Zm4 5h4m-4 4h4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5.8-1.5 1.5-1.5 2.5M12 17h.01"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 5 6m0-6-5 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/>',
  flame: '<path d="M12 3c1 5 7 7 7 12a7 7 0 0 1-14 0c0-3 2-5 4-7-1 4 1 5 2 4s2-4 1-9Z"/>',
  leaf: '<path d="M20 3C6 2 1 11 7 17c5 5 14 1 13-14ZM4 21 16 9"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  back: '<path d="M19 12H5m5-5-5 5 5 5"/>',
  cup: '<path d="M5 3h14v7a7 7 0 0 1-14 0V3Zm14 2h3v3a4 4 0 0 1-4 4M5 5H2v3a4 4 0 0 0 4 4m6 5v4m-5 0h10"/>'
};
const icon = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const art = (index, extra = '') => `<div class="ink-art art-${index} ${extra}" aria-hidden="true"></div>`;
const currentDeck = () => DECKS.find(deck => deck.id === ui.deckId);
const currentOpponent = () => OPPONENTS.find(opponent => opponent.id === ui.difficulty);
const settings = () => ({ deckId: ui.deckId, difficulty: ui.difficulty, sound: ui.sound });
function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3400);
}
function tone(kind = 'play') {
  if (!ui.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    const oscillator = audio.createOscillator(); const gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = kind === 'attack' ? 180 : kind === 'end' ? 360 : 570;
    gain.gain.setValueAtTime(0.06, audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
    oscillator.connect(gain).connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + 0.2);
  } catch { /* 不支持音频时保留完整玩法。 */ }
}
function storageError() { if (ui.storage) notify('本地存档暂不可用，请勿关闭当前对局。'); ui.storage = false; }
async function persistSettings() { try { await saveSettings(settings()); } catch { storageError(); } }
function nav() {
  return `<header class="topbar"><button class="brand" data-action="route" data-screen="lobby" aria-label="你先别急，返回主页"><span class="seal">班</span><span><strong>你先别急</strong><small>职 场 水 墨 卡 牌</small></span></button><nav aria-label="主导航">${[['lobby','swords','对战'],['cards','book','藏牌阁'],['history','scroll','对局录']].map(([screen, symbol, title]) => `<button data-action="route" data-screen="${screen}" class="nav-item ${ui.screen === screen || screen === 'lobby' && ui.screen === 'battle' ? 'active' : ''}" ${ui.screen === screen ? 'aria-current="page"' : ''}>${icon(symbol, 17)}<span>${title}</span></button>`).join('')}</nav><div class="top-actions"><button class="text-button rules-button" data-action="rules">${icon('help',17)}<span>初入江湖</span></button><span class="top-divider"></span><button class="icon-button" data-action="sound" aria-label="${ui.sound ? '关闭' : '开启'}音效" aria-pressed="${ui.sound}">${icon(ui.sound ? 'sound' : 'mute',18)}</button></div></header>`;
}
function cardMarkup(card, { mode = 'collection', instance = null, action = 'inspect', selected = false, playable = false, target = false, side = null } = {}) {
  const unit = instance && 'health' in instance;
  const tags = (card.tags || []).map(tag => ({ guard: '拦截', haste: '突袭', combo: '连击' }[tag]));
  return `<button class="game-card ${mode} type-${card.type} ${selected ? 'selected' : ''} ${playable ? 'playable' : ''} ${target ? 'targetable' : ''} ${unit && !instance.ready && side === 0 ? 'exhausted' : ''}" data-action="${action}" data-card="${card.id}" ${instance ? `data-uid="${instance.uid}"` : ''} ${side !== null ? `data-side="${side}"` : ''} aria-label="${esc(card.name)}，${card.cost}精力，${unit ? `${instance.attack}压迫，${instance.health}底气，` : ''}${esc(card.text)}" ${selected ? 'aria-pressed="true"' : ''}><div class="card-inner"><span class="card-cost">${card.cost}</span><span class="card-kind">${TYPE_LABELS[card.type]}</span>${art(card.art)}<div class="card-copy"><strong class="card-name">${card.name}</strong>${mode !== 'board' ? `<p class="card-description">${card.text}</p>` : `<span class="board-keyword">${instance.frozen ? '流程暂停' : tags.join(' · ') || (instance.ready ? '可以施压' : '稍作准备')}</span>`}${tags.length && mode !== 'board' ? `<span class="card-keyword">${tags.join(' · ')}</span>` : ''}</div>${card.type === 'unit' ? `<div class="card-stats"><span class="attack-stat" title="压迫">${icon('swords',13)}${unit ? instance.attack : card.attack}</span><span class="health-stat ${unit && instance.health < instance.maxHealth ? 'hurt' : ''}" title="底气">${icon('shield',13)}${unit ? instance.health : card.health}</span></div>` : '<span class="card-ornament">✦</span>'}</div>${unit && instance.ready && side === 0 ? '<span class="ready-dot" title="可以攻击"></span>' : ''}</button>`;
}
function lobby() {
  const wins = ui.matches.filter(match => match.winner === 0).length;
  const hasSave = validSavedGame(ui.game);
  return `<main class="lobby page-enter"><section class="hero-section"><div class="hero-copy"><div class="eyebrow"><span></span>职场如江湖 · 出牌见真章</div><h1>话别说满，<br>牌要打<span class="red-word">狠</span>。</h1><p class="hero-description">一句「收到」藏锋芒，一声「对齐」起风浪。<br>把熟悉的职场话术，打成你的制胜一手。</p><div class="hero-meta"><span>${icon('swords',15)}单人人机对战</span><i></i><span>${icon('clock',15)}一局约 10 分钟</span><i></i><span>${icon('leaf',15)}无须联网</span></div><div class="hero-link"><button data-action="rules" class="underlined-button">第一次过招？看看怎么玩 ${icon('arrow',16)}</button></div></div><div class="hero-showcase" aria-label="水墨卡牌展示"><div class="ink-circle"></div><span class="vertical-note">笑里藏刀 · 纸上过招</span><div class="showcase-card showcase-left">${cardMarkup(CARD_MAP.leader, { mode: 'showcase' })}</div><div class="showcase-card showcase-right">${cardMarkup(CARD_MAP.supplement, { mode: 'showcase' })}</div><div class="showcase-card showcase-center">${cardMarkup(CARD_MAP.follow, { mode: 'showcase' })}</div><span class="showcase-seal">以和<br>为贵</span><span class="showcase-caption">山水有意，话术无情。</span></div></section><section class="setup-section"><div class="section-caption"><span class="section-index">壹</span><h2>今日，和谁过招？</h2><p>选个对手，试试你的职场生存之道。</p></div><div class="opponent-grid">${OPPONENTS.map((opponent,index) => `<button class="opponent-card ${ui.difficulty === opponent.id ? 'chosen' : ''}" data-action="opponent" data-value="${opponent.id}" aria-pressed="${ui.difficulty === opponent.id}"><span class="opponent-avatar opponent-${index}">${opponent.seal}</span><span class="opponent-info"><span class="opponent-title">${opponent.title}<span class="difficulty-dots" aria-label="${index+1}星难度">${'●'.repeat(index+1)}${'○'.repeat(2-index)}</span></span><strong>${opponent.name}</strong><small>${opponent.description}</small></span><span class="selection-mark">${ui.difficulty === opponent.id ? '✓' : ''}</span></button>`).join('')}</div><div class="battle-preparation"><div class="deck-choice"><span class="muted-label">你的套牌</span><div class="deck-tabs" role="group" aria-label="选择套牌">${DECKS.map(deck => `<button class="deck-tab ${ui.deckId === deck.id ? 'chosen' : ''}" data-action="deck" data-value="${deck.id}" aria-pressed="${ui.deckId === deck.id}">${deck.name}</button>`).join('')}</div><p>${currentDeck().description}</p></div><div class="start-actions">${hasSave ? `<button class="resume-button" data-action="resume">${icon('clock',16)}继续第 ${Math.ceil(ui.game.turn/2)} 回合</button>` : ''}<button class="primary-button start-button" data-action="start">${icon('swords',19)}开始对局${icon('arrow',20)}</button><span class="start-caption">${hasSave ? '新开对局将替换当前存档' : '20 张套牌 · 25 点心态 · 一场职场交锋'}</span></div></div></section><section class="bottom-strip"><div class="philosophy"><span class="small-seal">招</span><p>甩锅有来回，连击有章法。<small>每一句熟悉的话，都有不一样的打法。</small></p></div><div class="lobby-stat"><strong>${CARDS.length}</strong><span>张水墨卡牌</span></div><div class="lobby-stat"><strong>${ui.matches.length}</strong><span>场江湖过招</span></div><div class="lobby-stat"><strong>${ui.matches.length ? Math.round(wins/ui.matches.length*100)+'<em>%</em>' : '—'}</strong><span>你的胜率</span></div></section></main>`;
}
function heroMarkup(side, actions) {
  const player = ui.game.players[side];
  const isTarget = actions.some(action => action.target?.side === side && action.target.id === 'hero');
  const name = side === 0 ? '你 · 打工侠' : player.name;
  const active = ui.game.active === side && ui.game.status === 'playing';
  return `<div class="hero-row side-${side}"><button class="hero-identity ${isTarget ? 'targetable' : ''} ${active ? 'active-hero' : ''}" data-action="target" data-side="${side}" data-uid="hero" aria-label="${name}，心态${Math.max(0,player.health)}，护盾${player.armor}${isTarget ? '，点击选择目标' : ''}"><span class="hero-avatar">${side === 0 ? '侠' : OPPONENTS.find(item => item.id === ui.game.difficulty).seal}</span><span class="hero-identity-copy"><strong>${name}<small>${side === 0 ? DECKS.find(deck => deck.id === ui.game.deckId).name : '电脑对手'}</small></strong><span class="health-bar"><i style="width:${Math.max(0,player.health)/MAX_HEALTH*100}%"></i></span><span class="hero-vitals"><b>${Math.max(0,player.health)}</b> / ${MAX_HEALTH} 心态 ${player.armor ? `<span class="armor-counter">${icon('shield',12)}${player.armor}</span>` : ''}</span></span></button><div class="hero-resources"><span class="energy-count">${player.energy}<small> / ${player.maxEnergy}</small><em>精力</em></span><div class="energy-dots">${Array.from({length: Math.max(1,player.maxEnergy)},(_,index)=>`<i class="${index<player.energy?'filled':''}"></i>`).join('')}</div></div><div class="hero-pots">${Array.from({length:3},(_,index)=>`<span class="pot-icon ${index<player.pots?'full':''}" title="${index<player.pots?'回合结束造成2点伤害':'空锅位'}">${icon('flame',17)}</span>`).join('')}<small>${player.pots ? `${player.pots} 个待处理的锅` : '无锅一身轻'}</small></div><div class="deck-pile" title="剩余牌库"><span>牌</span><small>${player.deck.length}</small></div></div>`;
}
function selectionActions() {
  if (!ui.game || !ui.selected) return [];
  return legalActions(ui.game).filter(action => action.type === ui.selected.type && action.uid === ui.selected.uid);
}
function boardMarkup(side, actions) {
  const player = ui.game.players[side];
  return `<div class="board-row board-side-${side}">${player.board.map(unit => cardMarkup(CARD_MAP[unit.id], { mode: 'board', instance: unit, action: 'unit', selected: ui.selected?.uid === unit.uid, target: actions.some(action=>action.target?.side===side&&action.target.id===unit.uid), side })).join('')}${Array.from({length: Math.max(0,5-player.board.length)},(_,index)=>`<div class="empty-slot ${player.board.length === 0 && index === 2 ? 'slot-labeled' : ''}">${player.board.length===0&&index===2?`<span>${side===0?'打出立场，站稳脚跟':'对方尚未摆出立场'}</span>`:'<i>✦</i>'}</div>`).join('')}</div>`;
}
function battle() {
  const game = ui.game;
  const player = game.players[0];
  const opponent = game.players[1];
  const playable = legalActions(game);
  const isMyTurn = game.active === 0 && game.status === 'playing' && !ui.saving;
  const targets = selectionActions();
  const selectedCard = ui.selected?.type === 'play' ? CARD_MAP[player.hand.find(card => card.uid === ui.selected.uid)?.id] : null;
  const instruction = ui.selected ? ui.selected.type === 'attack' ? '选择一个发光的敌方目标，发起攻击。' : `「${selectedCard?.name}」：选择一个发光的目标。` : game.status === 'finished' ? '本局已结束，江湖下次再见。' : isMyTurn ? '点击手牌出牌；点击己方就绪立场，再选择攻击目标。' : '对手思考中，稍安勿躁……';
  return `<main class="battle-layout page-enter"><section class="battle-main"><div class="battle-heading"><button class="text-button" data-action="route" data-screen="lobby">${icon('back',16)}暂歇一下</button><div class="round-label"><span>第 ${Math.ceil(game.turn/2)} 回合</span><i></i>${game.status==='finished'?'对局结束':isMyTurn?'轮到你出招':'对手回合'}</div><button class="text-button mobile-log" data-action="log">${icon('scroll',16)}对局记录</button><span class="save-status">${ui.storage?(ui.saving?'存档中…':'已自动存档'):'存档不可用'}${icon('leaf',13)}</span></div><div class="battlefield"><div class="enemy-hand" aria-label="对手${opponent.hand.length}张手牌">${Array.from({length:opponent.hand.length},()=>'<span class="card-back"><i>班</i></span>').join('')}<small>手牌 ${opponent.hand.length}</small></div>${heroMarkup(1,targets)}<div class="secret-zone enemy-secrets">${opponent.secrets.map(()=>'<span title="对手埋下的未知伏笔">伏</span>').join('')}</div>${boardMarkup(1,targets)}<div class="battle-divider"><span>纸上过招</span><i>对</i><span>点到为止</span></div>${boardMarkup(0,targets)}<div class="secret-zone player-secrets">${player.secrets.map(secret=>`<button data-action="inspect" data-card="${secret.id}">伏 · ${CARD_MAP[secret.id].name}</button>`).join('')}</div>${heroMarkup(0,targets)}</div><div class="turn-controls"><div class="turn-hint ${ui.selected?'selecting':''}">${icon(ui.selected?'spark':'help',15)}<span>${instruction}</span>${ui.selected?'<button data-action="cancel">取消</button>':''}</div><div class="turn-buttons">${player.pots?`<button class="resolve-button" data-action="resolve" ${!isMyTurn||player.energy<1?'disabled':''}>${icon('flame',16)}处理一个锅 <small>1 精力</small></button>`:''}<button class="primary-button end-button" data-action="end" ${!isMyTurn?'disabled':''}>${game.status==='finished'?'对局已结束':isMyTurn?'结束回合':'对手思考中'}${icon(isMyTurn?'arrow':'clock',17)}</button></div></div><div class="hand-area"><span class="hand-label">你的手牌 <b>${player.hand.length}/8</b></span><div class="hand-scroll">${player.hand.length ? player.hand.map(instance=>cardMarkup(CARD_MAP[instance.id], { mode:'hand',instance,action:'hand',selected:ui.selected?.uid===instance.uid,playable:isMyTurn&&playable.some(action=>action.type==='play'&&action.uid===instance.uid) })).join(''):'<p class="empty-hand">手中无牌，静候下一手。</p>'}</div></div></section><aside class="battle-aside"><div class="aside-title">${icon('scroll',18)}过招实录<span>实时</span></div><div class="combat-log">${game.log.slice(-20).reverse().map(entry=>`<p class="log-entry kind-${entry.kind} ${entry.side===0?'own-log':''}"><span>${entry.side===0?'你':entry.side===1?'敌':'记'}</span>${esc(entry.text)}</p>`).join('')}</div><div class="aside-tip"><span class="small-seal">诀</span><strong>锅别留到下班</strong><p>回合结束，每个锅造成 2 点伤害。花 1 精力处理，或用话术甩回去。</p><button data-action="rules" class="underlined-button">查看全部规则 ${icon('arrow',14)}</button></div></aside></main>`;
}
function filteredCards() { return CARDS.filter(card=>(ui.type==='all'||card.type===ui.type)&&(card.name+card.text+card.flavor).includes(ui.search.trim())); }
function collectionGrid() { const cards=filteredCards(); return cards.length?cards.map(card=>cardMarkup(card)).join(''):'<div class="empty-state"><span class="empty-glyph">寻</span><h3>还没有找到这句话</h3><p>试试「锅」「连击」或「护盾」。</p></div>'; }
function collection() {
  return `<main class="collection-page page-enter"><div class="page-title"><span class="eyebrow">一言一招 · 皆有章法</span><h1>藏牌阁<span>${CARDS.length} 张已收录</span></h1><p>话术千般变化，先认清手里这张牌。</p></div><div class="collection-toolbar"><div class="filter-tabs" role="group" aria-label="卡牌类型">${[['all','全部卡牌'],['unit','立场'],['spell','话术'],['secret','伏笔']].map(([type,label])=>`<button class="${ui.type===type?'chosen':''}" data-action="filter" data-value="${type}" aria-pressed="${ui.type===type}">${label}<small>${type==='all'?CARDS.length:CARDS.filter(card=>card.type===type).length}</small></button>`).join('')}</div><label class="search-box">${icon('search',17)}<input type="search" id="card-search" placeholder="寻找一句熟悉的话…" value="${esc(ui.search)}" aria-label="搜索卡牌"></label></div><div class="collection-grid" id="collection-grid">${collectionGrid()}</div></main>`;
}
function history() {
  const wins = ui.matches.filter(match=>match.winner===0).length;
  const matches = [...ui.matches].sort((a,b)=>b.endedAt-a.endedAt);
  return `<main class="history-page page-enter"><div class="page-title"><span class="eyebrow">胜负有时 · 过招有痕</span><h1>对局录</h1><p>每一次纸上交锋，都值得记上一笔。</p></div><div class="history-stats">${[[ui.matches.length,'总对局'],[wins,'胜局'],[ui.matches.length?Math.round(wins/ui.matches.length*100)+'%':'—','胜率']].map(([value,label])=>`<div><strong>${value}</strong><span>${label}</span></div>`).join('')}</div>${matches.length?`<div class="history-list"><div class="history-list-head"><span>胜负</span><span>你的套牌</span><span>对手</span><span>回合</span><span>时间</span></div>${matches.map(match=>`<div class="history-item"><span class="result-seal ${match.winner===0?'win':'loss'}">${match.winner===0?'胜':match.winner==='draw'?'和':'负'}</span><strong>${DECKS.find(deck=>deck.id===match.deckId)?.name||'旧版套牌'}</strong><span>${OPPONENTS.find(opponent=>opponent.id===match.difficulty)?.name||'电脑'}</span><span>${match.turns} 回合</span><time datetime="${new Date(match.endedAt).toISOString()}">${new Intl.DateTimeFormat('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(match.endedAt)}</time></div>`).join('')}</div>`:`<div class="empty-state history-empty"><span class="empty-glyph">录</span><h3>江湖初见，尚无胜负</h3><p>完成第一场对局，让你的职场传说从这里开始。</p><button class="primary-button" data-action="route" data-screen="lobby">去过招 ${icon('arrow',17)}</button></div>`}</main>`;
}
function rulesContent() {
  return `<span class="eyebrow">初入江湖</span><h2 id="modal-title">三分钟，学会过招。</h2><p class="modal-lead">把对手的 25 点心态打到 0，便赢下这一局。</p><div class="rules-steps"><div><span>一</span><section><h3>精力出牌</h3><p>每回合抽 1 张牌，精力上限增加 1 并回满，最高 8 点。卡牌左上角是费用。</p></section></div><div><span>二</span><section><h3>立场交锋</h3><p>立场留在场上，通常下回合才能攻击。点击就绪立场，再点击敌方立场或对手头像。立场交锋会互相造成伤害。</p></section></div><div><span>三</span><section><h3>锅要处理</h3><p>每人最多背 3 个锅。自己的回合结束时，每个锅造成 2 点伤害后清空。花 1 精力处理一个，或用话术甩回去。</p></section></div><div><span>四</span><section><h3>看准时机</h3><p>话术立即生效；伏笔暗置，等对手触发。护盾先抵挡心态伤害。手牌最多 8 张，场上最多 5 个立场。</p></section></div></div><div class="keyword-guide"><p><b>拦截</b> 立场攻击必须优先选择它；话术可以绕过。</p><p><b>连击</b> 本回合此前打过话术牌，即可触发额外效果。</p><p><b>突袭</b> 入场当回合就能攻击任意合法目标。</p><p><b>疲劳</b> 牌库抽空后，每次抽牌依次受到 1、2、3… 点伤害。</p></div><p class="local-note">${icon('leaf',15)}进度和战绩仅保存在当前浏览器，不同设备和网址不互通。</p><button class="primary-button modal-main-button" data-action="close">心中有数，准备过招 ${icon('arrow',17)}</button>`;
}
function modal() {
  if (!ui.modal) return '';
  let content;
  if (ui.modal.type === 'rules') content=rulesContent();
  if (ui.modal.type === 'inspect') {
    const card=CARD_MAP[ui.modal.card];
    content=`<div class="card-detail">${cardMarkup(card,{mode:'detail',action:'noop'})}<div><span class="eyebrow">藏牌阁 · ${TYPE_LABELS[card.type]}</span><h2 id="modal-title">${card.name}</h2><p class="detail-effect">${card.text}</p><blockquote>“${card.flavor}”</blockquote><p class="muted-label">${card.type==='unit'?`${card.attack} 压迫 · ${card.health} 底气`:`${card.cost} 点精力 · ${TYPE_LABELS[card.type]}`}</p></div></div>`;
  }
  if (ui.modal.type === 'replace') content=`<span class="eyebrow">另起一局</span><h2 id="modal-title">这一局，还没分出胜负。</h2><p class="modal-lead">新开对局会将当前对局记为落败，并替换存档。也可以继续刚才的交锋。</p><div class="dialog-actions"><button class="secondary-button" data-action="resume">继续当前对局</button><button class="primary-button" data-action="force-start">重新开局</button></div>`;
  if (ui.modal.type === 'result') {
    const won=ui.game.winner===0;const draw=ui.game.winner==='draw';
    content=`<div class="result-content"><span class="big-result-seal ${won?'won':''}">${draw?'和':won?'胜':'负'}</span><span class="eyebrow">${Math.ceil(ui.game.turn/2)} 回合 · ${DECKS.find(deck=>deck.id===ui.game.deckId).name}</span><h2 id="modal-title">${draw?'不分伯仲，改日再战。':won?'这场交锋，你拿捏了。':'胜败常事，下班再战。'}</h2><p>${draw?'两边的心态都归了零，这份默契也是难得。':won?'话留三分，牌尽全力。今天的锅，终于没有落在你头上。':'锅可以再甩，牌可以重来。下一局，试试不一样的打法。'}</p><div class="dialog-actions"><button class="secondary-button" data-action="result-lobby">回到江湖</button><button class="primary-button" data-action="again">再过一招 ${icon('arrow',17)}</button></div><small>${ui.storage?'本局战绩已保存于当前浏览器':'本局未能保存，请检查浏览器存储权限'}</small></div>`;
  }
  if (ui.modal.type === 'log') content=`<h2 id="modal-title">过招实录</h2><div class="modal-log">${ui.game.log.slice().reverse().map(entry=>`<p>${esc(entry.text)}</p>`).join('')}</div>`;
  return `<div class="modal-backdrop" data-action="backdrop"><section class="modal ${ui.modal.type==='inspect'?'inspect-modal':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><button class="modal-close icon-button" data-action="close" aria-label="关闭弹窗">${icon('close',21)}</button>${content}</section></div>`;
}
function render() {
  root.innerHTML=nav()+(ui.screen==='battle'&&ui.game?battle():ui.screen==='cards'?collection():ui.screen==='history'?history():lobby())+`<footer class="site-footer"><span>你先别急 <i>·</i> 职场如江湖</span><span>${ui.storage?'落笔即存档':'本地存储不可用'} <i>·</i> 纯粹过招，不必氪金</span></footer>`+modal();
  document.body.classList.toggle('in-battle',ui.screen==='battle');
  document.body.classList.toggle('modal-open',!!ui.modal);
  if (ui.modal) document.querySelector('.modal')?.focus({preventScroll:true});
}
function showModal(value) { ui.modal=value; render(); }
function route(screen) {
  clearTimeout(aiTimer);ui.aiBusy=false;ui.selected=null;ui.modal=null;ui.screen=screen;render();window.scrollTo({top:0,behavior:'instant'});
}
function refreshMatch(game) {
  const record={id:game.id,startedAt:game.startedAt,endedAt:Date.now(),deckId:game.deckId,difficulty:game.difficulty,winner:game.winner,turns:Math.ceil(game.turn/2)};
  ui.matches=ui.matches.filter(match=>match.id!==game.id).concat(record);
}
async function commit(action) {
  if (ui.saving || !ui.game || ui.game.status!=='playing') return;
  ui.saving=true;ui.selected=null;
  try {
    ui.game=applyAction(ui.game,action);tone(action.type);render();
    try { await saveGame(ui.game); } catch { storageError(); }
    if (ui.game.status==='finished') {refreshMatch(ui.game);ui.modal={type:'result'};}
    document.querySelector('#announcer').textContent=ui.game.log.at(-1)?.text||'';
  } catch(error) { notify(error.message); }
  finally {ui.saving=false;render();queueAI();}
}
function queueAI() {
  clearTimeout(aiTimer);
  if (ui.screen!=='battle'||ui.game?.status!=='playing'||ui.game.active!==1) {ui.aiBusy=false;return;}
  ui.aiBusy=true;
  const id=ui.game.id;
  aiTimer=setTimeout(()=>{
    if (ui.screen!=='battle'||ui.game?.id!==id||ui.game.active!==1) return;
    try { const action=chooseAIAction(ui.game);void commit(action); }
    catch { notify('对手重新整理了一下思路。');void commit({type:'end'}); }
  },ui.difficulty==='hard'?800:600);
}
async function begin(force=false) {
  if (ui.saving) return;
  if (validSavedGame(ui.game)&&!force) {showModal({type:'replace'});return;}
  clearTimeout(aiTimer);ui.saving=true;
  if (validSavedGame(ui.game)&&force) {
    const abandoned={...ui.game,status:'finished',winner:1};
    try {await saveGame(abandoned);refreshMatch(abandoned);} catch {storageError();}
  }
  ui.game=createGame({deckId:ui.deckId,difficulty:ui.difficulty});ui.screen='battle';ui.selected=null;ui.modal=null;
  try {await saveGame(ui.game);} catch {storageError();}
  ui.saving=false;render();window.scrollTo({top:0,behavior:'instant'});tone();
}
function pickHand(uid) {
  if (ui.game.active!==0||ui.game.status!=='playing'||ui.saving) return;
  const instance=ui.game.players[0].hand.find(card=>card.uid===uid);
  const options=legalActions(ui.game).filter(action=>action.type==='play'&&action.uid===uid);
  if (!options.length) { const card=CARD_MAP[instance.id];notify(card.cost>ui.game.players[0].energy?'精力不够，先看看别的牌。':card.effect==='transfer'?'身上没有锅，暂时不用甩。':card.type==='unit'?'场上最多只能有 5 个立场。':'当前没有合适的目标，或已有相同伏笔。');return; }
  if (!options[0].target) {void commit(options[0]);return;}
  ui.selected=ui.selected?.uid===uid?null:{type:'play',uid};render();
}
function target(side,uid) {
  if (!ui.selected) {if (side===1&&uid==='hero') notify('先选一张话术或就绪的己方立场。');return;}
  const action=selectionActions().find(action=>action.target?.side===side&&action.target.id===uid);
  if (action) void commit(action);else notify('请选择发光的目标；有拦截时，立场必须先攻击拦截。');
}
root.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
  const action=button.dataset.action;
  switch(action) {
    case 'route':route(button.dataset.screen);break;
    case 'rules':showModal({type:'rules'});break;
    case 'sound':ui.sound=!ui.sound;void persistSettings();tone();render();notify(ui.sound?'音效已开启':'音效已关闭');break;
    case 'opponent':ui.difficulty=button.dataset.value;void persistSettings();render();break;
    case 'deck':ui.deckId=button.dataset.value;void persistSettings();render();break;
    case 'start':void begin();break;
    case 'force-start':void begin(true);break;
    case 'again':ui.deckId=ui.game.deckId;ui.difficulty=ui.game.difficulty;void begin(true);break;
    case 'resume':if(validSavedGame(ui.game)){ui.screen='battle';ui.modal=null;ui.difficulty=ui.game.difficulty;ui.deckId=ui.game.deckId;render();queueAI();}break;
    case 'close':ui.modal=null;render();break;
    case 'backdrop':if(event.target===button){ui.modal=null;render();}break;
    case 'inspect':showModal({type:'inspect',card:button.dataset.card});break;
    case 'filter':ui.type=button.dataset.value;render();break;
    case 'hand':pickHand(button.dataset.uid);break;
    case 'unit':{
      const side=Number(button.dataset.side);const uid=button.dataset.uid;
      if(ui.selected&&selectionActions().some(action=>action.target?.side===side&&action.target.id===uid)){target(side,uid);break;}
      if(side===0&&ui.game.active===0&&ui.game.status==='playing'&&!ui.saving){
        const available=legalActions(ui.game).some(action=>action.type==='attack'&&action.uid===uid);
        if(available){ui.selected=ui.selected?.uid===uid?null:{type:'attack',uid};render();}
        else notify('此立场还不能攻击：可能刚入场、已行动，或正在走流程。');
      }else if(!ui.selected)showModal({type:'inspect',card:button.dataset.card});else target(side,uid);
      break;
    }
    case 'target':target(Number(button.dataset.side),button.dataset.uid);break;
    case 'cancel':ui.selected=null;render();break;
    case 'end':if(ui.game?.active===0)void commit({type:'end'});break;
    case 'resolve':if(ui.game?.active===0)void commit({type:'resolve'});break;
    case 'result-lobby':route('lobby');break;
    case 'log':showModal({type:'log'});break;
  }
});
root.addEventListener('input',event=>{if(event.target.id==='card-search'){ui.search=event.target.value;document.querySelector('#collection-grid').innerHTML=collectionGrid();}});
root.addEventListener('contextmenu',event=>{const card=event.target.closest('[data-card]');if(card){event.preventDefault();showModal({type:'inspect',card:card.dataset.card});}});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){ui.modal=null;ui.selected=null;render();}
  if(event.key==='Tab'&&ui.modal){
    const focusable=[...document.querySelectorAll('.modal button:not(:disabled), .modal input, .modal [tabindex="0"]')];
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&(document.activeElement===first||document.activeElement.classList.contains('modal'))){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
});
try {
  const data=await loadLocalData();
  if(DECKS.some(deck=>deck.id===data.settings.deckId))ui.deckId=data.settings.deckId;
  if(OPPONENTS.some(opponent=>opponent.id===data.settings.difficulty))ui.difficulty=data.settings.difficulty;
  ui.sound=!!data.settings.sound;ui.matches=data.matches;
  ui.game=validSavedGame(data.game)?data.game:null;
} catch {storageError();}
render();
