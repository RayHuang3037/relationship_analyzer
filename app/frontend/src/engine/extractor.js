// L1-2：确定性特征提取（纯统计，可复现）
export const CRITICISM_WORDS = ['总是', '从来不', '每次都', '你又', '凭什么', '为什么你老是', '怎么又'];
export const DEFENSIVENESS_WORDS = ['但是', '可是', '明明是', '那我也', '我又没有', '随便你吧', '算了吧'];
export const CONTEMPT_WORDS = ['呵呵', '搞笑', '无语', '懒得理你', '随你便', '你开心就好'];
export const REPAIR_WORDS = ['抱歉', '对不起', '我的错', '别生气啦', '喝水', '给你买', '摸摸', '好啦', '原谅我', '错啦'];

const EMOJI_RE = /\p{Extended_Pictographic}/gu;

function emptyStat() {
  return {
    total_msgs: 0,
    total_chars: 0,
    questions: 0,
    emojis: 0,
    stickers: 0,
    voices: 0,
    criticisms: 0,
    repairs: 0,
    defensiveness: 0,
  };
}

function hit(text, words) {
  return words.some((w) => text.includes(w));
}

export function extractFeatures(messages, relationshipMode = 'general') {
  if (!messages.length) return null;

  const senders = [...new Set(messages.map((m) => m.sender))];
  const [a, b = 'B'] = senders;

  const stats = { [a]: emptyStat(), [b]: emptyStat() };
  const quotes = [];

  for (const m of messages) {
    const s = m.sender;
    if (!stats[s]) stats[s] = emptyStat();
    const c = m.content || '';
    const st = stats[s];

    st.total_msgs += 1;
    st.total_chars += c.length;
    if (m.type === 'sticker') st.stickers += 1;
    if (m.type === 'voice') st.voices += 1;

    if (c.includes('?') || c.includes('？') || c.endsWith('吗') || c.endsWith('呢')) st.questions += 1;

    st.emojis += (c.match(EMOJI_RE) || []).length;

    const short = c.length < 50;
    if (hit(c, CRITICISM_WORDS)) {
      st.criticisms += 1;
      if (short && quotes.length < 8) quotes.push({ type: 'criticism', sender: s, text: c });
    } else if (hit(c, DEFENSIVENESS_WORDS) || hit(c, CONTEMPT_WORDS)) {
      st.defensiveness += 1;
      if (short && quotes.length < 8) quotes.push({ type: 'defensiveness', sender: s, text: c });
    } else if (hit(c, REPAIR_WORDS)) {
      st.repairs += 1;
      if (short && quotes.length < 8) quotes.push({ type: 'repair', sender: s, text: c });
    }
  }

  const total = messages.length;
  const msgsA = stats[a].total_msgs;
  const ratioA = Math.round((msgsA / total) * 1000) / 10;

  const totalRepairs = stats[a].repairs + stats[b].repairs;
  const totalConflicts =
    stats[a].criticisms + stats[b].criticisms + stats[a].defensiveness + stats[b].defensiveness;

  return {
    participants: [a, b],
    total_messages: total,
    relationship_mode: relationshipMode,
    stats,
    metrics: {
      initiation_ratio: { [a]: ratioA, [b]: Math.round((100 - ratioA) * 10) / 10 },
      avg_msg_length: {
        [a]: Math.round((stats[a].total_chars / Math.max(1, msgsA)) * 10) / 10,
        [b]: Math.round((stats[b].total_chars / Math.max(1, stats[b].total_msgs)) * 10) / 10,
      },
      repair_success_rate: Math.min(100, Math.round((totalRepairs / Math.max(1, totalConflicts)) * 1000) / 10),
      conflict_count: totalConflicts,
      repair_count: totalRepairs,
    },
    quotes_highlights: quotes.slice(0, 5),
  };
}
