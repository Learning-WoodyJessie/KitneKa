
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
        url = item.get("merchant_url") or item.get("url") or item.get("link")
        if not url:
            return item

        try:
            parsed = urlparse(url)
            host = parsed.netloc.lower()
            if host.startswith("www."):
                host = host[4:]
            
            # 1. Store Tier (Popular Marketplace)
            # Check if host ends with any of the popular domains (handles m.myntra.com, www.amazon.in etc)
            is_found = False
            
            # Helper to check source match
            source_name = (item.get("source") or "").lower()
            
            for store in STORES:
                # Check Domain
                for domain in store["domains"]:
                    if host == domain or host.endswith("." + domain):
                        # POPULAR / TRUSTED FLAG
                        # Marketplaces, Pharmacies, and Specialists (Sephora/Nykaa) are all 'Popular'
                        item["is_popular"] = True
                        item["store_name"] = store["display_name"]
                        item["store_tier"] = store["tier"]
                        is_found = True
                        break
                
                # Check Source Name (Fallback for Google Redirects)
                if not is_found and source_name:
                    if store["display_name"].lower() in source_name or source_name in store["display_name"].lower():
                         # e.g. source="Amazon.in" matches "Amazon"
                         item["is_popular"] = True
                         item["store_name"] = store["display_name"]
                         item["store_tier"] = store["tier"]
                         is_found = True
                
                if is_found: break
            
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
                
                # Check Official Domain OR Source Name
                is_official_found = False
                
                # 1. Domain Check
                for official in brand_data.get("official_domains", []):
                    if official["host"] in host:
                        # Optional: Check path prefix if defined
                        prefix = official.get("path_prefix")
                        if prefix:
                            if urlparse(url).path.startswith(prefix):
                                is_official_found = True
                        else:
                            is_official_found = True
                        
                        if is_official_found: break
                
                # 2. Source Name Check (Fallback)
                if not is_official_found and source_name:
                    # Clean source name (remove .com, .in etc to match brand name)
                    clean_source = source_name.replace(".com", "").replace(".in", "").strip().lower()
                    if brand_data["display_name"].lower() in clean_source or clean_source in brand_data["display_name"].lower():
                        is_official_found = True

                if is_official_found:
                    item["is_official"] = True
                    item["is_popular"] = True # Official Sites are always Popular/Trusted

            
            # 3. Clean Beauty is also Popular - REMOVED
            # User request: Clean Beauty should only be "Popular" if it's from a Trusted Store or Official Site.
            # if item.get("is_clean_beauty"):
            #      item["is_popular"] = True

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
