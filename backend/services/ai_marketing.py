import os
import json
import requests

def generate_marketing_assets(keyword: str, api_key: str = ""):
    """
    Calls Google Gemini REST API to generate marketing assets for the given product keyword.
    Returns a structured dictionary containing pain points, selling points, and copy.
    """
    if not api_key:
        return {
            "success": False,
            "error": "請先至後台設定 (AdminPanel) 填寫 Gemini API Key 以啟用此功能。"
        }
        
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        prompt = f"""
你是一位頂尖的電商行銷專家與大數據分析師。請針對台灣市場的電子商務商品：「{keyword}」，產生以下行銷素材與分析。

請務必只回傳合法的 JSON 字串 (不要使用 Markdown 代碼區塊如 ```json，直接回傳純 JSON)，其格式必須嚴格如下：

{{
  "pain_points": [
    "痛點1：描述消費者購買此類商品最常遇到的雷區或抱怨",
    "痛點2：...",
    "痛點3：..."
  ],
  "selling_points": [
    "賣點1：描述該商品能解決痛點的核心優勢",
    "賣點2：...",
    "賣點3：..."
  ],
  "fb_ad_copy": "這是專為 Facebook 廣告設計的投放文案，必須包含吸睛的開頭 (Hook)、痛點共鳴、解決方案、以及強烈的行動呼籲 (CTA)。請適當加入 Emoji 增加活潑感。文案長度適中，適合手機閱讀。",
  "shopee_desc": "這是專為蝦皮賣場設計的商品詳細描述，必須包含 SEO 友善的標題、條列式特色說明、使用情境、以及安心保證。排版要清晰易讀。"
}}

請確保所有的內容都以繁體中文撰寫，語氣要符合台灣電商消費者的習慣。
"""
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        headers = {"Content-Type": "application/json"}
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        resp_data = response.json()
        text_resp = resp_data["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        if text_resp.startswith("```json"):
            text_resp = text_resp.replace("```json", "", 1)
        if text_resp.endswith("```"):
            text_resp = text_resp[:text_resp.rfind("```")]
            
        parsed = json.loads(text_resp.strip())
        parsed["success"] = True
        return parsed
        
    except Exception as e:
        print(f"[AI Marketing Service] Gemini Error: {e}")
        return {
            "success": False,
            "error": f"AI 生成失敗，請檢查網路連線或 API Key 是否正確。({str(e)})"
        }
