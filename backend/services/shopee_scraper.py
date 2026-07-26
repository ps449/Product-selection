import random
import time
import urllib.parse
import json
import statistics
import threading
import os
import platform
import glob

# Fix Playwright browser path for PyInstaller
os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "0"

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    pass

def get_playwright_executable():
    system = platform.system()
    if system == "Darwin":
        cache_dir = os.path.expanduser("~/Library/Caches/ms-playwright")
        if not os.path.exists(cache_dir): return None
        chromiums = glob.glob(os.path.join(cache_dir, "chromium-*"))
        if not chromiums: return None
        chromiums.sort(reverse=True)
        base = chromiums[0]
        arm_path = os.path.join(base, "chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing")
        if os.path.exists(arm_path): return arm_path
        x64_path = os.path.join(base, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium")
        if os.path.exists(x64_path): return x64_path
    elif system == "Windows":
        cache_dir = os.path.expanduser("~\\AppData\\Local\\ms-playwright")
        if not os.path.exists(cache_dir): return None
        chromiums = glob.glob(os.path.join(cache_dir, "chromium-*"))
        if not chromiums: return None
        chromiums.sort(reverse=True)
        base = chromiums[0]
        win_path = os.path.join(base, "chrome-win", "chrome.exe")
        if os.path.exists(win_path): return win_path
        win64_path = os.path.join(base, "chrome-win64", "chrome.exe")
        if os.path.exists(win64_path): return win64_path
    return None

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
            print(f"[ShopeeScraper] Launching Playwright to fetch {keyword}...")
            with sync_playwright() as p:
                # Use a persistent context so cookies and logins are saved (Not Incognito)
                user_data_dir = os.path.join(os.path.expanduser("~"), ".ShopeeAutoSelect_Profile")
                
                context = p.chromium.launch_persistent_context(
                    user_data_dir=user_data_dir,
                    executable_path=get_playwright_executable(),
                    headless=False,
                    args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    viewport={"width": 1280, "height": 800}
                )
                
                # launch_persistent_context already creates a default page, so use it
                page = context.pages[0] if context.pages else context.new_page()
                
                encoded_keyword = urllib.parse.quote(keyword)
                url = f"https://shopee.tw/search?keyword={encoded_keyword}"
                
                # Setup interceptor to catch the API response if it fires
                api_items = []
                def handle_response(response):
                    nonlocal api_items
                    if "search_items" in response.url and response.status == 200:
                        try:
                            data = response.json()
                            if "items" in data and len(data["items"]) > 0:
                                api_items = data["items"]
                                print(f"[ShopeeScraper] Intercepted API data with {len(api_items)} items!")
                        except:
                            pass
                
                page.on("response", handle_response)
                
                # Go to the page
                page.goto(url)
                
                # Wait for either API to be intercepted OR items to render in DOM
                try:
                    page.wait_for_selector('div[data-sqe="item"]', timeout=8000)
                except:
                    print("[ShopeeScraper] Waiting for items in DOM timed out. User might need to solve Captcha.")
                    # Wait longer just in case they are solving captcha
                    page.wait_for_timeout(10000)
                
                if api_items:
                    items = api_items
                else:
                    # Fallback to DOM extraction
                    print("[ShopeeScraper] Extracting from DOM...")
                    dom_items = page.evaluate('''() => {
                        const results = [];
                        document.querySelectorAll('div[data-sqe="item"]').forEach(el => {
                            const nameEl = el.querySelector('div[data-sqe="name"]');
                            const linkEl = el.querySelector('a[data-sqe="link"]');
                            
                            // Find element containing NT$
                            const textEls = el.querySelectorAll('div');
                            let price = 0;
                            let sales = 0;
                            
                            textEls.forEach(t => {
                                const text = t.innerText || "";
                                if (text.includes('NT$')) {
                                    const match = text.match(/NT\\$\\s*([0-9,]+)/);
                                    if (match) price = parseInt(match[1].replace(/,/g, ''));
                                }
                                if (text.includes('已售出')) {
                                    const match = text.match(/已售出\\s*([0-9.,]+)([萬k]?)/i);
                                    if (match) {
                                        let num = parseFloat(match[1].replace(/,/g, ''));
                                        if (match[2] === '萬' || match[2].toLowerCase() === 'k') num *= 10000;
                                        sales = parseInt(num);
                                    }
                                }
                            });
                            
                            let itemid = "";
                            let shopid = "";
                            if (linkEl && linkEl.href) {
                                const urlMatch = linkEl.href.match(/-i\\.(\\d+)\\.(\\d+)/);
                                if (urlMatch) {
                                    shopid = urlMatch[1];
                                    itemid = urlMatch[2];
                                }
                            }
                            
                            results.push({
                                item_basic: {
                                    name: nameEl ? nameEl.innerText : '',
                                    price: price * 100000, // adjust to shopee format
                                    historical_sold: sales,
                                    itemid: itemid,
                                    shopid: shopid
                                }
                            });
                        });
                        return results;
                    }''')
                    items = dom_items
                
                context.close()

                if items:
                    prices = []
                    raw_items = []
                    total_sales = 0
                    for item in items:
                        item_basic = item.get("item_basic", {})
                        price = item_basic.get("price", 0) / 100000
                        if price > 0:
                            prices.append(price)
                            
                        sales = item_basic.get("historical_sold", 0)
                        total_sales += sales
                        
                        itemid = item_basic.get("itemid")
                        shopid = item_basic.get("shopid")
                        name = item_basic.get("name", "")
                        
                        if itemid and shopid:
                            raw_items.append({
                                "name": name,
                                "price": price,
                                "sales": sales,
                                "link": f"https://shopee.tw/product/{shopid}/{itemid}"
                            })
                        
                    market_median_price = statistics.median(prices) if prices else 0
                    est_monthly_sales = int(total_sales / 12) if total_sales > 12 else total_sales
                    sales_score = min(99, int((total_sales / 3000) * 100 + 40))
                    search_score = min(95, int((total_sales / 2000) * 100 + 40))
                    
                    if len(prices) > 1:
                        price_stdev = statistics.stdev(prices)
                        cv = price_stdev / market_median_price if market_median_price > 0 else 0
                        comp_score = min(95, int((cv * 100) + 40))
                    else:
                        comp_score = 50
                        
                    return {
                        "success": True,
                        "keyword": keyword,
                        "category_id": category_id,
                        "market_median_price": int(market_median_price),
                        "estimated_sales_volume_monthly": est_monthly_sales,
                        "shopee_search_percentile_score": max(40, search_score),
                        "competition_percentile_score": max(30, comp_score),
                        "sales_percentile_score": max(50, sales_score),
                        "is_real_data": True,
                        "raw_prices": prices,
                        "total_sales": total_sales,
                        "raw_items": raw_items
                    }
        except Exception as e:
            print(f"[ShopeeScraper Warning] Playwright fetch failed ({e}).")
            return {"success": False, "error": f"蝦皮真實數據連線失敗 ({str(e)})。已關閉模擬數據功能，請稍後重試。"}
            
        return {"success": False, "error": "無法取得蝦皮商品列表（可能遇到防爬蟲）。已關閉模擬數據功能，請稍後重試或重新啟動。"}
