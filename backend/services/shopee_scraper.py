"""
Shopee Scraper - Playwright with homepage-first cookie injection
Key insight: visit homepage BEFORE injecting cookies to avoid captcha.
Uses --headless=new to stay invisible while using full Chromium.
"""
import urllib.parse
import statistics
import platform
import time
import glob
import os

os.environ["PLAYWRIGHT_BROWSERS_PATH"] = "0"

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    pass

try:
    import browser_cookie3
    _BROWSER_COOKIE3 = True
except ImportError:
    _BROWSER_COOKIE3 = False

def _get_playwright_exe():
    system = platform.system()
    # Check ms-playwright system cache first (populated by startup)
    if system == "Darwin":
        for base_dir in [
            os.path.expanduser("~/Library/Caches/ms-playwright"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "playwright_browsers"),
        ]:
            if not os.path.exists(base_dir): continue
            chromiums = sorted(glob.glob(os.path.join(base_dir, "chromium-*")), reverse=True)
            if not chromiums: continue
            base = chromiums[0]
            arm = os.path.join(base, "chrome-mac-arm64", "Google Chrome for Testing.app", "Contents", "MacOS", "Google Chrome for Testing")
            if os.path.exists(arm): return arm
            x64 = os.path.join(base, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium")
            if os.path.exists(x64): return x64
    elif system == "Windows":
        for base_dir in [
            os.path.expanduser("~\\AppData\\Local\\ms-playwright"),
        ]:
            if not os.path.exists(base_dir): continue
            chromiums = sorted(glob.glob(os.path.join(base_dir, "chromium-*")), reverse=True)
            if not chromiums: continue
            base = chromiums[0]
            for rel in ["chrome-win\\chrome.exe", "chrome-win64\\chrome.exe"]:
                p = os.path.join(base, rel)
                if os.path.exists(p): return p
    return None

def _get_system_cookies():
    if not _BROWSER_COOKIE3:
        return []
    try:
        cj = browser_cookie3.chrome(domain_name='shopee.tw')
        return [{"name": c.name, "value": c.value, "domain": c.domain, "path": c.path, "secure": bool(c.secure)} for c in cj]
    except Exception as e:
        print(f"[ShopeeScraper] Chrome cookies failed: {e}")
    try:
        cj = browser_cookie3.firefox(domain_name='shopee.tw')
        return [{"name": c.name, "value": c.value, "domain": c.domain, "path": c.path, "secure": bool(c.secure)} for c in cj]
    except Exception as e:
        print(f"[ShopeeScraper] Firefox cookies failed: {e}")
    return []

def _get_ua():
    system = platform.system()
    if system == "Darwin":
        return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


class ShopeeScraper:
    def __init__(self):
        self.search_url = "https://shopee.tw/api/v4/search/search_items"

    def get_market_data(self, keyword: str, category_id: int = None):
        """Fetch real Shopee data using Playwright with cookie injection."""
        print(f"[ShopeeScraper] Fetching: {keyword}")
        try:
            with sync_playwright() as p:
                exe = _get_playwright_exe()
                launch_args = {"headless": False, "args": ["--headless=new", "--no-sandbox", "--disable-blink-features=AutomationControlled"]}
                if exe:
                    launch_args["executable_path"] = exe
                    print(f"[ShopeeScraper] Using exe: {exe[-60:]}")
                
                browser = p.chromium.launch(**launch_args)
                context = browser.new_context(user_agent=_get_ua(), locale="zh-TW")

                # STEP 1: Visit homepage first (prevents captcha)
                page = context.new_page()
                page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
                page.goto("https://shopee.tw/")
                time.sleep(2)

                # STEP 2: Inject cookies AFTER homepage visit
                cookies = _get_system_cookies()
                if cookies:
                    context.add_cookies(cookies)
                    print(f"[ShopeeScraper] Injected {len(cookies)} system cookies.")

                # STEP 3: Intercept search API
                api_items = []
                def handle_response(response):
                    nonlocal api_items
                    if "search_items" in response.url and response.status == 200:
                        try:
                            data = response.json()
                            if "items" in data and data["items"]:
                                api_items = data["items"]
                                print(f"[ShopeeScraper] Intercepted {len(api_items)} items from API!")
                        except:
                            pass
                page.on("response", handle_response)

                # STEP 4: Navigate to search
                encoded = urllib.parse.quote(keyword)
                page.goto(f"https://shopee.tw/search?keyword={encoded}")
                time.sleep(8)  # Wait for SPA to load and API to fire

                # STEP 5: Use intercepted data, or fall back to DOM scraping
                items = api_items
                if not items:
                    print("[ShopeeScraper] API not intercepted, falling back to DOM extraction...")
                    try:
                        dom_items = page.evaluate('''() => {
                            const results = [];
                            document.querySelectorAll('div[data-sqe="item"]').forEach(el => {
                                const nameEl = el.querySelector('div[data-sqe="name"]');
                                const linkEl = el.querySelector('a[data-sqe="link"]');
                                let price = 0, sales = 0;
                                el.querySelectorAll('div').forEach(t => {
                                    const text = t.innerText || "";
                                    if (text.includes("NT$")) {
                                        const m = text.match(/NT\\$\\s*([0-9,]+)/);
                                        if (m) price = parseInt(m[1].replace(/,/g,""));
                                    }
                                    if (text.includes("已售出")) {
                                        const m = text.match(/已售出\\s*([0-9.,]+)([萬k]?)/i);
                                        if (m) {
                                            let n = parseFloat(m[1].replace(/,/g,""));
                                            if (m[2]==="萬"||m[2].toLowerCase()==="k") n*=10000;
                                            sales=parseInt(n);
                                        }
                                    }
                                });
                                let itemid="", shopid="";
                                if (linkEl && linkEl.href) {
                                    const u = linkEl.href.match(/-i\\.(\\d+)\\.(\\d+)/);
                                    if (u) { shopid=u[1]; itemid=u[2]; }
                                }
                                results.push({item_basic:{name:nameEl?nameEl.innerText:"",price:price*100000,historical_sold:sales,itemid,shopid}});
                            });
                            return results;
                        }''')
                        items = dom_items
                        print(f"[ShopeeScraper] DOM extracted {len(items)} items.")
                    except Exception as de:
                        print(f"[ShopeeScraper] DOM extraction failed: {de}")

                browser.close()

                if not items:
                    return {"success": False, "error": "無法取得蝦皮搜尋結果，請確認已在 Chrome 瀏覽器登入蝦皮帳號後再試一次。"}

                prices, raw_items, total_sales = [], [], 0
                for item in items:
                    ib = item.get("item_basic", {})
                    price = ib.get("price", 0) / 100000
                    if price > 0: prices.append(price)
                    sales = ib.get("historical_sold", 0)
                    total_sales += sales
                    itemid, shopid, name = ib.get("itemid"), ib.get("shopid"), ib.get("name", "")
                    if itemid and shopid:
                        raw_items.append({"name": name, "price": price, "sales": sales, "link": f"https://shopee.tw/product/{shopid}/{itemid}"})

                median_price = statistics.median(prices) if prices else 0
                est_monthly = int(total_sales / 12) if total_sales > 12 else total_sales
                sales_score = min(99, int((total_sales / 3000) * 100 + 40))
                search_score = min(95, int((total_sales / 2000) * 100 + 40))
                if len(prices) > 1:
                    stdev = statistics.stdev(prices)
                    cv = stdev / median_price if median_price > 0 else 0
                    comp_score = min(95, int((cv * 100) + 40))
                else:
                    comp_score = 50

                return {
                    "success": True, "keyword": keyword, "category_id": category_id,
                    "market_median_price": int(median_price),
                    "estimated_sales_volume_monthly": est_monthly,
                    "shopee_search_percentile_score": max(40, search_score),
                    "competition_percentile_score": max(30, comp_score),
                    "sales_percentile_score": max(50, sales_score),
                    "is_real_data": True, "raw_prices": prices,
                    "total_sales": total_sales, "raw_items": raw_items
                }
        except Exception as e:
            print(f"[ShopeeScraper] Error: {e}")
            return {"success": False, "error": f"蝦皮數據擷取失敗：{str(e)}"}
