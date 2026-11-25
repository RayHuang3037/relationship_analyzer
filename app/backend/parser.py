import re
import math
from datetime import datetime
from typing import List, Dict, Any, Tuple

class ChatParser:
    """解析各种格式的微信导出日志或粘贴文本"""
    
    @staticmethod
    def parse_text(raw_text: str) -> List[Dict[str, Any]]:
        lines = raw_text.strip().split('\n')
        messages = []
        
        # 常见正则模式
        # 1. 2023-10-01 12:30:45 张三: 消息
        pattern_full = re.compile(r'^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\s+([^:\n]+)[:：]\s*(.*)$')
        # 2. 12:30:45 张三: 消息 或 12:30 张三: 消息
        pattern_time_name = re.compile(r'^(\d{1,2}:\d{2}(?::\d{2})?)\s+([^:\n]+)[:：]\s*(.*)$')
        # 3. [2023-10-01 12:30:45] 张三: 消息
        pattern_bracket = re.compile(r'^\[?(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\s+\d{1,2}:\d{2}(?::\d{2})?)\]?\s+([^:\n]+)[:：]\s*(.*)$')
        # 4. 简易模式: 张三: 消息
        pattern_simple = re.compile(r'^([^:\n]{1,20})[:：]\s*(.*)$')

        current_msg = None

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            m = pattern_full.match(line_str) or pattern_bracket.match(line_str)
            if m:
                if current_msg:
                    messages.append(current_msg)
                current_msg = {
                    "time_str": m.group(1),
                    "sender": m.group(2).strip(),
                    "content": m.group(3).strip(),
                    "type": "text"
                }
                continue

            m2 = pattern_time_name.match(line_str)
            if m2:
                if current_msg:
                    messages.append(current_msg)
                current_msg = {
                    "time_str": m2.group(1),
                    "sender": m2.group(2).strip(),
                    "content": m2.group(3).strip(),
                    "type": "text"
                }
                continue

            m3 = pattern_simple.match(line_str)
            if m3 and not line_str.startswith("http") and len(m3.group(1)) <= 15:
                if current_msg:
                    messages.append(current_msg)
                current_msg = {
                    "time_str": "",
                    "sender": m3.group(1).strip(),
                    "content": m3.group(2).strip(),
                    "type": "text"
                }
                continue

            # 多行追加
            if current_msg:
                current_msg["content"] += "\n" + line_str

        if current_msg:
            messages.append(current_msg)

        # 过滤并标识特殊消息（表情包、语音、图片）
        for msg in messages:
            content = msg["content"]
            if "[动画表情]" in content or "[表情]" in content or "[Sticker]" in content:
                msg["type"] = "sticker"
            elif "[语音]" in content or "[Voice]" in content:
                msg["type"] = "voice"
            elif "[图片]" in content or "[Image]" in content:
                msg["type"] = "image"
            elif "[视频]" in content or "[Video]" in content:
                msg["type"] = "video"
            elif "[撤回一条消息]" in content:
                msg["type"] = "revoke"

        # 合并同人连续发送：需在 3 分钟窗口内，且时间格式一致，避免跨天消息被揉成一条
        merged_messages = []
        for msg in messages:
            if not merged_messages:
                merged_messages.append(msg)
                continue

            last = merged_messages[-1]
            t1 = ChatParser._parse_ts(last.get("time_str", ""))
            t2 = ChatParser._parse_ts(msg.get("time_str", ""))
            mergeable = (
                last["sender"] == msg["sender"]
                and last["type"] == msg["type"] == "text"
                and t1 and t2
                and t1[0] == t2[0]
                and 0 <= t2[1] - t1[1] <= 180
            )
            if mergeable:
                last["content"] += " / " + msg["content"]
            else:
                merged_messages.append(msg)

        return merged_messages

    @staticmethod
    def _parse_ts(time_str: str) -> Tuple[str, int]:
        """把时间串归一成 (类型, 秒数)，用于判断两条消息是否相邻。"""
        if not time_str:
            return None
        m = re.match(
            r'^(?:(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?$',
            time_str.strip(),
        )
        if not m:
            return None
        y, mo, d, h, mi, se = m.groups()
        if y:
            dt = datetime(int(y), int(mo), int(d), int(h), int(mi), int(se or 0))
            return ("date", int(dt.timestamp()))
        return ("clock", (int(h) * 60 + int(mi)) * 60 + int(se or 0))
