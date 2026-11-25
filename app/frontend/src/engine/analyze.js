import { parseChat } from './parser';
import { extractFeatures } from './extractor';
import { scoreRelationship } from './scorer';
import { generateNarrative } from './narrator';

export const MIN_MESSAGES = 10;
export const MAX_MESSAGES = 6000;

export function confidenceOf(total) {
  if (total >= 200) return '高';
  if (total >= 50) return '中';
  return '低（仅作参考）';
}

export async function analyze(rawText, relationshipMode = 'general', apiKey = '') {
  let messages = parseChat(rawText);
  if (!messages.length) {
    throw new Error('这段没读出聊天记录。一行一句、名字后面加冒号就行，比如「张三: 在吗」。');
  }
  if (messages.length < MIN_MESSAGES) {
    throw new Error(`只认出 ${messages.length} 条，太少了。凑到 ${MIN_MESSAGES} 条再试？`);
  }

  // 只保留前两位说话人，多人群里冒出来的第三个人不参与判定
  const senders = [...new Set(messages.map((m) => m.sender))];
  if (senders.length < 2) {
    throw new Error('这里只有一个人在说话。两个人的聊天才看得出互动。');
  }
  const two = senders.slice(0, 2);
  messages = messages.filter((m) => two.includes(m.sender));
  if (messages.length < MIN_MESSAGES) {
    throw new Error(`去掉第三个人之后只剩 ${messages.length} 条，凑到 ${MIN_MESSAGES} 条再试？`);
  }

  const truncated = messages.length > MAX_MESSAGES;
  if (truncated) messages = messages.slice(-MAX_MESSAGES);

  const l1 = extractFeatures(messages, relationshipMode);
  const l2 = scoreRelationship(l1);
  const narrative = await generateNarrative(l1, l2, apiKey);

  return {
    sample_info: {
      total_messages: l1.total_messages,
      confidence_level: confidenceOf(l1.total_messages),
      truncated,
    },
    l1_features: l1,
    l2_scores: l2,
    narrative,
  };
}
