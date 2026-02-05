
import logging
from urllib.parse import urlparse
from app.services.registry import BRANDS, STORES, CLEAN_BEAUTY_BRANDS, POPULAR_STORE_DOMAINS

logger = logging.getLogger(__name__)

class TrustService:
    def __init__(self):
        pass

    def enrich_result(self, item: dict, brand_context: str = None) -> dict:
        """
        Enriches a search result item with trust tags:
        - is_official: True if url matches brand's official domain
        - is_popular: True if url is from a popular marketplace
        - is_clean_beauty: True if brand is trusted clean beauty
        - is_excluded: True if item seems to be a Tester/Sample
        """
        url = item.get("merchant_url") or item.get("url")
        if not url:
            return item

        try:
            parsed = urlparse(url)
            host = parsed.netloc.lower()
            if host.startswith("www."):
                host = host[4:]
            
            # 1. Store Tier (Popular Marketplace)
            if host in POPULAR_STORE_DOMAINS:
                item["is_popular"] = True
                
                # Check specifics
                for store in STORES:
                    if host in store["domains"]:
                        item["store_name"] = store["display_name"]
                        item["store_tier"] = store["tier"]
                        break
            
            # 2. Official Brand Check
            # We need to know WHICH brand this item belongs to.
            # If brand_context is provided (from query analysis), use it.
            # Otherwise, try to guess from title.
            
            detected_brand_id = None
            
            # Try to match brand from Title first (high confidence if brand is unique name like "Old School Rituals")
            title_lower = (item.get("title") or "").lower()
            
            # Check Registry Brands
            for b_id, data in BRANDS.items():
                # Check aliases
                for alias in data["aliases"] + [data["display_name"].lower()]:
                    if alias in title_lower:
                        detected_brand_id = b_id
                        break
                if detected_brand_id:
                    break
            
            if detected_brand_id:
                brand_data = BRANDS[detected_brand_id]
                
                # Check Clean Beauty
                if brand_data.get("is_clean_beauty"):
                    item["is_clean_beauty"] = True
                
                # Check Official Domain
                for official in brand_data.get("official_domains", []):
                    if official["host"] in host:
                        # Optional: Check path prefix if defined
                        prefix = official.get("path_prefix")
                        if prefix:
                            if urlparse(url).path.startswith(prefix):
                                item["is_official"] = True
                        else:
                            item["is_official"] = True
                        
                        if item.get("is_official"):
                            break

            # 3. Exclusion / Low Quality Logic (Testers)
            # User flagged Netmeds Tester: https://www.netmeds.com/product/tstr-tester-...
            path = parsed.path.lower()
            exclude_terms = ["tester", "tstr", "sample", "damage", "unboxed"]
            
            if any(term in title_lower for term in exclude_terms) or \
               any(term in path for term in exclude_terms):
                item["is_excluded"] = True
                item["exclusion_reason"] = "tester_or_sample"

        except Exception as e:
            logger.error(f"Trust tagging failed: {e}")
            
        return item
