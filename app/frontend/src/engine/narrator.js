// L3：叙事生成。默认走本地模板（零依赖、纯静态可用），可选填入自己的 Key 直连模型
const SYSTEM_PROMPT = `你是幽默、敏锐的关系观察员。根据给定统计与名场面，写一份轻松的《二人互动说明书》。
规则：
1. 语气接地气、有梗，别端着，不要爹味说教。
2. 不许编造或改动任何数字、代号与百分比。
3. 按关系视场微调语气：朋友更损，情侣更软。
4. 只谈对话里的互动模式，不给任何一方下诊断结论。
输出 JSON：overview_comment(≤30字)、detailed_analysis(约150字)、mbti_narrative(约100字)、action_hack(2条短句数组)。`;

export function localNarrative(l1, l2) {
  const { participants, relationship_mode: mode, metrics } = l1;
  const [a, b] = participants;
  const t = l2.relationship_type;
  const pa = l2.mbti_profiles[a].code;
  const pb = l2.mbti_profiles[b].code;
  const prefix = mode === 'friends' ? '你俩' : mode === 'lovers' ? '你们俩' : '这两位';
  const share = metrics.initiation_ratio[a];

  return {
    overview_comment: `${prefix}这个组合，说白了就是「${t.name}」。`,
    detailed_analysis: `${t.desc} 具体到数字：${a} 一个人说了 ${share}% 的话，中间递台阶 ${metrics.repair_count} 次，起摩擦 ${metrics.conflict_count} 次。`,
    mbti_narrative: `${a} 是 ${pa}，${b} 是 ${pb}。一个爱抛，一个爱接，接不接得住得看当天心情。`,
    action_hack: [t.hack, '真要吵起来，先把手机放下十分钟再回来打字。'],
    source: 'local',
  };
}

export async function generateNarrative(l1, l2, apiKey) {
  if (!apiKey) return localNarrative(l1, l2);

  const payload = {
    relationship_mode: l1.relationship_mode,
    type: l2.relationship_type.name,
    code: l2.relationship_type.code,
    participants: l1.participants,
    metrics: l1.metrics,
    quotes: l1.quotes_highlights,
    mbti: Object.fromEntries(Object.entries(l2.mbti_profiles).map(([k, v]) => [k, v.code])),
  };

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(payload) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });
    if (!res.ok) throw new Error(`模型返回 ${res.status}`);
    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    return { ...parsed, source: 'llm' };
  } catch (err) {
    return { ...localNarrative(l1, l2), warning: `模型调用失败（${err.message}），已用本地模板。` };
  }
}
