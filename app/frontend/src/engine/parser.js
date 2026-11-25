// L1-1：把微信导出文本 / 粘贴文本解析成结构化消息
const RE_DATETIME = /^\[?(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\]?\s+([^:\n]{1,20})[:：]\s*(.*)$/;
const RE_TIMEONLY = /^(\d{1,2}:\d{2}(?::\d{2})?)\s+([^:\n]{1,20})[:：]\s*(.*)$/;
const RE_SIMPLE = /^([^:\n]{1,15})[:：]\s*(.*)$/;
const BAD_NAME = /[，。！？、,.!?;；"'“”（）()[\]]/;

const MERGE_WINDOW_MS = 3 * 60 * 1000; // 同人连续发送的合并窗口

function parseTs(s) {
  if (!s) return null;
  const m = s.match(/^(?:(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m;
  if (y) return { kind: 'date', ms: Date.UTC(+y, +mo - 1, +d, +h, +mi, +(se || 0)) };
  return { kind: 'clock', ms: ((+h * 60 + +mi) * 60 + +(se || 0)) * 1000 };
}

function detectType(content) {
  if (/\[动画表情\]|\[表情\]|\[Sticker\]/.test(content)) return 'sticker';
  if (/\[语音\]|\[Voice\]/.test(content)) return 'voice';
  if (/\[图片\]|\[Image\]/.test(content)) return 'image';
  if (/\[视频\]|\[Video\]/.test(content)) return 'video';
  if (/\[撤回一条消息\]/.test(content)) return 'revoke';
  return 'text';
}

function parseText(rawText) {
  const messages = [];
  let current = null;

  for (const rawLine of rawText.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    let m = line.match(RE_DATETIME);
    let timeStr = '';
    let sender = '';
    let content = '';

    if (m) {
      [, timeStr, sender, content] = m;
    } else {
      m = line.match(RE_TIMEONLY);
      if (m) {
        [, timeStr, sender, content] = m;
      } else {
        m = line.match(RE_SIMPLE);
        if (m && !/^https?:/.test(line) && !BAD_NAME.test(m[1])) {
          [, sender, content] = m;
          timeStr = '';
        } else {
          // 多行消息的续行
          if (current) current.content += '\n' + line;
          continue;
        }
      }
    }

    if (current) messages.push(current);
    current = {
      timeStr: timeStr.trim(),
      sender: sender.trim(),
      content: (content || '').trim(),
      type: 'text',
    };
  }
  if (current) messages.push(current);

  for (const msg of messages) msg.type = detectType(msg.content);

  // 合并同人连续发送：必须在 3 分钟窗口内且时间格式一致，避免把跨天消息揉成一条
  const merged = [];
  for (const msg of messages) {
    const last = merged[merged.length - 1];
    const t1 = last ? parseTs(last.timeStr) : null;
    const t2 = parseTs(msg.timeStr);
    const mergeable = last
      && last.sender === msg.sender
      && last.type === 'text'
      && msg.type === 'text'
      && t1 && t2
      && t1.kind === t2.kind
      && t2.ms - t1.ms >= 0
      && t2.ms - t1.ms <= MERGE_WINDOW_MS;

    if (mergeable) last.content += ' / ' + msg.content;
    else merged.push(msg);
  }
  return merged;
}

// 兼容微信第三方工具导出的 JSON（数组或 { messages: [...] }）
function tryParseJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const list = Array.isArray(data)
    ? data
    : data.messages || data.records || data.data || data.list;
  if (!Array.isArray(list) || !list.length) return null;

  const pick = (obj, keys) => {
    for (const k of keys) if (obj[k] != null && obj[k] !== '') return String(obj[k]);
    return '';
  };

  const out = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const sender = pick(item, ['sender', 'from', 'nickname', 'name', 'talker', 'userName', 'displayName']);
    const content = pick(item, ['content', 'text', 'msg', 'message', 'strContent']);
    if (!sender || !content) continue;
    out.push({
      timeStr: pick(item, ['time', 'timestamp', 'createTime', 'date', 'CreateTime']),
      sender,
      content,
      type: detectType(content),
    });
  }
  return out.length ? out : null;
}

export function parseChat(rawText) {
  const text = (rawText || '').trim();
  if (!text) return [];
  if (text.startsWith('[') || text.startsWith('{')) {
    const jsonMsgs = tryParseJson(text);
    if (jsonMsgs) return jsonMsgs;
  }
  return parseText(text);
}
