"""
Facebook Ads Library Service
Uses Meta Graph API to query active ads in Taiwan as a market competition signal.
Requires: ads_library permission on the App (apply at facebook.com/ads/library/api)
"""
import requests
import time


class FBAdsService:
    GRAPH_URL = "https://graph.facebook.com/v20.0/ads_archive"

    def __init__(self, access_token: str = ""):
        self.access_token = access_token

    def set_token(self, token: str):
        self.access_token = token

    def get_ad_competition_data(self, keyword: str) -> dict:
        """
        Query FB Ads Library for ads in Taiwan related to keyword.
        Returns:
          - ad_count: total active ads found
          - advertiser_count: unique pages/brands advertising
          - competition_score: 0-100 (more ads = higher competition)
          - top_advertisers: top 5 page names
          - sample_ads: list of ad snippets for reference
        """
        if not self.access_token:
            return {"success": False, "error": "尚未設定 Facebook Access Token", "ad_count": 0}

        try:
            resp = requests.get(
                self.GRAPH_URL,
                params={
                    "access_token": self.access_token,
                    "search_terms": keyword,
                    "ad_reached_countries": "TW",
                    "ad_type": "ALL",
                    "ad_active_status": "ACTIVE",
                    "limit": 100,
                    "fields": "id,page_name,ad_creative_bodies,ad_delivery_start_time,impressions,spend",
                },
                timeout=15,
            )

            data = resp.json()

            if "error" in data:
                err = data["error"]
                code = err.get("code", 0)
                msg = err.get("message", "")

                # Permission not yet granted
                if code == 10 or "permission" in msg.lower():
                    return {
                        "success": False,
                        "error": "尚未取得 ads_library 權限，請前往 facebook.com/ads/library/api 申請",
                        "ad_count": 0,
                        "needs_permission": True,
                    }
                return {"success": False, "error": msg, "ad_count": 0}

            ads = data.get("data", [])
            total = len(ads)

            # Get next pages up to 300 ads for better signal
            next_cursor = data.get("paging", {}).get("cursors", {}).get("after")
            if next_cursor and total < 300:
                for _ in range(2):
                    try:
                        resp2 = requests.get(
                            self.GRAPH_URL,
                            params={
                                "access_token": self.access_token,
                                "search_terms": keyword,
                                "ad_reached_countries": "TW",
                                "ad_type": "ALL",
                                "ad_active_status": "ACTIVE",
                                "limit": 100,
                                "after": next_cursor,
                                "fields": "id,page_name,ad_creative_bodies,impressions",
                            },
                            timeout=15,
                        )
                        d2 = resp2.json()
                        page_ads = d2.get("data", [])
                        ads.extend(page_ads)
                        next_cursor = d2.get("paging", {}).get("cursors", {}).get("after")
                        if not page_ads or not next_cursor:
                            break
                        time.sleep(0.5)
                    except Exception:
                        break

            total = len(ads)

            # Count unique advertisers
            pages = {}
            for ad in ads:
                page = ad.get("page_name", "Unknown")
                pages[page] = pages.get(page, 0) + 1

            top_advertisers = sorted(pages.items(), key=lambda x: x[1], reverse=True)[:5]

            # Competition score: log scale, 0 ads = 20, 100+ ads = 80, 500+ = 95
            if total == 0:
                competition_score = 20
            elif total < 10:
                competition_score = 35
            elif total < 50:
                competition_score = 55
            elif total < 100:
                competition_score = 70
            elif total < 300:
                competition_score = 82
            else:
                competition_score = 95

            # Sample ad bodies
            sample_ads = []
            for ad in ads[:5]:
                bodies = ad.get("ad_creative_bodies", [])
                if bodies:
                    sample_ads.append({
                        "page": ad.get("page_name", ""),
                        "text": bodies[0][:80] if bodies[0] else "",
                    })

            return {
                "success": True,
                "keyword": keyword,
                "ad_count": total,
                "advertiser_count": len(pages),
                "competition_score": competition_score,
                "top_advertisers": [{"name": k, "ad_count": v} for k, v in top_advertisers],
                "sample_ads": sample_ads,
                "source": "Facebook Ads Library (TW)",
            }

        except requests.exceptions.Timeout:
            return {"success": False, "error": "Facebook API 連線逾時", "ad_count": 0}
        except Exception as e:
            return {"success": False, "error": str(e), "ad_count": 0}
