
import sys
import os
sys.path.append('backend')
from app.services.url_scraper_service import URLScraperService

# Mock API keys to force path parsing fallback (assuming metadata might block or fail)
os.environ["OPENAI_API_KEY"] = "sk-fake" 
os.environ["SERPAPI_API_KEY"] = "fake"

def test_myntra():
    url = "https://www.myntra.com/mailers/skin-care/m.a.c/m.a.c-mini-strobe-cream-15-ml---pinklite/12218208/buy?utm_source=social_share_pdp&utm_medium=deeplink&utm_campaign=social_share_pdp_deeplink"
    service = URLScraperService()
    
    # We want to test _extract_from_url_path specifically to see the fallback logic
    # But let's run the full extract to see if metadata works (mocking requests slightly difficult here without network)
    # So we'll call _extract_from_url_path directly first
    
    query, name = service._extract_from_url_path(url)
    print(f"Path Extraction Result:")
    print(f"Name: {name}")
    print(f"Query: {query}")
    
    # Also check what segments produced this
    from urllib.parse import urlparse, unquote
    parsed = urlparse(url)
    path = unquote(parsed.path)
    print(f"Raw Path: {path}")

if __name__ == "__main__":
    test_myntra()
