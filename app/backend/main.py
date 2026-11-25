import os
import sys

# 允许从任意工作目录启动：python app/backend/main.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

from parser import ChatParser
from extractor import FeatureExtractor
from scorer import PersonalityScorer
from narrator import LLMNarrator

app = FastAPI(title="WeChat Personality & Relationship Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    raw_text: str
    relationship_mode: Optional[str] = "general" # general | friends | lovers
    api_key: Optional[str] = None

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend service is running normally."}

@app.post("/api/analyze")
def analyze_chat(req: AnalyzeRequest):
    if not req.raw_text or not req.raw_text.strip():
        raise HTTPException(status_code=400, detail="聊天记录内容不能为空。")

    # 1. 解析格式
    messages = ChatParser.parse_text(req.raw_text)
    if not messages:
        raise HTTPException(status_code=400, detail="未提取到有效对话，请检查格式是否包含‘名字: 内容’。")

    total_count = len(messages)
    
    # 2. 检查数据量要求
    if total_count < 10:
        raise HTTPException(
            status_code=400,
            detail=f"当前识别到 {total_count} 条对话。样本量过低（至少需要 10 条，建议 200 条以上）以确保分析可信度。"
        )

    # 3. L1 确定性特征提取
    l1_data = FeatureExtractor.analyze(messages, relationship_mode=req.relationship_mode)

    # 4. L2 评分与三轴/MBTI映射
    l2_data = PersonalityScorer.evaluate(l1_data)

    # 5. L3 LLM 叙事生成
    narrative = LLMNarrator.generate_narrative(l1_data, l2_data, api_key=req.api_key)

    # 评级建议
    confidence_level = "高" if total_count >= 200 else ("中" if total_count >= 50 else "低 (仅作参考)")

    return {
        "success": True,
        "sample_info": {
            "total_messages": total_count,
            "confidence_level": confidence_level
        },
        "l1_features": l1_data,
        "l2_scores": l2_data,
        "narrative": narrative
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
