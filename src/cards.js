export const CARDS = [
  { id: 'waiting', name: '大家都在等你', cost: 2, type: 'unit', attack: 2, health: 3, art: 0, text: '无需多言，也能让人倍感压力。', flavor: '一句话，让整个群都安静了。' },
  { id: 'leader', name: '这是领导定的', cost: 3, type: 'unit', attack: 1, health: 5, art: 1, tags: ['guard'], text: '拦截：对手必须先攻击此立场。', flavor: '山不在高，上面有人。' },
  { id: 'follow', name: '这个谁来跟一下', cost: 2, type: 'unit', attack: 1, health: 2, art: 2, effect: 'pot', text: '入场：给对手挂 1 个锅。', flavor: '谁，往往就是最后看消息的人。' },
  { id: 'ack', name: '收到', cost: 1, type: 'spell', art: 3, effect: 'ack', text: '获得 3 点护盾，抽 1 张牌。', flavor: '消息收到了，灵魂还没有。' },
  { id: 'supplement', name: '我补充两句', cost: 2, type: 'spell', art: 4, effect: 'supplement', target: 'enemy', tags: ['combo'], text: '造成 2 点伤害。连击：再造成 2 点。', flavor: '两句的单位，是半小时。' },
  { id: 'notmine', name: '这不是我负责的', cost: 2, type: 'spell', art: 2, effect: 'transfer', text: '将自己身上最多 2 个锅转移给对手。', flavor: '锅可以热，边界必须清楚。' },
  { id: 'minutes', name: '纪要写得很清楚', cost: 3, type: 'spell', art: 5, effect: 'minutes', target: 'enemy', text: '造成 3 点伤害。若对手有锅，改为 5 点。', flavor: '白纸黑字，建议全文背诵。' },
  { id: 'receipts', name: '我有聊天记录', cost: 2, type: 'secret', art: 5, effect: 'receipts', text: '伏笔：对手向你挂锅时，取消该次挂锅，对其造成 3 点伤害。', flavor: '截图，是成年人最后的底气。' },
  { id: 'process', name: '先走一下流程', cost: 2, type: 'spell', art: 6, effect: 'freeze', target: 'enemyUnit', text: '让一个敌方立场在其下回合无法攻击。抽 1 张牌。', flavor: '马上就好，等流程走完。' },
  { id: 'coffee', name: '我去接个水', cost: 2, type: 'spell', art: 3, effect: 'coffee', text: '恢复 4 点心态，抽 1 张牌。', flavor: '工位之外，天地宽广。' },
  { id: 'overtime', name: '再占用两分钟', cost: 0, type: 'spell', art: 7, effect: 'overtime', text: '本回合获得 2 点精力。自己受到 2 点伤害。', flavor: '借来的精力，总要还的。' },
  { id: 'align', name: '我们拉齐一下', cost: 3, type: 'spell', art: 6, effect: 'align', text: '对所有敌方立场造成 2 点伤害。', flavor: '拉齐的不是认知，是下班时间。' },
  { id: 'circle', name: '我拉个群', cost: 1, type: 'spell', art: 7, effect: 'circle', text: '抽 2 张牌，给自己挂 1 个锅。', flavor: '群多了，责任自然就有了。' },
  { id: 'promote', name: '未来是你的', cost: 2, type: 'spell', art: 8, effect: 'buff', target: 'allyUnit', text: '使一个己方立场获得 +2 压迫、+2 底气。', flavor: '饼画得圆，立场就站得稳。' },
  { id: 'fire', name: '今天必须有结论', cost: 6, type: 'spell', art: 1, effect: 'fire', text: '对所有敌方立场及对手造成 3 点伤害。', flavor: '有些会，开着开着就天亮了。' },
  { id: 'unread', name: '这个需求先砍了', cost: 3, type: 'spell', art: 4, effect: 'remove', target: 'weakEnemy', text: '移除一个压迫不超过 3 的敌方立场。', flavor: '最好的解决，是不再存在。' },
  { id: 'quiet', name: '你先别急', cost: 2, type: 'secret', art: 3, effect: 'quiet', text: '伏笔：敌方立场攻击你的心态时，先获得 5 点护盾。', flavor: '喝口茶，事情还没那么糟。' },
  { id: 'deadline', name: '下班前给到', cost: 4, type: 'unit', attack: 4, health: 3, art: 4, tags: ['haste'], text: '突袭：入场当回合即可攻击。', flavor: '现在几点？不重要。' },
  { id: 'cc', name: '已抄送相关领导', cost: 3, type: 'unit', attack: 2, health: 4, art: 5, effect: 'deathPot', text: '离场：给对手挂 1 个锅。', flavor: '轻轻一点，风起云涌。' },
  { id: 'meeting', name: '每天同步一下', cost: 4, type: 'unit', attack: 2, health: 5, art: 0, effect: 'endPot', text: '己方回合结束：给对手挂 1 个锅。', flavor: '流水的日程，铁打的例会。' },
  { id: 'expert', name: '以我的经验来看', cost: 5, type: 'unit', attack: 4, health: 5, art: 8, effect: 'draw', text: '入场：抽 1 张牌。', flavor: '年资，就是最厚的护城河。' },
  { id: 'fishing', name: '我这边网络不好', cost: 1, type: 'unit', attack: 1, health: 2, art: 6, effect: 'startArmor', text: '己方回合开始：获得 1 点护盾。', flavor: '信号断了，工资没断。' },
  { id: 'intern', name: '新人多锻炼', cost: 1, type: 'unit', attack: 2, health: 1, art: 0, text: '低费立场，抢占先机。', flavor: '年轻，就是最好的工作描述。' },
  { id: 'boss', name: '我只看结果', cost: 6, type: 'unit', attack: 5, health: 6, art: 1, tags: ['guard'], effect: 'sweep', text: '拦截。入场：对所有敌方立场造成 2 点伤害。', flavor: '过程很辛苦？那结果呢。' }
];
export const CARD_MAP = Object.fromEntries(CARDS.map(card => [card.id, card]));
export const TYPE_LABELS = { unit: '立场', spell: '话术', secret: '伏笔' };
export const DECKS = [
  { id: 'blame', name: '甩锅宗师', subtitle: '锅来将挡，四两拨千斤', color: 'red', art: 2, style: '甩锅 · 控场', description: '挂锅牵制，纪要补刀。让对手把精力花在自证上。', cards: ['waiting','follow','notmine','minutes','receipts','ack','cc','meeting','align','leader'] },
  { id: 'combo', name: '话术连招', subtitle: '句句收到，招招致命', color: 'green', art: 4, style: '连击 · 爆发', description: '低费过牌，积攒话术。一口气打出连击，结束会议。', cards: ['intern','ack','supplement','circle','overtime','deadline','promote','waiting','coffee','fire'] },
  { id: 'control', name: '流程大师', subtitle: '别急，流程还没走完', color: 'blue', art: 1, style: '防守 · 后期', description: '拦截稳住场面，流程限制攻击。耐心等到你的主场。', cards: ['fishing','leader','process','coffee','quiet','unread','expert','boss','ack','align'] }
];
export const OPPONENTS = [
  { id: 'easy', name: '实习小白', title: '初入江湖', seal: '习', description: '有招就出，适合熟悉规则。', quote: '前辈，这个要怎么弄？' },
  { id: 'normal', name: '资深同事', title: '职场老手', seal: '熟', description: '会解场、会补刀，也会把锅还给你。', quote: '这事儿，咱们对齐一下。' },
  { id: 'hard', name: '部门总监', title: '深藏不露', seal: '谋', description: '预判连招，权衡交换，每一步都有用意。', quote: '过程我不管，我只看结果。' }
];
