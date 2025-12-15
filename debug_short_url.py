import os
import sys
import logging
from dotenv import load_dotenv

# Setup
logging.basicConfig(level=logging.INFO)
load_dotenv(os.path.join(os.getcwd(), 'backend/.env'))
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.url_scraper_service import URLScraperService

def test_short_url():
    url = "https://amzn.in/d/beckv5Y"
    print(f"--- Testing Short URL: {url} ---")
    
    scraper = URLScraperService()
    
    # 1. Test Resolution explicitly
    resolved = scraper._resolve_url(url)
    print(f"Resolved URL: {resolved}")
    
    # 2. Test Full Extraction
    result = scraper.extract_product_from_url(url)
    print(f"Extracted Data: {result}")

if __name__ == "__main__":
    test_short_url()
