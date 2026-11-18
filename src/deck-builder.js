import { CARDS, DECKS, TYPE_LABELS } from './cards.js';
import { CARD_COPY_LIMIT, CUSTOM_DECK_SIZE, DECK_NAME_LIMIT, countCards } from './custom-decks.js';

const catalog = [...CARDS].sort((a, b) => a.cost - b.cost);

export function deckBuilder(draft, filters, { editing, saving, icon, esc }) {
  const counts = countCards(draft.cards);
  const filled = draft.cards.length;
  const power = DECKS.find(deck => deck.id === draft.baseDeckId).power;
  const query = filters.search.trim();
  const rows = catalog.filter(card => (!filters.owned || counts.has(card.id)) &&
    (!filters.type || card.type === filters.type) && (card.name + card.text).includes(query));
  return `<main class="deck-builder page-enter" data-key="deck-builder">
    <header class="builder-header">
      <button class="text-button" data-action="route" data-screen="lobby">${icon('back',16)}返回对战</button>
      <h1>${editing ? '编辑自组套牌' : '新建自组套牌'}</h1>
    </header>
    <div class="builder-config">
      <label>套牌名称<input id="builder-name" maxlength="${DECK_NAME_LIMIT}" value="${esc(draft.name)}" autocomplete="off" ${saving?'disabled':''}></label>
      <label>流派技能<select id="builder-power" ${saving?'disabled':''}>${DECKS.map(deck=>`<option value="${deck.id}" ${deck.id===draft.baseDeckId?'selected':''}>${deck.name} · ${deck.power.name}</option>`).join('')}</select></label>
      <p>${power.cost} 精力 · ${power.text}</p>
    </div>
    <div class="builder-summary">
      <div class="builder-count" role="status"><b>${filled} / ${CUSTOM_DECK_SIZE}</b><span>${filled === CUSTOM_DECK_SIZE ? '可以开局' : `还差 ${CUSTOM_DECK_SIZE - filled} 张`}</span></div>
      <button class="primary-button" data-action="builder-save" ${saving?'disabled':''}>${filled === CUSTOM_DECK_SIZE ? '保存套牌' : '保存草稿'}</button>
    </div>
    <p class="builder-rule">每种牌最多放 2 张。凑够 20 张即可用于人机对战。</p>
    <div class="builder-tools">
      <button class="secondary-button" data-action="builder-view" aria-pressed="${filters.owned}">${filters.owned ? '已加入 · 返回全部' : '只看已加入'} </button>
      ${filled ? '' : '<button class="secondary-button" data-action="builder-fill">填入该流派预组</button>'}
      <input id="builder-search" type="search" aria-label="搜索牌名或效果" placeholder="搜索牌名或效果" value="${esc(filters.search)}">
      <select id="builder-type" aria-label="卡牌类型"><option value="">所有类型</option>${Object.entries(TYPE_LABELS).map(([type,label])=>`<option value="${type}" ${type===filters.type?'selected':''}>${label}</option>`).join('')}</select>
    </div>
    <div class="builder-catalog">
      ${rows.map(card=>{
        const copies = counts.get(card.id) || 0;
        return `<article class="builder-card ${copies ? 'in-deck' : ''}" data-key="builder-${card.id}">
          <button class="builder-card-info" data-action="inspect" data-card="${card.id}" aria-label="查看${card.name}">
            <span class="builder-art"><span class="ink-art art-${card.art}" aria-hidden="true"></span><b aria-label="${card.cost} 精力">${card.cost}</b></span>
            <span><strong>${card.name}</strong><small>${TYPE_LABELS[card.type]} · ${card.text}</small></span>
          </button>
          <div class="builder-quantity">
            <button data-action="builder-remove" data-card="${card.id}" aria-label="移除${card.name}" ${!copies || saving ? 'disabled' : ''}>−</button>
            <b aria-label="${copies} 张">${copies}</b>
            <button data-action="builder-add" data-card="${card.id}" aria-label="加入${card.name}" ${copies >= CARD_COPY_LIMIT || filled >= CUSTOM_DECK_SIZE || saving ? 'disabled' : ''}>+</button>
          </div>
        </article>`;
      }).join('') || '<p class="builder-empty">当前没有符合条件的卡牌。</p>'}
    </div>
    ${editing ? '<button class="underlined-button builder-delete" data-action="builder-confirm-delete">删除这套牌</button>' : ''}
  </main>`;
}
