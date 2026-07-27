import os
import json
import base64
import requests

def analyze_product_input(image_path: str = None, text_input: str = None, image_data: str = None, api_key: str = ""):
    """
    Calls Google Gemini REST API to categorize the product.
    Returns a standardized dictionary.
    """
    input_text = text_input.strip() if text_input else ""
    
    if not api_key:
        # Fallback if no API key is provided: Just return the input
        name = input_text if input_text else "未知商品"
        return {
            "product_name": name,
            "shopee_category": "綜合分類",
            "confidence": 0.99,
            "keywords": [name],
            "scene_extensions": ["無"]
        }
        
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        prompt = f"""
You are an e-commerce product analysis AI. Your task is to extract product info for Taiwan market.
User Input Keyword: "{input_text}"

Return ONLY a valid JSON string (no markdown formatting, no code blocks, just raw JSON).
The JSON MUST strictly follow this structure:
{{
  "product_name": "Core product name string",
  "shopee_category": "Shopee TW category (e.g., 居家生活 > 日用品)",
  "confidence": 0.95,
  "keywords": ["EXACTLY_WHAT_USER_TYPED_NO_ADDITIONS"],
  "scene_extensions": ["3 related products for upselling"]
}}

CRITICAL INSTRUCTION:
For `keywords`, you MUST ONLY return the exact keyword the user typed in the `User Input Keyword`. Do NOT add any extra descriptive keywords like "健身", "放鬆", etc. If the user typed "機車夾克", `keywords` must be `["機車夾克"]`. This is to prevent search keyword pollution.
"""
        parts = []
        if image_data:
            # Handle base64 image (format usually data:image/jpeg;base64,.....)
            mime_type = "image/jpeg"
            img_b64 = image_data
            if ',' in image_data:
                header, img_b64 = image_data.split(',', 1)
                if 'data:' in header and ';' in header:
                    mime_type = header.replace('data:', '').split(';')[0]
            
            parts.append({
                "inline_data": {
                    "mime_type": mime_type,
                    "data": img_b64
                }
            })
            prompt += "\\nSince an image is provided, identify the main product in the image and use it as `product_name` and `keywords`."
            
        parts.append({"text": prompt})
        
        payload = {
            "contents": [{
                "parts": parts
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
        
        # Enforce rule: if text_input was provided, ensure keywords strictly matches text_input
        if input_text and not image_data:
            parsed["keywords"] = [input_text]
            
        return parsed
        
    except Exception as e:
        print(f"[AI Service] Gemini Error: {e}")
        # Fallback on error
        name = input_text if input_text else "未知商品"
        return {
            "product_name": name,
            "shopee_category": "綜合分類",
            "confidence": 0.99,
            "keywords": [name],
            "scene_extensions": ["無"]
        }
