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
    total_score = round(total_score, 2)

    # 3. AI Smart Comment Generation
    comments = []
    if total_score >= 80:
        comments.append("🌟 綜合評估極佳，具備爆款潛力！")
    elif total_score >= 60:
        comments.append("👍 市場反應良好，建議可小量測試。")
    else:
        comments.append("⚠️ 整體動能偏弱，進場需謹慎。")

    if google_trend_score >= 75:
        comments.append("📈 Google 搜尋趨勢顯著上升，市場需求正熱。")
    elif google_trend_score <= 30:
        comments.append("📉 Google 搜尋熱度低迷，可能處於淡季或需求衰退。")

    if competition_score >= 80:
        comments.append("⚔️ 競品與廣告投放數量多，市場競爭極度激烈，建議要有獨特賣點。")
    elif competition_score <= 40:
        comments.append("🟢 目前廣告競爭者較少，是一片藍海市場。")

    if sales_score >= 80:
        comments.append("🔥 電商平台實際銷量極高，消費者購買意願強。")

    if profit_margin >= 0.5:
        comments.append("💰 毛利率表現優異，有充足利潤空間可進行廣告投放。")

    ai_comment = " ".join(comments)

    return {
        "total_score": total_score,
        "position": position,
        "profit_margin_pct": round(profit_margin * 100, 2),
        "ai_comment": ai_comment,
        "details": {
            "google_trend": google_trend_score,
            "shopee_search": shopee_search_score,
            "sales": sales_score,
            "competition": competition_score,
            "social": social_score,
            "scene": scene_score
        }
    }
