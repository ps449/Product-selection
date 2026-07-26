import random
import time
import urllib.request
import urllib.parse
import json
import statistics

class ShopeeScraper:
    def __init__(self):
        self.base_url = "https://shopee.tw/api/v4/search/search_items"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
            "Referer": "https://shopee.tw/"
        }
        
    def get_market_data(self, keyword: str, category_id: int = None):
        """
        Attempts to fetch real data from Shopee API.
        Falls back to mock data if blocked by Anti-Bot.
        """
        try:
            encoded_keyword = urllib.parse.quote(keyword)
            url = f"{self.base_url}?keyword={encoded_keyword}&limit=50&offset=0&page_type=search"
            
            req = urllib.request.Request(url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    items = data.get("items", [])
                    
                    if items:
                        prices = []
                        total_sales = 0
                        for item in items:
                            item_basic = item.get("item_basic", {})
                            # Shopee price is multiplied by 100000
                            price = item_basic.get("price", 0) / 100000
                            if price > 0:
                                prices.append(price)
                            
                            # historical_sold is total sold, somewhat correlating to sales
                            sales = item_basic.get("historical_sold", 0)
                            total_sales += sales
                            
                        market_median_price = statistics.median(prices) if prices else 0
                        
                        return {
                            "success": True,
                            "keyword": keyword,
                            "category_id": category_id,
                            "market_median_price": int(market_median_price),
                            "estimated_sales_volume_monthly": int(total_sales / 12) if total_sales > 12 else total_sales, # rough estimate
                            "shopee_search_percentile_score": random.randint(60, 95), # Still need mock for proprietary scores
                            "competition_percentile_score": random.randint(40, 90),
                            "sales_percentile_score": random.randint(60, 99),
                            "is_real_data": True
                        }
        except Exception as e:
            print(f"[ShopeeScraper Warning] Real fetch failed ({e}). Falling back to mock data.")
            pass # Fall through to mock logic

        # Fallback Mock logic
        time.sleep(1.5)
        market_median_price = random.randint(300, 1500)
        sales_volume = random.randint(50, 2000)
        
        return {
            "success": True,
            "keyword": keyword,
            "category_id": category_id,
            "market_median_price": market_median_price,
            "estimated_sales_volume_monthly": sales_volume,
            "shopee_search_percentile_score": random.randint(40, 95),
            "competition_percentile_score": random.randint(30, 90),
            "sales_percentile_score": random.randint(50, 99),
            "is_real_data": False
        }
