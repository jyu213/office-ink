export const CARDS = [
  { id: 'waiting', name: '全员等你对齐', cost: 2, type: 'unit', attack: 2, health: 3, art: 0, text: '普通立场，入场当回合不能攻击。', flavor: '群里二十个人，只有你的名字有提示音。' },
  { id: 'leader', name: '老板已经拍板', cost: 3, type: 'unit', attack: 1, health: 5, art: 1, tags: ['guard'], text: '拦截：对手必须先攻击此立场。', flavor: '最短的审批流程是有人说他已经问过了。' },
  { id: 'follow', name: '这块你来认领', cost: 2, type: 'unit', attack: 2, health: 3, art: 2, effect: 'pot', text: '入场：给对手挂 1 个锅。', flavor: '第一个在群里打问号的人，被写进了负责人那一栏。' },
  { id: 'ack', name: '收到，已同步', cost: 1, type: 'spell', art: 3, effect: 'ack', text: '获得 3 点护盾，抽 1 张牌。', flavor: '三秒回消息，三天回进度。' },
  { id: 'supplement', name: '我补充两句', cost: 2, type: 'spell', art: 4, effect: 'supplement', target: 'enemy', tags: ['combo'], text: '造成 2 点伤害。连击：再造成 2 点。', flavor: '第一句补充背景，第二句预约下次会。' },
  { id: 'notmine', name: '先对齐下边界', cost: 2, type: 'spell', art: 2, effect: 'transfer', text: '把自己身上最多 2 个锅转给对手。若自己无锅，改为给对手挂 1 个锅。', flavor: '画了三个同心圆，锅刚好在你的那个圈。' },
  { id: 'minutes', name: '以纪要为准', cost: 3, type: 'spell', art: 5, effect: 'minutes', target: 'enemy', text: '造成 3 点伤害。若对手有锅，改为 5 点。', flavor: '你可以忘了开过会，纪要记得你说过好。' },
  { id: 'receipts', name: '我这有留痕', cost: 2, type: 'secret', art: 5, effect: 'receipts', text: '伏笔：对手向你挂锅时，取消该次挂锅，对其造成 3 点伤害。', flavor: '你说没印象，我说第 47 秒。' },
  { id: 'process', name: '还在审批链路', cost: 2, type: 'spell', art: 6, effect: 'freeze', target: 'enemyUnit', text: '让一个敌方立场在其下回合无法攻击。抽 1 张牌。', flavor: '第一位审批人请假，第二位审批人要等第一位。' },
  { id: 'coffee', name: '离线喝口水', cost: 2, type: 'spell', art: 3, effect: 'coffee', text: '恢复 4 点心态，抽 1 张牌。', flavor: '去茶水间之前，顺手把在线状态改成了沟通中。' },
  { id: 'overtime', name: '抢两分钟带宽', cost: 0, type: 'spell', art: 7, effect: 'overtime', text: '本回合获得 2 点精力。自己受到 2 点伤害。', flavor: '借的是大家两分钟，欠的是你自己的末班车。' },
  { id: 'align', name: '对齐下颗粒度', cost: 3, type: 'spell', art: 6, effect: 'align', text: '对所有敌方立场造成 2 点伤害。', flavor: '上次按页过，这次按字过，标点留到下次。' },
  { id: 'circle', name: '拉群先拉通', cost: 1, type: 'spell', art: 7, effect: 'circle', text: '抽 2 张牌，给自己挂 1 个锅。', flavor: '群名改成了专项推进，项目进度依然是 0%。' },
  { id: 'promote', name: '给你个大抓手', cost: 2, type: 'spell', art: 8, effect: 'buff', target: 'allyUnit', text: '使一个己方立场获得 +2 压迫、+2 底气。', flavor: '抓手刚发下来，扭头就发现另一头连着个锅。' },
  { id: 'fire', name: '今天必须闭环', cost: 6, type: 'spell', art: 1, effect: 'fire', text: '对所有敌方立场及对手造成 3 点伤害。', flavor: '会议室灯一关，这事就只剩最后一个待办。' },
  { id: 'unread', name: '需求先下线', cost: 3, type: 'spell', art: 4, effect: 'remove', target: 'weakEnemy', text: '移除一个压迫不超过 3 的敌方立场。', flavor: '还没上线就下线，零线上事故，建议纳入绩效。' },
  { id: 'quiet', name: '你先别急', cost: 2, type: 'secret', art: 3, effect: 'quiet', text: '伏笔：敌方立场攻击你的心态时，先获得 5 点护盾。', flavor: '先等对方把话说完，顺便等茶泡开。' },
  { id: 'deadline', name: '下班前给到', cost: 4, type: 'unit', attack: 4, health: 3, art: 4, tags: ['haste'], text: '突袭：入场当回合即可攻击。', flavor: '发消息的时候是六点零一分，交付时间是六点。' },
  { id: 'cc', name: '已抄送相关领导', cost: 3, type: 'unit', attack: 2, health: 4, art: 5, effect: 'deathPot', text: '离场：给对手挂 1 个锅。', flavor: '正文只有三行，抄送名单占了半屏。' },
  { id: 'meeting', name: '站会同步一下', cost: 4, type: 'unit', attack: 3, health: 5, art: 0, effect: 'endPot', text: '己方回合结束：给对手挂 1 个锅。', flavor: '站会严格控制在十五分钟，站完坐下来接着说。' },
  { id: 'expert', name: '复用最佳实践', cost: 5, type: 'unit', attack: 4, health: 5, art: 8, effect: 'draw', text: '入场：抽 1 张牌。', flavor: '复用的是去年的文档，创新的是今年的封面。' },
  { id: 'fishing', name: '链路有点卡', cost: 1, type: 'unit', attack: 1, health: 2, art: 6, effect: 'startArmor', text: '己方回合开始：获得 1 点护盾。', flavor: '轮到你发言就卡，轮到下班就恢复。' },
  { id: 'intern', name: '新人承接一下', cost: 1, type: 'unit', attack: 2, health: 1, art: 0, text: '普通立场，入场当回合不能攻击。', flavor: '入职第一天开通权限，第二天就拥有了全量需求。' },
  { id: 'boss', name: '验收只看结果', cost: 6, type: 'unit', attack: 5, health: 6, art: 1, tags: ['guard'], effect: 'sweep', text: '拦截。入场：对所有敌方立场造成 2 点伤害。', flavor: '汇报做了二十页，总监让你翻到有数字的那一页。' },
  { id: 'redirect', name: '先回滚一版', cost: 2, type: 'spell', art: 6, effect: 'bounce', target: 'enemyUnit', text: '将一个敌方立场退回手牌，移除其增益与状态。', flavor: '修好了吗？工单上写的是已恢复。' },
  { id: 'silence', name: '从纪要里删掉', cost: 1, type: 'spell', art: 5, effect: 'silence', target: 'enemyUnit', text: '沉默一个敌方立场：移除其关键词和触发能力，保留当前攻防。', flavor: '会议录音还在，发言人已经更新到下一版。' },
  { id: 'cancel', name: '会议改看文档', cost: 2, type: 'secret', art: 6, effect: 'cancel', text: '伏笔：使对手下一张话术的效果失效。精力和卡牌仍会消耗。', flavor: '会议取消后，文档新增了一栏：请逐一确认收到。' },
  { id: 'armorStrike', name: '把压力反向赋能', cost: 2, type: 'spell', art: 1, effect: 'armorStrike', target: 'enemy', text: '造成等于自身护盾的伤害，最多 6 点。然后消耗最多 3 点护盾。', flavor: '收到五条催办，把它们合成一封催办发回去。' },
  { id: 'lifesteal', name: '带薪回血', cost: 3, type: 'unit', attack: 2, health: 3, art: 3, tags: ['lifesteal'], text: '汲取：主动攻击造成实际伤害时，恢复等量心态。', flavor: '午休睡了十分钟，复工时感觉自己刚入职。' },
  { id: 'tank', name: '风险我来兜底', cost: 3, type: 'unit', attack: 1, health: 6, art: 8, tags: ['guard', 'thorns'], text: '拦截。反伤：被立场攻击时，额外对攻击者造成 1 点伤害。', flavor: '凡是找不到负责人的事，都能准确地找到他。' },
  { id: 'guardGain', name: '加一道防火墙', cost: 2, type: 'spell', art: 8, effect: 'guardGain', text: '获得 4 点护盾。若己方有拦截立场，再抽 1 张牌。', flavor: '加完一层审批，风险没进来，需求也没出去。' },
  { id: 'recruit', name: '拉个协同小组', cost: 3, type: 'spell', art: 0, effect: 'recruit', text: '召唤两个 1/1 的临时帮手。场位不足时只召唤能放下的数量。', flavor: '群主先把另外两位同事拉进来，再问今天开会聊什么。' },
  { id: 'rally', name: '大家把格局打开', cost: 3, type: 'spell', art: 1, effect: 'rally', text: '所有己方立场获得 +1 压迫、+1 底气。', flavor: '预算还是原来那张表，投影切换成了全屏。' },
  { id: 'mentor', name: '启动传帮带', cost: 3, type: 'unit', attack: 2, health: 4, art: 0, effect: 'summonGrow', text: '每当其他己方立场入场，自身获得 +1 压迫。', flavor: '新人每学会一件事，导师就多一张述职截图。' },
  { id: 'partner', name: '拿到话语权', cost: 4, type: 'unit', attack: 3, health: 4, art: 8, effect: 'spellGrow', text: '每当你使用一张话术后，自身获得 +1 压迫、+1 底气。', flavor: '只要每场会都发过言，项目就少不了他的签字。' },
  { id: 'promotion', name: '全量上线', cost: 5, type: 'spell', art: 7, effect: 'promotion', text: '所有己方立场获得 +2 压迫。抽 1 张牌。', flavor: '灰度群里没人说话，默认大家都觉得很好用。' },
  { id: 'handover', name: '沉淀交接文档', cost: 2, type: 'spell', art: 5, effect: 'sacrifice', target: 'allyUnit', text: '击破一个己方立场，触发其离场效果。抽 2 张牌。', flavor: '离职等了三周，最后一句交接是密码在抽屉里。' },
  { id: 'rehire', name: '捞回前同事', cost: 3, type: 'spell', art: 6, effect: 'revive', text: '从交接区召回最近离场的己方立场，恢复基础攻防。', flavor: '方案做了五版，最优解还是给前同事发个在吗。' },
  { id: 'veteran', name: '十年行业沉淀', cost: 3, type: 'unit', attack: 3, health: 4, art: 8, effect: 'deathGrow', text: '每当其他己方立场离场，自身获得 +1 压迫、+1 底气。', flavor: '见过同一个项目三次重启，每次他都在群里。' },
  { id: 'heir', name: '找人补个位', cost: 2, type: 'unit', attack: 2, health: 2, art: 0, effect: 'deathToken', text: '离场：召唤一个 1/1 的临时帮手。', flavor: '工位空了一天，旧群和待办早就有人接手。' },
  { id: 'escalate', name: '向上升级一下', cost: 4, type: 'spell', art: 2, effect: 'cashPots', target: 'enemy', text: '消耗对手所有锅，造成 2 点伤害，每消耗一个锅再加 3 点。', flavor: '一线处理了两周，往上报了一级，下午就有了负责人。' },
  { id: 'auditor', name: '先找个责任人', cost: 3, type: 'unit', attack: 3, health: 3, art: 2, effect: 'attackPot', text: '主动攻击对手心态后，给对手挂 1 个锅。', flavor: '根因可以慢慢查，表格里的人名必须今天写。' },
  { id: 'finalword', name: '最后再收个口', cost: 1, type: 'spell', art: 4, effect: 'chainDamage', target: 'enemy', tags: ['combo'], text: '造成 1 点伤害，本回合此前每用过一张话术再加 1 点，最多 4 点。', flavor: '只剩最后一个问题，于是主持人重新开了共享。' },
  { id: 'speaker', name: '先讲底层逻辑', cost: 3, type: 'unit', attack: 2, health: 4, art: 4, effect: 'spellPing', text: '每当你使用一张话术后，对对手造成 1 点伤害。', flavor: '听完底层逻辑，会议室续到了顶层。' }
];
export const TOKENS = [{ id: 'helper', name: '临时帮手', cost: 1, type: 'unit', attack: 1, health: 1, art: 0, temporary: true, text: '由卡牌或技能召唤。离场后消失，不进入交接区。', flavor: '说是支援两天，入群欢迎词已经写了长期共建。' }, { id: 'coin', name: '带宽临时扩容', cost: 0, type: 'spell', art: 7, effect: 'coin', text: '本回合获得 1 点精力。仅后手起手获得，用于弥补先手优势。', flavor: '别人已经开讲，给你预留了一点插话时间。' }];
export const CARD_MAP = Object.fromEntries([...CARDS, ...TOKENS].map(card => [card.id, card]));
export const TYPE_LABELS = { unit: '立场', spell: '话术', secret: '伏笔' };
export const DECKS = [
  { id: 'blame', name: '甩锅宗师', subtitle: '锅只在一个部门流转，算不上跨部门协同。', color: 'red', art: 2, style: '挂锅 · 引爆', description: '先把锅挂上，再用「以纪要为准」补刀，或用「向上升级一下」一次结账。', power: { name: '明确一下归属', cost: 2, effect: 'pot', text: '给对手挂 1 个锅。' }, cards: ['follow','notmine','minutes','boss','cc','meeting','silence','escalate','auditor','ack'] },
  { id: 'combo', name: '话术连招', subtitle: '每句都是补充，合起来刚好又开了一场会。', color: 'green', art: 4, style: '过牌 · 连击', description: '先让「先讲底层逻辑」站住，再接低费话术，最后用「最后再收个口」打连击。', power: { name: '先预演一遍', cost: 2, effect: 'discount', text: '抽 1 张牌。本回合下一张话术少花 1 点精力。' }, cards: ['intern','ack','supplement','circle','overtime','deadline','finalword','speaker','coffee','partner'] },
  { id: 'control', name: '流程大师', subtitle: '很快就能给结论，只剩三个会签和一次复审。', color: 'blue', art: 1, style: '沉默 · 反制', description: '用审批拖住进攻，靠回滚和沉默拆掉关键立场，最后再验收结果。', power: { name: '按流程销项', cost: 2, effect: 'order', text: '获得 2 点护盾，并处理自己身上 1 个锅。' }, cards: ['fishing','leader','process','redirect','quiet','unread','boss','silence','cancel','align'] },
  { id: 'shield', name: '带薪摸鱼', subtitle: '工位可以离开，在线状态必须维持。', color: 'blue', art: 3, style: '护盾 · 反打', description: '用拦截和汲取稳住心态。护盾攒够后，用「把压力反向赋能」打回去。', power: { name: '带薪续航', cost: 2, effect: 'rest', text: '恢复 2 点心态，获得 2 点护盾。' }, cards: ['fishing','boss','expert','coffee','ack','armorStrike','lifesteal','tank','guardGain','redirect'] },
  { id: 'growth', name: '画饼大师', subtitle: '本来就画了一张饼，转眼拉了六个人来评审。', color: 'green', art: 7, style: '召唤 · 成长', description: '先借帮手铺场，让「启动传帮带」成长，再用「全量上线」给全场加压迫。', power: { name: '借个临时人力', cost: 2, effect: 'recruit', text: '召唤一个 1/1 的临时帮手。' }, cards: ['intern','recruit','rally','mentor','partner','promotion','promote','waiting','ack','align'] },
  { id: 'recur', name: '复盘专家', subtitle: '活出现在待办里第二次，就可以算成经验复用了。', color: 'red', art: 5, style: '离场 · 回收', description: '先交接吃到离场收益，再返聘或回收核心立场，把同一份经验用两遍。', power: { name: '复用历史经验', cost: 1, effect: 'recall', text: '将最后一个离场的己方立场返回手牌，重置增益与状态。' }, cards: ['cc','heir','handover','rehire','veteran','follow','leader','minutes','ack','silence'] }
];
export const OPPONENTS = [
  { id: 'easy', name: '实习小白', title: '初入江湖', seal: '习', description: '有招就出，适合熟悉规则。', quote: '前辈，这个要怎么弄？' },
  { id: 'normal', name: '资深同事', title: '职场老手', seal: '熟', description: '会解场、会补刀，也会把锅还给你。', quote: '这事儿，咱们对齐一下。' },
  { id: 'hard', name: '部门总监', title: '深藏不露', seal: '谋', description: '预判连招，权衡交换，每一步都有用意。', quote: '过程我不管，我只看结果。' }
];
