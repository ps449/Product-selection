def calculate_percentile_score(value, population):
    """
    Calculate the percentile score of a value within a given population list.
    Returns 0-100.
    """
    if not population:
        return 50.0
    count_below = sum(1 for v in population if v <= value)
    return (count_below / len(population)) * 100

def evaluate_product(
    product_cost, 
    market_median_price, 
    category,
    google_trend_score,
    shopee_search_score,
    sales_score,
    competition_score,
    social_score,
    scene_score,
    weights=None
):
    """
    Evaluates a product and calculates its final score and positioning based on the 0-100 scoring logic.
    """
    if weights is None:
        # Default weights from PRD
        weights = {
            "google_trend": 0.25,
            "shopee_search": 0.25,
            "sales": 0.15,
            "competition": 0.10,
            "social": 0.10,
            "scene": 0.15
        }

    # 1. Gross Margin Check (毛利門檻)
    # 預估毛利率 = (建議售價 − 商品成本 − 平台費用) ÷ 建議售價
    # 假設平台費用為 10%
    platform_fee = market_median_price * 0.10
    profit_margin = (market_median_price - product_cost - platform_fee) / market_median_price

    position = "不建議"
    
    if profit_margin >= 0.40:
        position = "毛利款 / 主力款"
    elif profit_margin >= 0.25:
        position = "引流款"
    else:
        # 未達門檻，直接降級，不繼續計分 (門檻制)
        return {
            "total_score": 0,
            "position": "不建議 (毛利率低於 25%)",
            "profit_margin_pct": round(profit_margin * 100, 2),
            "details": {}
        }

    # 2. Weighted Score Calculation
    total_score = (
        google_trend_score * weights["google_trend"] +
        shopee_search_score * weights["shopee_search"] +
        sales_score * weights["sales"] +
        competition_score * weights["competition"] +
        social_score * weights["social"] +
        scene_score * weights["scene"]
    )

    return {
        "total_score": round(total_score, 2),
        "position": position,
        "profit_margin_pct": round(profit_margin * 100, 2),
        "details": {
            "google_trend": google_trend_score,
            "shopee_search": shopee_search_score,
            "sales": sales_score,
            "competition": competition_score,
            "social": social_score,
            "scene": scene_score
        }
    }
