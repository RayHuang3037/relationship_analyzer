from typing import Dict, Any, List

class PersonalityScorer:
    """结合 L1 确定性特征，映射三轴（A: 节奏, B: 修复, C: 通道）与关系八型 + MBTI 拟合"""

    # 八型字典与人性化吐槽解读
    TYPES_INFO = {
        "SRE": {
            "code": "SRE",
            "name": "废话合唱团 / 双胞胎机头",
            "tagline": "“你俩抛接梗比相声演员还顺，连废话都能接得满地都是。”",
            "desc": "双方节奏高度同步，起火也能自己灭。聊天框里充满了密集的互动和高频回应，哪怕吵架也能迅速递台阶并接住。",
            "loop": "一方发梗/提问 -> 另一方秒接并加码 -> 形成密集的快乐对话闭环",
            "hack": "继续保持这种双向奔赴的互动，但偶尔也要允许对方有独自冷静的空档。"
        },
        "SRT": {
            "code": "SRT",
            "name": "高效搭子 / 办事处打工人",
            "tagline": "“聊天框像任务交接窗口，极其高效，但情绪全在‘收到’之外。”",
            "desc": "极高的沟通效率与确定性，极少有情绪内耗。有事说事，互为最靠谱的执行搭档，但很少展现脆弱的情绪一面。",
            "loop": "一方抛出明确需求/议题 -> 另一方迅速确认并给出方案 -> 任务达成并结束对话",
            "hack": "尝试在办完正事后多发一个表情包或问一句‘今天累不累’，能让关系更有温度。"
        },
        "SFE": {
            "code": "SFE",
            "name": "相爱相杀 / 互怼终结者",
            "tagline": "“嘴上谁都不服谁，嘴硬心软，每次吵架都像在演年度大戏。”",
            "desc": "双方势均力敌且情绪张力极强。彼此都极其关注对方，但容易陷入‘争一口气’的胜负欲中，好在情绪表达直来直往。",
            "loop": "一方吐槽/试探 -> 另一方反击杠回去 -> 情绪升温爆吵 -> 消耗完精力后默契复原",
            "hack": "少说一句‘你又来了’，多说一句‘我刚才其实是着急’，能少走一半弯路。"
        },
        "SFT": {
            "code": "SFT",
            "name": "已读不回默契组 / 点赞之交",
            "tagline": "“礼貌、客气、有事说事，彼此的私人领域守得比安检还严。”",
            "desc": "节奏平稳但保持着安全的距离。彼此尊重个人边界，绝不越界询问，但也缺少深入灵魂的深度碰撞。",
            "loop": "客套问候/转发公事 -> 礼貌回复 -> 维持长期的平行线关系",
            "hack": "如果想拉近关系，不妨适度暴露一点点小烦恼，给对方一个支持你的机会。"
        },
        "PRE": {
            "code": "PRE",
            "name": "拉扯大师 / 橡皮筋组合",
            "tagline": "“一个满世界抓人，一个满世界溜达，神奇的是总能在边缘拉回来。”",
            "desc": "典型的一追一退动态，但退的一方并非冷血，只要追的一方触及边缘，退的一方就会积极回弹并修复关系。",
            "loop": "A 连发追问/共享生活 -> B 慢半拍回应 -> A 感到疏离加码 -> B 察觉后主动回弹哄好",
            "hack": "追的一方学会给自己放假，退的一方学会提前报备状态，橡皮筋才不容易弹伤人。"
        },
        "PRT": {
            "code": "PRT",
            "name": "乙方与甲方 / 话语权交易组",
            "tagline": "“一个负责发号施令/提案，一个负责条件谈判，平衡全靠情面交易。”",
            "desc": "话语权和节奏长期偏向一方。一方掌控着话题的走向与议程设置，另一方通过默许或协商来维持微妙的平衡。",
            "loop": "主导方发起议程/要求 -> 配合方评估并提条件 -> 双方达成妥协",
            "hack": "主导方要多问‘你觉得呢’，配合方也要敢于直接说出‘我其实想…’。"
        },
        "PFE": {
            "code": "PFE",
            "name": "弹幕组与隐身人 / 追逃捉迷藏",
            "tagline": "“一个消息连发像弹幕刷屏，一个回得像断网，越追门关得越紧。”",
            "desc": "最容易让人焦虑的关系模式。一紧一松的拉扯极具消耗性，追的人在焦虑中发弹幕，退的人在压迫感中选择关门筑墙。",
            "loop": "A 焦虑弹幕连发 -> B 感到窒息选择潜水/简短回复 -> A 破防质问 -> B 彻底筑墙沉默",
            "hack": "A 在连发第三条消息时请停手 20 分钟；B 实在累了请打一句‘在忙，今晚回你’而不是直接潜水。"
        },
        "PFT": {
            "code": "PFT",
            "name": "鸡同鸭讲 / 跨频对讲机",
            "tagline": "“都在热情发言，但各自在各自的宇宙里，居然也能聊上好几年。”",
            "desc": "节奏和语言频道双重错位。两个人都在说话，但对话的焦点经常擦肩而过，靠着某种奇特的惯性维持着联系。",
            "loop": "A 发送频道 X 的话题 -> B 回复频道 Y 的感悟 -> 双方自说自话但依然继续",
            "hack": "试着复述一遍对方刚才说的话（‘你意思是…对吧’），能瞬间打破跨频障碍。"
        }
    }

    @classmethod
    def evaluate(cls, l1_data: Dict[str, Any]) -> Dict[str, Any]:
        metrics = l1_data.get("metrics", {})
        stats = l1_data.get("stats", {})
        participants = l1_data.get("participants", ["A", "B"])

        p_a, p_b = participants[0], participants[1]

        # 1. Axis A: Rhythm Symmetry (S vs P)
        # 看发起率差值与平均句长差值
        init_diff = abs(metrics.get("initiation_ratio", {}).get(p_a, 50) - 50)
        axis_a = "S" if init_diff < 18 else "P"
        score_a_s = max(10, min(90, int(100 - init_diff * 2.2)))
        score_a_p = 100 - score_a_s

        # 2. Axis B: Repair Power (R vs F)
        repair_rate = metrics.get("repair_success_rate", 50)
        axis_b = "R" if repair_rate >= 40 else "F"
        score_b_r = int(repair_rate)
        score_b_f = 100 - score_b_r

        # 3. Axis C: Communication Channel (E vs T)
        # 表情/Emoji/感情词密度 vs 事实字数
        total_emojis = stats[p_a].get("emojis", 0) + stats[p_b].get("emojis", 0) + stats[p_a].get("stickers", 0) + stats[p_b].get("stickers", 0)
        total_msgs = l1_data.get("total_messages", 1)
        emoji_density = total_emojis / max(1, total_msgs)

        axis_c = "E" if emoji_density > 0.25 else "T"
        score_c_e = min(90, max(10, int(emoji_density * 180)))
        score_c_t = 100 - score_c_e

        # 组合代号
        code = f"{axis_a}{axis_b}{axis_c}"
        type_info = cls.TYPES_INFO.get(code, cls.TYPES_INFO["SRE"])

        # 拟合两人的 MBTI (基于语言线索：字数、问句、Emoji、修复词)
        mbti_a = cls._fit_mbti(stats[p_a])
        mbti_b = cls._fit_mbti(stats[p_b])

        return {
            "relationship_type": type_info,
            "axes": {
                "rhythm": {"label": "节奏对称度", "left": "S (同频)", "right": "P (追逃)", "score_left": score_a_s, "score_right": score_a_p},
                "repair": {"label": "关系修复力", "left": "R (自动修复)", "right": "F (摩擦累积)", "score_left": score_b_r, "score_right": score_b_f},
                "channel": {"label": "沟通表达通道", "left": "E (情绪/感知)", "right": "T (事务/理智)", "score_left": score_c_e, "score_right": score_c_t}
            },
            "mbti_profiles": {
                p_a: mbti_a,
                p_b: mbti_b
            }
        }

    @classmethod
    def _fit_mbti(cls, user_stat: Dict[str, Any]) -> Dict[str, Any]:
        total = max(1, user_stat.get("total_msgs", 1))
        avg_len = user_stat.get("total_chars", 0) / total
        questions = user_stat.get("questions", 0) / total
        emojis = user_stat.get("emojis", 0) / total
        repairs = user_stat.get("repairs", 0)

        # E/I: 消息数与发起度
        e_score = min(85, max(15, int(total * 0.8 + avg_len * 1.5)))
        # S/N: 标点与表情习惯
        s_score = min(85, max(15, int(emojis * 60 + 35)))
        # T/F: 修复与问句
        f_score = min(85, max(15, int(repairs * 15 + emojis * 40 + 20)))
        # J/P: 回复确定性
        j_score = min(85, max(15, int(avg_len * 2 + 30)))

        code_e_i = "E" if e_score >= 50 else "I"
        code_s_n = "S" if s_score >= 50 else "N"
        code_t_f = "F" if f_score >= 50 else "T"
        code_j_p = "J" if j_score >= 50 else "P"

        mbti_code = f"{code_e_i}{code_s_n}{code_t_f}{code_j_p}"

        # 简单的八功能栈参考
        functions_map = {
            "INFP": ["Fi (主导-内倾情感)", "Ne (辅助-外倾直觉)", "Si (第三-内倾感觉)", "Te (劣势-外倾思考)"],
            "ENFP": ["Ne (主导-外倾直觉)", "Fi (辅助-内倾情感)", "Te (第三-外倾思考)", "Si (劣势-内倾感觉)"],
            "INFJ": ["Ni (主导-内倾直觉)", "Fe (辅助-外倾情感)", "Ti (第三-内倾思考)", "Se (劣势-外倾感觉)"],
            "INTJ": ["Ni (主导-内倾直觉)", "Te (辅助-外倾思考)", "Fi (第三-内倾情感)", "Se (劣势-外倾感觉)"],
            "ENTP": ["Ne (主导-外倾直觉)", "Ti (辅助-内倾思考)", "Fe (第三-外倾情感)", "Si (劣势-内倾感觉)"],
            "ESTP": ["Se (主导-外倾感觉)", "Ti (辅助-内倾思考)", "Fe (第三-外倾情感)", "Ni (劣势-内倾直觉)"],
            "ISTJ": ["Si (主导-内倾感觉)", "Te (辅助-外倾思考)", "Fi (第三-内倾情感)", "Ne (劣势-外倾直觉)"],
            "ESFP": ["Se (主导-外倾感觉)", "Fi (辅助-内倾情感)", "Te (第三-外倾思考)", "Ni (劣势-内倾直觉)"]
        }

        default_stack = ["Fe (外倾情感)", "Ti (内倾思考)", "Ne (外倾直觉)", "Si (内倾感觉)"]
        stack = functions_map.get(mbti_code, default_stack)

        return {
            "code": mbti_code,
            "dimensions": [
                {"trait": "外向 (E) vs 内向 (I)", "code": code_e_i, "score": e_score if code_e_i == "E" else 100 - e_score},
                {"trait": "实感 (S) vs 直觉 (N)", "code": code_s_n, "score": s_score if code_s_n == "S" else 100 - s_score},
                {"trait": "思考 (T) vs 情感 (F)", "code": code_t_f, "score": f_score if code_t_f == "F" else 100 - f_score},
                {"trait": "判断 (J) vs 感知 (P)", "code": code_j_p, "score": j_score if code_j_p == "J" else 100 - j_score}
            ],
            "cognitive_stack": stack
        }
