export const CARDS = [
  { id: 'waiting', name: '大家都在等你', cost: 2, type: 'unit', attack: 2, health: 3, art: 0, text: '无需多言，也能让人倍感压力。', flavor: '一句话，让整个群都安静了。' },
  { id: 'leader', name: '这是领导定的', cost: 3, type: 'unit', attack: 1, health: 5, art: 1, tags: ['guard'], text: '拦截：对手必须先攻击此立场。', flavor: '山不在高，上面有人。' },
  { id: 'follow', name: '这个谁来跟一下', cost: 2, type: 'unit', attack: 2, health: 3, art: 2, effect: 'pot', text: '入场：给对手挂 1 个锅。', flavor: '谁，往往就是最后看消息的人。' },
  { id: 'ack', name: '收到', cost: 1, type: 'spell', art: 3, effect: 'ack', text: '获得 3 点护盾，抽 1 张牌。', flavor: '消息收到了，灵魂还没有。' },
  { id: 'supplement', name: '我补充两句', cost: 2, type: 'spell', art: 4, effect: 'supplement', target: 'enemy', tags: ['combo'], text: '造成 2 点伤害。连击：再造成 2 点。', flavor: '两句的单位，是半小时。' },
  { id: 'notmine', name: '这不是我负责的', cost: 2, type: 'spell', art: 2, effect: 'transfer', text: '转移自己身上最多 2 个锅；若自己无锅，则给对手挂 1 个锅。', flavor: '锅可以热，边界必须清楚。' },
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
  { id: 'meeting', name: '每天同步一下', cost: 4, type: 'unit', attack: 3, health: 5, art: 0, effect: 'endPot', text: '己方回合结束：给对手挂 1 个锅。', flavor: '流水的日程，铁打的例会。' },
  { id: 'expert', name: '以我的经验来看', cost: 5, type: 'unit', attack: 4, health: 5, art: 8, effect: 'draw', text: '入场：抽 1 张牌。', flavor: '年资，就是最厚的护城河。' },
  { id: 'fishing', name: '我这边网络不好', cost: 1, type: 'unit', attack: 1, health: 2, art: 6, effect: 'startArmor', text: '己方回合开始：获得 1 点护盾。', flavor: '信号断了，工资没断。' },
  { id: 'intern', name: '新人多锻炼', cost: 1, type: 'unit', attack: 2, health: 1, art: 0, text: '低费立场，抢占先机。', flavor: '年轻，就是最好的工作描述。' },
  { id: 'boss', name: '我只看结果', cost: 6, type: 'unit', attack: 5, health: 6, art: 1, tags: ['guard'], effect: 'sweep', text: '拦截。入场：对所有敌方立场造成 2 点伤害。', flavor: '过程很辛苦？那结果呢。' },
  { id: 'redirect', name: '我们回头再聊', cost: 2, type: 'spell', art: 6, effect: 'bounce', target: 'enemyUnit', text: '将一个敌方立场退回手牌，移除其增益与状态。', flavor: '回头，是一个很有弹性的时间。' },
  { id: 'silence', name: '这话我没说过', cost: 1, type: 'spell', art: 5, effect: 'silence', target: 'enemyUnit', text: '沉默一个敌方立场：移除其关键词和触发能力，保留当前攻防。', flavor: '刚才那段，建议从纪要删掉。' },
  { id: 'cancel', name: '这个会先取消', cost: 2, type: 'secret', art: 6, effect: 'cancel', text: '伏笔：使对手下一张话术的效果失效。精力和卡牌仍会消耗。', flavor: '有些会议，最好的结论是不开。' },
  { id: 'armorStrike', name: '这点压力算什么', cost: 2, type: 'spell', art: 1, effect: 'armorStrike', target: 'enemy', text: '造成等同于自身护盾的伤害，最多 6 点，然后消耗 3 点护盾。', flavor: '情绪足够稳定，就能反过来施压。' },
  { id: 'lifesteal', name: '忙里偷闲', cost: 3, type: 'unit', attack: 2, health: 3, art: 3, tags: ['lifesteal'], text: '汲取：主动攻击造成实际伤害时，恢复等量心态。', flavor: '工作要做，自己的心态也要照顾。' },
  { id: 'tank', name: '保持情绪稳定', cost: 3, type: 'unit', attack: 1, health: 6, art: 8, tags: ['guard', 'thorns'], text: '拦截。反伤：被立场攻击时，额外对攻击者造成 1 点伤害。', flavor: '我没生气，我只是会反弹。' },
  { id: 'guardGain', name: '先稳住阵脚', cost: 2, type: 'spell', art: 8, effect: 'guardGain', text: '获得 4 点护盾。若己方有拦截立场，再抽 1 张牌。', flavor: '底气足了，才有心情讲道理。' },
  { id: 'recruit', name: '先搭个班子', cost: 3, type: 'spell', art: 0, effect: 'recruit', text: '召唤两个 1/1 的临时帮手。场位不足时只召唤能放下的数量。', flavor: '人先到位，方向再议。' },
  { id: 'rally', name: '把格局打开', cost: 3, type: 'spell', art: 1, effect: 'rally', text: '所有己方立场获得 +1 压迫、+1 底气。', flavor: '一个人的饼，大家一起吃。' },
  { id: 'mentor', name: '带带新人', cost: 3, type: 'unit', attack: 2, health: 4, art: 0, effect: 'summonGrow', text: '每当其他己方立场入场，自身获得 +1 压迫。', flavor: '团队越大，我的发言权越大。' },
  { id: 'partner', name: '项目合伙人', cost: 4, type: 'unit', attack: 3, health: 4, art: 8, effect: 'spellGrow', text: '每当你使用一张话术后，自身获得 +1 压迫、+1 底气。', flavor: '每一次对齐，都在壮大自己的立场。' },
  { id: 'promotion', name: '这次真能落地', cost: 5, type: 'spell', art: 7, effect: 'promotion', text: '所有己方立场获得 +2 压迫。抽 1 张牌。', flavor: '饼画完了，该端上桌了。' },
  { id: 'handover', name: '离职交接', cost: 2, type: 'spell', art: 5, effect: 'sacrifice', target: 'allyUnit', text: '击破一个己方立场，触发其离场效果。抽 2 张牌。', flavor: '人可以走，资料总得留下。' },
  { id: 'rehire', name: '返聘通知', cost: 3, type: 'spell', art: 6, effect: 'revive', text: '召回最后一个离场的己方立场，恢复基础攻防，移除增益与状态。', flavor: '熟悉业务的人，回来再顶一下。' },
  { id: 'veteran', name: '老员工的智慧', cost: 3, type: 'unit', attack: 3, health: 4, art: 8, effect: 'deathGrow', text: '每当其他己方立场离场，自身获得 +1 压迫、+1 底气。', flavor: '同事一茬茬，经验一年年。' },
  { id: 'heir', name: '总得有人接班', cost: 2, type: 'unit', attack: 2, health: 2, art: 0, effect: 'deathToken', text: '离场：召唤一个 1/1 的临时帮手。', flavor: '人走了，事情总得有人接着做。' },
  { id: 'escalate', name: '问题升级处理', cost: 4, type: 'spell', art: 2, effect: 'cashPots', target: 'enemy', text: '消耗对手所有锅，造成 2 点伤害，每消耗一个锅再加 3 点。', flavor: '小事拖久了，就成了大事。' },
  { id: 'auditor', name: '这事不难吧', cost: 3, type: 'unit', attack: 3, health: 3, art: 2, effect: 'attackPot', text: '主动攻击对手心态后，给对手挂 1 个锅。', flavor: '难不难，先把名字写上。' },
  { id: 'finalword', name: '最后再说一句', cost: 1, type: 'spell', art: 4, effect: 'chainDamage', target: 'enemy', tags: ['combo'], text: '造成 1 点伤害，本回合此前每用过一张话术再加 1 点，最多 4 点。', flavor: '最后一句，也可以有最后一句。' },
  { id: 'speaker', name: '先让我说完', cost: 3, type: 'unit', attack: 2, health: 4, art: 4, effect: 'spellPing', text: '每当你使用一张话术后，对对手造成 1 点伤害。', flavor: '话一旦开了头，就不容易停下来。' }
];
export const TOKENS = [{ id: 'helper', name: '临时帮手', cost: 1, type: 'unit', attack: 1, health: 1, art: 0, temporary: true, text: '由卡牌或技能召唤。离场后消失，不进入交接区。', flavor: '先帮个忙，很快就好。' }, { id: 'coin', name: '临时加把劲', cost: 0, type: 'spell', art: 7, effect: 'coin', text: '本回合获得 1 点精力。仅后手起手获得，用于弥补先手优势。', flavor: '先来后到，都得有口气。' }];
export const CARD_MAP = Object.fromEntries([...CARDS, ...TOKENS].map(card => [card.id, card]));
export const TYPE_LABELS = { unit: '立场', spell: '话术', secret: '伏笔' };
export const DECKS = [
  { id: 'blame', name: '甩锅宗师', subtitle: '锅来将挡，四两拨千斤', color: 'red', art: 2, style: '挂锅 · 引爆', description: '先挂锅逼对手自证，再用纪要与升级处理集中收尾。', power: { name: '明确分工', cost: 2, effect: 'pot', text: '给对手挂 1 个锅。' }, cards: ['follow','notmine','minutes','boss','cc','meeting','silence','escalate','auditor','ack'] },
  { id: 'combo', name: '话术连招', subtitle: '句句收到，招招致命', color: 'green', art: 4, style: '过牌 · 连击', description: '先立发言引擎，再连续使用低费话术，把最后一句留给收尾。', power: { name: '打个腹稿', cost: 2, effect: 'discount', text: '抽 1 张牌，本回合下一张话术少消耗 1 精力。' }, cards: ['intern','ack','supplement','circle','overtime','deadline','finalword','speaker','coffee','partner'] },
  { id: 'control', name: '流程大师', subtitle: '别急，流程还没走完', color: 'blue', art: 1, style: '沉默 · 反制', description: '冻结限制进攻，沉默拆掉引擎，伏笔防住关键话术。', power: { name: '按章办事', cost: 2, effect: 'order', text: '获得 2 护盾，处理自己身上的 1 个锅。' }, cards: ['fishing','leader','process','redirect','quiet','unread','boss','silence','cancel','align'] },
  { id: 'shield', name: '带薪摸鱼', subtitle: '以静制动，压力反弹', color: 'blue', art: 3, style: '护盾 · 反打', description: '用拦截与汲取稳住心态，把攒下的护盾转换成伤害。', power: { name: '带薪休息', cost: 2, effect: 'rest', text: '恢复 2 心态，获得 2 护盾。' }, cards: ['fishing','boss','expert','coffee','ack','armorStrike','lifesteal','tank','guardGain','redirect'] },
  { id: 'growth', name: '画饼大师', subtitle: '人先到位，格局再开', color: 'green', art: 7, style: '召唤 · 成长', description: '临时帮手铺开场面，带新人积攒压迫，全体增益结束对局。', power: { name: '招个帮手', cost: 2, effect: 'recruit', text: '召唤一个 1/1 的临时帮手。' }, cards: ['intern','recruit','rally','mentor','partner','promotion','promote','waiting','ack','align'] },
  { id: 'recur', name: '复盘专家', subtitle: '离场有余音，交接有后手', color: 'red', art: 5, style: '离场 · 回收', description: '主动交接触发离场收益，再将核心立场回收或返聘。', power: { name: '复盘一下', cost: 1, effect: 'recall', text: '将最后一个离场的己方立场返回手牌，重置增益与状态。' }, cards: ['cc','heir','handover','rehire','veteran','follow','leader','minutes','ack','silence'] }
];
export const OPPONENTS = [
  { id: 'easy', name: '实习小白', title: '初入江湖', seal: '习', description: '有招就出，适合熟悉规则。', quote: '前辈，这个要怎么弄？' },
  { id: 'normal', name: '资深同事', title: '职场老手', seal: '熟', description: '会解场、会补刀，也会把锅还给你。', quote: '这事儿，咱们对齐一下。' },
  { id: 'hard', name: '部门总监', title: '深藏不露', seal: '谋', description: '预判连招，权衡交换，每一步都有用意。', quote: '过程我不管，我只看结果。' }
];
