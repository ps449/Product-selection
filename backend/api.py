from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict

from services.ai_service import analyze_product_input
from services.trends_service import TrendsService
from services.shopee_scraper import ShopeeScraper
from core.scoring import evaluate_product

# CSV DB removed

router = APIRouter()

trends_service = TrendsService()
scraper = ShopeeScraper()

# --- Schemas ---
class AnalyzeRequest(BaseModel):
    text_input: Optional[str] = None
    image_data: Optional[str] = None # base64 in real app

class AnalyzeResponse(BaseModel):
    needs_disambiguation: bool = False
    suggestions: Optional[list[dict]] = None
    product_name: Optional[str] = None
    shopee_category: Optional[str] = None
    confidence: Optional[float] = None
    keywords: Optional[list[str]] = None
    scene_extensions: Optional[list[str]] = None

class EvaluateResponse(BaseModel):
    evaluation: dict
    three_analyses: dict
    is_real_data: bool = False

class EvaluateRequest(BaseModel):
    keyword: str
    category_id: Optional[int] = None
    product_cost: float
    social_score: float = 50.0  # Default or manual input for MVP
    scene_score: float = 50.0   # Default or calculated based on scene_extensions

# Global in-memory settings for MVP (Phase 1)
# In Phase 2 this will be stored in SQLite
admin_settings = {
    "weights": {
        "google_trend": 0.25,
        "shopee_search": 0.25,
        "sales": 0.15,
        "competition": 0.10,
        "social": 0.10,
        "scene": 0.15
    }
}

# --- Endpoints ---

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_input(req: AnalyzeRequest):
    result = analyze_product_input(text_input=req.text_input)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/evaluate")
def evaluate_target(req: EvaluateRequest):
    # 1. Fetch Shopee Data
    market_data = scraper.get_market_data(req.keyword, req.category_id)
    
    # 2. Fetch Google Trends Data
    trend_data = trends_service.get_trend_score(req.keyword)
    
    # 3. Score
    score_result = evaluate_product(
        product_cost=req.product_cost,
        market_median_price=market_data["market_median_price"],
        category="mock_category",
        google_trend_score=trend_data.get("percentile_score", 50),
        shopee_search_score=market_data.get("shopee_search_percentile_score", 50),
        sales_score=market_data.get("sales_percentile_score", 50),
        competition_score=market_data.get("competition_percentile_score", 50),
        social_score=req.social_score,
        scene_score=req.scene_score,
        weights=admin_settings["weights"]
    )
    
    # 4. Mock Data for Three Major Analyses
    three_analyses = {
        "search_data": [
            {"month": "前月", "volume": 12000},
            {"month": "本月", "volume": 18500}
        ],
        "sales_data": [
            {"name": "市場均月銷量", "value": 3200},
            {"name": "Top 1 競品月銷量", "value": 8500}
        ],
        "pricing_data": [
            {"price": 100, "sales": 1500},
            {"price": 150, "sales": 3200},
            {"price": 200, "sales": 2800},
            {"price": 250, "sales": 1100},
            {"price": 300, "sales": 400},
            {"price": 350, "sales": 150},
        ]
    }
    
    # 5. Check if data is real
    is_real = market_data.get("is_real_data", False) or trend_data.get("is_real_data", False)

    return {
        "evaluation": score_result,
        "three_analyses": three_analyses,
        "is_real_data": is_real
    }

@router.get("/settings")
def get_settings():
    return admin_settings

@router.post("/settings")
def update_settings(new_weights: dict):
    admin_settings["weights"] = new_weights
    return {"status": "success", "settings": admin_settings}

@router.get("/discovery")
def get_discovery(category: str = 'social'):
    # Mock data based on the slide's "5 entry points"
    if category == 'crowdfunding':
        return {
            "columns": ["排名", "商品名稱", "募資平台", "募資進度", "贊助人數"],
            "items": [
                {"rank": 1, "product_name": "多功能折疊推車", "col3": "嘖嘖 Zeczec", "col4": "1250%", "col5": "3,200人"},
                {"rank": 2, "product_name": "人體工學午睡枕", "col3": "FlyingV", "col4": "800%", "col5": "1,500人"},
                {"rank": 3, "product_name": "模組化收納背包", "col3": "嘖嘖 Zeczec", "col4": "640%", "col5": "980人"},
            ]
        }
    elif category == 'disadvantage':
        return {
            "columns": ["排名", "商品名稱", "月銷量", "平均星級", "常見負評關鍵字"],
            "items": [
                {"rank": 1, "product_name": "平價吹風機", "col3": "4,500", "col4": "3.1星", "col5": "過熱、聲音大、線太短"},
                {"rank": 2, "product_name": "便宜手機架", "col3": "6,200", "col4": "3.3星", "col5": "易斷、夾不緊、震動"},
                {"rank": 3, "product_name": "拋棄式雨衣", "col3": "12,000", "col4": "3.5星", "col5": "太薄、易破、有異味"},
            ]
        }
    elif category == 'platform':
        return trends_service.get_trending_shopping_keywords()
    elif category == 'fixed':
        return {
            "columns": ["排名", "商品名稱", "消耗速度", "回購週期", "重點優勢"],
            "items": [
                {"rank": 1, "product_name": "純水濕紙巾", "col3": "極快", "col4": "1-2週", "col5": "拚供應鏈成本"},
                {"rank": 2, "product_name": "廚房清潔劑", "col3": "快", "col4": "1個月", "col5": "拚配方效果"},
                {"rank": 3, "product_name": "洗衣球", "col3": "極快", "col4": "2-3週", "col5": "拚香味與價格"},
            ]
        }
    else: # social
        return {
            "columns": ["排名", "商品名稱", "6月份搜尋量", "7月份搜尋量", "提升量"],
            "items": [
                {"rank": 1, "product_name": "雨衣", "col3": "440,409", "col4": "1,271,762", "col5": "+831,353"},
                {"rank": 2, "product_name": "雨傘", "col3": "217,709", "col4": "586,609", "col5": "+368,900"},
                {"rank": 3, "product_name": "雨鞋", "col3": "106,312", "col4": "296,082", "col5": "+189,770"},
                {"rank": 4, "product_name": "拖鞋", "col3": "430,474", "col4": "603,501", "col5": "+173,027"},
                {"rank": 5, "product_name": "洞洞鞋", "col3": "200,343", "col4": "362,710", "col5": "+162,367"},
            ]
        }

