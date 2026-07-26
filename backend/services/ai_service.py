import os
import json

# In a real scenario, this would use google.generativeai or openai SDK.
# For MVP, we provide a mock interface that simulates the LLM behavior.

def analyze_product_input(image_path: str = None, text_input: str = None):
    """
    Simulates calling an AI model (like Gemini Vision) to categorize the product.
    Returns a standardized dictionary.
    """
    # Mock logic based on keywords
    input_text = text_input.lower() if text_input else "雨衣" # default mock
    
    if "雨衣" in input_text:
        return {
            "product_name": "機車雨衣",
            "shopee_category": "機車/自行車 > 雨具",
            "confidence": 0.95,
            "keywords": ["雨衣", "機車雨衣", "兩件式雨衣"],
            "scene_extensions": ["雨鞋套", "安全帽鏡片防水貼", "防水背包"]
        }
    elif "滑雪" in input_text:
        return {
            "product_name": "滑雪機",
            "shopee_category": "戶外休閒 > 運動器材",
            "confidence": 0.90,
            "keywords": ["滑雪機", "室內滑雪", "核心訓練"],
            "scene_extensions": ["防滑墊", "運動毛巾", "護腕"]
        }
    else:
        # Confidence low, return suggestions
        return {
            "needs_disambiguation": True,
            "suggestions": [
                {
                    "product_name": text_input,
                    "shopee_category": "運動健身 > 健身器材",
                    "keywords": [text_input, "健身", "放鬆"],
                    "scene_extensions": ["瑜珈墊", "運動水壺", "護具"]
                },
                {
                    "product_name": text_input + "配件",
                    "shopee_category": "居家生活 > 日用品",
                    "keywords": [text_input, "收納袋", "清潔"],
                    "scene_extensions": ["收納盒", "清潔劑", "毛巾"]
                },
                {
                    "product_name": text_input,
                    "shopee_category": "其他 > 未分類商品",
                    "keywords": [text_input, "推薦商品"],
                    "scene_extensions": ["無"]
                }
            ]
        }
