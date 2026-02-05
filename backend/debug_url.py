
import re
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

def extract_id(url):
    # Same regex as in code
    asin_match = re.search(r'/(?:dp|gp/product)/([A-Z0-9]{10})(?:/|\?|$)', url)
    if asin_match:
         return {"type": "asin", "value": asin_match.group(1)}
    return None

def normalize_url(url):
    # Same logic as in code
    if not url: return ""
    try:
        parsed = urlparse(url)
        # 1. Lowercase scheme and netloc
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        
        # 2. Filter query params
        query_params = parse_qsl(parsed.query)
        # tracking params to drop
        blocklist = {'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'gclid', 'fbclid', 'source', 'ref_', 'smid', 'psc'}
        # Note: I added source, ref_, smid, psc to blocklist here to simulate aggressive cleaning, 
        # but the actual code only has standard ones. Let's see what the actual code does with the standard blocklist.
        # Actual blocklist in code: {'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'gclid', 'fbclid'}
        
        standard_blocklist = {'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'gclid', 'fbclid'}
        cleaned_params = sorted([(k, v) for k, v in query_params if k.lower() not in standard_blocklist])
        
        new_query = urlencode(cleaned_params)
        
        # Reconstruct (drop fragment)
        return urlunparse((parsed.scheme, netloc, parsed.path, parsed.params, new_query, ''))
    except Exception as e:
        return str(e)

url = "https://www.amazon.in/BRUTON-Sport-Shoes-Running-White/dp/B0F2THXY4T?source=ps-sl-shoppingads-lpcontext&ref_=fplfs&smid=A22K40KEJWHSL8&th=1&psc=1"

print(f"Input URL: {url}")
print("-" * 20)
print(f"Extracted ID: {extract_id(url)}")
print(f"Normalized URL: {normalize_url(url)}")
