import re
import math
from typing import List, Dict, Any

class FeatureExtractor:
    """从结构化消息列表中提取 L1 确定性特征与真实名场面句式"""

    CRITICISM_WORDS = ["总是", "从来不", "每次都", "你又", "凭什么", "为什么你老是", "怎么又"]
    DEFENSIVENESS_WORDS = ["但是", "可是", "明明是", "那我也", "我又没有", "随便你吧", "算了吧"]
    CONTEMPT_WORDS = ["呵呵", "搞笑", "无语", "神经", "脑残", "懒得理你", "随你便", "你开心就好"]
    REPAIR_WORDS = ["抱歉", "对不起", "我的错", "别生气啦", "喝水", "给你买", "摸摸", "好啦", "原谅我", "错啦"]
    
    EMOJI_PATTERN = re.compile(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F700-\U0001F77F\[[^\]]+\]]')

    @classmethod
    def analyze(cls, messages: List[Dict[str, Any]], relationship_mode: str = "general") -> Dict[str, Any]:
        if not messages:
            return {}

        # 获取参与者
        senders = list(dict.fromkeys(m["sender"] for m in messages))
        if len(senders) < 2:
            sender_a = senders[0] if senders else "A"
            sender_b = "B"
        else:
            sender_a, sender_b = senders[0], senders[1]

        stats = {
            sender_a: {"total_msgs": 0, "total_chars": 0, "questions": 0, "emojis": 0, "stickers": 0, "voices": 0, "criticisms": 0, "repairs": 0, "defensiveness": 0},
            sender_b: {"total_msgs": 0, "total_chars": 0, "questions": 0, "emojis": 0, "stickers": 0, "voices": 0, "criticisms": 0, "repairs": 0, "defensiveness": 0}
        }

        quotes_highlights = []

        for i, m in enumerate(messages):
            s = m["sender"]
            if s not in stats:
                stats[s] = {"total_msgs": 0, "total_chars": 0, "questions": 0, "emojis": 0, "stickers": 0, "voices": 0, "criticisms": 0, "repairs": 0, "defensiveness": 0}
            
            c = m["content"]
            t = m.get("type", "text")

            stats[s]["total_msgs"] += 1
            stats[s]["total_chars"] += len(c)

            if t == "sticker":
                stats[s]["stickers"] += 1
            elif t == "voice":
                stats[s]["voices"] += 1

            # 问句判断
            if "?" in c or "？" in c or c.endswith("吗") or c.endswith("呢"):
                stats[s]["questions"] += 1

            # Emoji
            emojis = cls.EMOJI_PATTERN.findall(c)
            stats[s]["emojis"] += len(emojis)

            # 关键词捕获与名场面收集
            for kw in cls.CRITICISM_WORDS:
                if kw in c:
                    stats[s]["criticisms"] += 1
                    if len(quotes_highlights) < 8 and len(c) < 50:
                        quotes_highlights.append({"type": "criticism", "sender": s, "text": c})
                    break

            for kw in cls.DEFENSIVENESS_WORDS + cls.CONTEMPT_WORDS:
                if kw in c:
                    stats[s]["defensiveness"] += 1
                    if len(quotes_highlights) < 8 and len(c) < 50:
                        quotes_highlights.append({"type": "defensiveness", "sender": s, "text": c})
                    break

            for kw in cls.REPAIR_WORDS:
                if kw in c:
                    stats[s]["repairs"] += 1
                    if len(quotes_highlights) < 8 and len(c) < 50:
                        quotes_highlights.append({"type": "repair", "sender": s, "text": c})
                    break

        total_msgs = len(messages)
        msgs_a = stats[sender_a]["total_msgs"]
        msgs_b = stats[sender_b]["total_msgs"]

        # 发起率 / 话瘾比例
        initiation_ratio_a = round((msgs_a / total_msgs) * 100, 1) if total_msgs > 0 else 50
        initiation_ratio_b = round(100 - initiation_ratio_a, 1)

        # 平均句长
        avg_len_a = round(stats[sender_a]["total_chars"] / max(1, msgs_a), 1)
        avg_len_b = round(stats[sender_b]["total_chars"] / max(1, msgs_b), 1)

        # 修复率与防卫率
        total_repairs = stats[sender_a]["repairs"] + stats[sender_b]["repairs"]
        total_conflicts = stats[sender_a]["criticisms"] + stats[sender_b]["criticisms"] + stats[sender_a]["defensiveness"] + stats[sender_b]["defensiveness"]

        repair_success_rate = round((total_repairs / max(1, total_conflicts)) * 100, 1)
        repair_success_rate = min(100.0, repair_success_rate)

        return {
            "participants": [sender_a, sender_b],
            "total_messages": total_msgs,
            "relationship_mode": relationship_mode,
            "stats": stats,
            "metrics": {
                "initiation_ratio": {sender_a: initiation_ratio_a, sender_b: initiation_ratio_b},
                "avg_msg_length": {sender_a: avg_len_a, sender_b: avg_len_b},
                "repair_success_rate": repair_success_rate,
                "conflict_count": total_conflicts,
                "repair_count": total_repairs
            },
            "quotes_highlights": quotes_highlights[:5]
        }
