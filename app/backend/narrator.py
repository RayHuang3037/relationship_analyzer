import os
import json
from typing import Dict, Any
import urllib.request
import urllib.error

class LLMNarrator:
    """使用 GPT-4o 生成富有人味与幽默感的深层叙事文本（只负责说人话，不改变统计数据）"""

    SYSTEM_PROMPT = """你是一个幽默、敏锐且富有同理心的心理学关系观察员。
你的任务是根据传入的硬核统计数据与名场面，用极具人味儿、轻松且带点幽默/吐槽的口吻，为用户生成一份《微信关系诊断与说明书》。

请严格遵循以下规则：
1. 语言要接地气、轻松幽默、像朋友闲聊，切忌爹味教导和死板学术腔！
2. 严禁捏造数据或改变传入的任何统计百分比与标签代码。
3. 结合用户选择的关系模式（通用/死党/情侣），微调措辞语气（例如死党模式可以更损更搞笑，情侣模式可以更温馨吐槽）。
4. 始终保持‘安全边界’：分析的是‘对话中的互动模式’，绝对不给任何一方扣人格障碍标签（如NPD、精神病等）。

你需要输出 JSON 格式的叙事文本，包含以下键：
- overview_comment: 整体关系一句话爆笑总结（30字以内）
- detailed_analysis: 详细的互动吐槽与优势分析（150字左右）
- mbti_narrative: 两个人 MBTI 气场碰在一起的化学反应分析（100字左右）
- action_hack: 破局或让关系更有趣的实用小建议（2条短句）
"""

    @classmethod
    def generate_narrative(cls, l1_data: Dict[str, Any], l2_data: Dict[str, Any], api_key: str = None) -> Dict[str, Any]:
        api_key = api_key or os.getenv("OPENAI_API_KEY")

        # 兜底无 Key 情况下的高质量本地预制叙事
        if not api_key:
            return cls._fallback_narrative(l1_data, l2_data)

        # 构造给 LLM 的 prompt
        user_content = {
            "relationship_mode": l1_data.get("relationship_mode", "general"),
            "type_code": l2_data["relationship_type"]["code"],
            "type_name": l2_data["relationship_type"]["name"],
            "participants": l1_data.get("participants", []),
            "metrics": l1_data.get("metrics", {}),
            "quotes": l1_data.get("quotes_highlights", []),
            "mbti": {
                p: data["code"] for p, data in l2_data.get("mbti_profiles", {}).items()
            }
        }

        try:
            req_data = {
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": cls.SYSTEM_PROMPT},
                    {"role": "user", "content": json.dumps(user_content, ensure_ascii=False)}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.7
            }

            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=json.dumps(req_data).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
            )

            with urllib.request.urlopen(req, timeout=20) as response:
                res_body = json.loads(response.read().decode("utf-8"))
                content = res_body["choices"][0]["message"]["content"]
                return json.loads(content)

        except Exception as e:
            print(f"GPT-4o Call Failed: {e}, falling back to local template.")
            return cls._fallback_narrative(l1_data, l2_data)

    @classmethod
    def _fallback_narrative(cls, l1_data: Dict[str, Any], l2_data: Dict[str, Any]) -> Dict[str, Any]:
        type_info = l2_data["relationship_type"]
        participants = l1_data.get("participants", ["A", "B"])
        p_a, p_b = participants[0], participants[1]
        mode = l1_data.get("relationship_mode", "general")

        prefix = "你俩" if mode == "friends" else "二位"

        return {
            "overview_comment": f"{prefix}在微信里的互动简直就是‘{type_info['name']}’现场，充满戏剧张力！",
            "detailed_analysis": f"从聊天数据来看，{p_a} 和 {p_b} 的互动呈现出极具特色的{type_info['code']}模式。{type_info['desc']} 既有高度默契的名场面，也在某些沟通节点上保留着各自的小执念。",
            "mbti_narrative": f"{p_a} ({l2_data['mbti_profiles'][p_a]['code']}) 的语言风格与 {p_b} ({l2_data['mbti_profiles'][p_b]['code']}) 碰撞在一起，形成了非常奇妙的磁场，一个负责提供能量/想法，另一个负责收尾或反弹。",
            "action_hack": [
                type_info["hack"],
                "在情绪上头时，试着发一个搞笑表情包来给对话降温，效果立竿见影！"
            ]
        }
