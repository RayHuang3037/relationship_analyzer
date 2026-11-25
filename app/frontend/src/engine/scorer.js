// L2：三轴评分 + 关系八型 + MBTI 拟合（权重表硬编码，可复现）
export const TYPES_INFO = {
  SRE: {
    code: 'SRE',
    name: '废话合唱团',
    tagline: '一句废话都能接住，还能接出第二句。',
    desc: '节奏几乎是黏在一起的，谁起个头，另一个马上就跟上了。吵架也吵不长，一个递台阶，另一个踩着就下来了。',
    loop: '一个人抛梗 → 另一个接住再添一句 → 越说越起劲，停不下来',
    hack: '这样挺好，就是别把"秒回"当成每天必须完成的任务。',
  },
  SRT: {
    code: 'SRT',
    name: '高效搭子',
    tagline: '聊天记录像个工作群，事说完就各自消失。',
    desc: '效率高得有点过分，几乎没有废话。该办的事一定办到，只是很少聊"我今天有点难过"这种。',
    loop: '一个人说事 → 另一个给方案 → 事办完，对话结束',
    hack: '事办完之后多问一句"你最近累不累"，会不太一样。',
  },
  SFE: {
    code: 'SFE',
    name: '相爱相杀',
    tagline: '嘴上谁都不让，心里谁都没走。',
    desc: '两个人都很在意对方，但一开口就想赢。好在情绪都摆在明面上，吵完不用猜来猜去。',
    loop: '一个人挑刺 → 另一个顶回去 → 火气上来 → 过一会儿自己就消了',
    hack: '把"你又来了"改成"我刚才有点急"，能省掉一半的架。',
  },
  SFT: {
    code: 'SFT',
    name: '客气小组',
    tagline: '有礼貌，有规律，也一直隔着一层。',
    desc: '节奏稳定，距离也稳定。谁都不越线，所以也就一直没走到更深的地方。',
    loop: '一个人问候或转发 → 另一个礼貌回一句 → 各过各的',
    hack: '想近一点，先说个自己的小麻烦，给对方一个关心你的机会。',
  },
  PRE: {
    code: 'PRE',
    name: '拉扯大师',
    tagline: '一个追，一个跑，但跑的那个一直在边上等着被拉住。',
    desc: '典型的一个进一个退，不过退的那位并不冷。追的人一着急，对方就会回头把话圆上。',
    loop: '一个人连着发 → 另一个慢半拍 → 追的人加码 → 慢的人回头哄一下',
    hack: '追的那个学着歇一会儿，跑的那个记得提前说句"晚上回你"。',
  },
  PRT: {
    code: 'PRT',
    name: '甲方与乙方',
    tagline: '一个定调子，一个谈条件，日子靠商量过着。',
    desc: '话语权常年偏在一边。一个人安排，另一个人点头或者提点要求，谈拢了就往前走。',
    loop: '主导的一方开口 → 另一方掂量一下提条件 → 谈拢，继续',
    hack: '定调的那个多问"你想怎么弄"，听着的那个敢说"其实我想……"。',
  },
  PFE: {
    code: 'PFE',
    name: '已发送，未读',
    tagline: '一个人发得像弹幕，另一个人回得像断网。',
    desc: '最耗人的一种。追的那个越急越发，躲的那个越压越沉，最后谁都不舒服。',
    loop: '连发几条 → 对方觉得喘不过气，先潜水 → 追的人急了问"你到底在不在" → 彻底没声',
    hack: '发到第三条先停二十分钟；真忙就打一句"在忙，晚上回你"，别直接消失。',
  },
  PFT: {
    code: 'PFT',
    name: '各聊各的',
    tagline: '两个人都在热聊，就是聊的不是同一件事。',
    desc: '节奏对不上，话题也对不上。你说你的，我说我的，靠着习惯一直聊到了现在。',
    loop: '一个人说起 A → 另一个接上 B → 谁也不打断谁 → 继续聊',
    hack: '试着把对方的话复述一遍——"你是说……对吧"，一句就能接上。',
  },
};

const FUNCTIONS_MAP = {
  INFP: ['Fi 主导', 'Ne 辅助', 'Si 第三', 'Te 劣势'],
  ENFP: ['Ne 主导', 'Fi 辅助', 'Te 第三', 'Si 劣势'],
  INFJ: ['Ni 主导', 'Fe 辅助', 'Ti 第三', 'Se 劣势'],
  ENFJ: ['Fe 主导', 'Ni 辅助', 'Se 第三', 'Ti 劣势'],
  INTJ: ['Ni 主导', 'Te 辅助', 'Fi 第三', 'Se 劣势'],
  INTP: ['Ti 主导', 'Ne 辅助', 'Si 第三', 'Fe 劣势'],
  ENTP: ['Ne 主导', 'Ti 辅助', 'Fe 第三', 'Si 劣势'],
  ENTJ: ['Te 主导', 'Ni 辅助', 'Se 第三', 'Fi 劣势'],
  ISTJ: ['Si 主导', 'Te 辅助', 'Fi 第三', 'Ne 劣势'],
  ISFJ: ['Si 主导', 'Fe 辅助', 'Ti 第三', 'Ne 劣势'],
  ESTJ: ['Te 主导', 'Si 辅助', 'Ne 第三', 'Fi 劣势'],
  ESFJ: ['Fe 主导', 'Si 辅助', 'Ne 第三', 'Ti 劣势'],
  ISTP: ['Ti 主导', 'Se 辅助', 'Ni 第三', 'Fe 劣势'],
  ISFP: ['Fi 主导', 'Se 辅助', 'Ni 第三', 'Te 劣势'],
  ESTP: ['Se 主导', 'Ti 辅助', 'Fe 第三', 'Ni 劣势'],
  ESFP: ['Se 主导', 'Fi 辅助', 'Te 第三', 'Ni 劣势'],
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function fitMbti(stat) {
  const total = Math.max(1, stat.total_msgs);
  const avgLen = stat.total_chars / total;
  const emojiRate = (stat.emojis + stat.stickers) / total;
  const questionRate = stat.questions / total;

  const e = clamp(Math.round(total * 0.6 + avgLen * 2 + questionRate * 30), 15, 85);
  const n = clamp(Math.round(70 - emojiRate * 40 + avgLen * 0.8), 15, 85);
  const f = clamp(Math.round(35 + stat.repairs * 12 + emojiRate * 50), 15, 85);
  const j = clamp(Math.round(30 + avgLen * 1.2 + (1 - questionRate) * 20), 15, 85);

  const d = [e >= 50 ? 'E' : 'I', n >= 50 ? 'N' : 'S', f >= 50 ? 'F' : 'T', j >= 50 ? 'J' : 'P'];
  const code = d.join('');

  return {
    code,
    dimensions: [
      { trait: '外向 E / 内向 I', code: d[0], score: d[0] === 'E' ? e : 100 - e },
      { trait: '直觉 N / 实感 S', code: d[1], score: d[1] === 'N' ? n : 100 - n },
      { trait: '情感 F / 思考 T', code: d[2], score: d[2] === 'F' ? f : 100 - f },
      { trait: '判断 J / 感知 P', code: d[3], score: d[3] === 'J' ? j : 100 - j },
    ],
    cognitive_stack: FUNCTIONS_MAP[code] || ['Fe 主导', 'Ti 辅助', 'Ne 第三', 'Si 劣势'],
  };
}

export function scoreRelationship(l1) {
  const { stats, metrics, participants, total_messages } = l1;
  const [a, b] = participants;

  const initDiff = Math.abs(metrics.initiation_ratio[a] - 50);
  const axisA = initDiff < 18 ? 'S' : 'P';
  const sScore = clamp(Math.round(100 - initDiff * 2.2), 10, 90);

  const repairRate = metrics.repair_success_rate;
  const axisB = repairRate >= 40 ? 'R' : 'F';
  const rScore = clamp(Math.round(repairRate), 5, 95);

  const emojiDensity =
    (stats[a].emojis + stats[b].emojis + stats[a].stickers + stats[b].stickers) / Math.max(1, total_messages);
  const axisC = emojiDensity > 0.25 ? 'E' : 'T';
  const eScore = clamp(Math.round(emojiDensity * 180), 10, 90);

  const code = `${axisA}${axisB}${axisC}`;

  return {
    relationship_type: TYPES_INFO[code] || TYPES_INFO.SRE,
    axes: {
      rhythm: { label: '节奏对称度', left: 'S 同频', right: 'P 追逃', score_left: sScore, score_right: 100 - sScore },
      repair: { label: '关系修复力', left: 'R 自动修复', right: 'F 摩擦累积', score_left: rScore, score_right: 100 - rScore },
      channel: { label: '表达通道', left: 'E 情绪感知', right: 'T 事务理智', score_left: eScore, score_right: 100 - eScore },
    },
    mbti_profiles: { [a]: fitMbti(stats[a]), [b]: fitMbti(stats[b]) },
  };
}
