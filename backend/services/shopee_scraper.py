"""
Market Scraper - PChome 24h Public API
Uses PChome's public search API (no login required, no captcha).
Data source: https://ecshweb.pchome.com.tw/search/v4.3/
"""
import statistics
import requests
import platform


class ShopeeScraper:
    """
    Market data scraper using PChome 24h public API.
    Note: Class name kept for API compatibility.
    """

    PCHOME_SEARCH_URL = "https://ecshweb.pchome.com.tw/search/v4.3/all/results"
    PCHOME_PROD_URL = "https://24h.pchome.com.tw/prod/{prod_id}"

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Accept-Language": "zh-TW,zh;q=0.9",
            "Referer": "https://24h.pchome.com.tw/",
        }

    def get_market_data(self, keyword: str, category_id: int = None):
        """
        Fetch real product data from PChome 24h public search API.
        Returns market analysis with prices, sales estimates, and product links.
        """
        print(f"[MarketScraper] Querying PChome for: {keyword}")
        try:
            all_prods = []
            for page in range(1, 4):  # Fetch up to 3 pages (60 products)
                resp = requests.get(
                    self.PCHOME_SEARCH_URL,
                    params={
                        "q": keyword,
                        "page": page,
                        "sort": "rnk/dc",  # sort by ranking
                    },
                    headers=self.headers,
                    timeout=10,
                )
                if resp.status_code != 200:
                    print(f"[MarketScraper] Page {page} returned {resp.status_code}")
                    break
                data = resp.json()
                prods = data.get("Prods", [])
                if not prods:
                    break
                all_prods.extend(prods)
                print(f"[MarketScraper] Page {page}: {len(prods)} products")

            if not all_prods:
                return {
                    "success": False,
                    "error": f"PChome 查無「{keyword}」相關商品，請嘗試其他關鍵字。",
                }

            # Build raw items list with links
            raw_items = []
            prices = []
            total_reviews = 0

            for p in all_prods:
                price = p.get("Price") or p.get("OriginPrice") or 0
                if not isinstance(price, (int, float)) or price <= 0:
                    continue

                prices.append(price)
                prod_id = p.get("Id", "")
                reviews = p.get("reviewCount") or 0
                total_reviews += reviews

                raw_items.append({
                    "name": p.get("Name", ""),
                    "price": price,
                    "sales": reviews * 3,  # estimate: 1 review ≈ 3 sales
                    "link": self.PCHOME_PROD_URL.format(prod_id=prod_id) if prod_id else "",
                    "reviews": reviews,
                })

            if not prices:
                return {
                    "success": False,
                    "error": f"PChome 找到商品但無法取得價格資訊，請嘗試其他關鍵字。",
                }

            print(f"[MarketScraper] Found {len(prices)} products with prices. Range: NT${min(prices)}-NT${max(prices)}")

            # Sort raw_items by reviews desc for top sellers
            raw_items.sort(key=lambda x: x["reviews"], reverse=True)

            # Calculate market stats
            median_price = statistics.median(prices)
            est_monthly_sales = max(total_reviews * 3, len(prices) * 5)
            
            sales_score = min(99, int((len(prices) / 60) * 100 + 40))
            search_score = min(95, int((total_reviews / 500) * 100 + 40))

            if len(prices) > 1:
                stdev = statistics.stdev(prices)
                cv = stdev / median_price if median_price > 0 else 0
                comp_score = min(95, int((cv * 100) + 40))
            else:
                comp_score = 50

            return {
                "success": True,
                "keyword": keyword,
                "category_id": category_id,
                "data_source": "PChome 24h",
                "market_median_price": int(median_price),
                "estimated_sales_volume_monthly": est_monthly_sales,
                "shopee_search_percentile_score": max(40, search_score),
                "competition_percentile_score": max(30, comp_score),
                "sales_percentile_score": max(50, sales_score),
                "is_real_data": True,
                "raw_prices": prices,
                "total_sales": est_monthly_sales,
                "raw_items": raw_items,
            }

        except requests.exceptions.Timeout:
            return {"success": False, "error": "查詢超時，請檢查網路連線後重試。"}
        except Exception as e:
            print(f"[MarketScraper] Error: {e}")
            return {"success": False, "error": f"市場數據查詢失敗：{str(e)}"}
