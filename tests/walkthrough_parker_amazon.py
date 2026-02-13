
import sys
import os
import logging
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.services.smart_search_service import SmartSearchService

# Mock Logger
logging.basicConfig(level=logging.INFO)

def walkthrough_parker_amazon():
    print("Initializing Service for Parker Walkthrough...")
    service = SmartSearchService()
    
    # 1. USER INPUT
    user_url = "https://www.amazon.in/Michael-Kors-Analog-Womens-Watch-MK4733/dp/B0CJNCL7CQ/ref=sr_1_4_sspa?crid=JPCJV2FTM6F4&dib=eyJ2IjoiMSJ9.qxbE_kc1E9ofgLGqnm8h_ts_4XI8VbTD31iuv26ZRF7xHGS14RDTUxoIiFTQ4F-qLiJeAhf6grMoHfSvPrKtA-InTFbns0I8dVHZvW3tn0bIi1IEjyeL2mET8kQSenGyQQjNkK8FhILiMQ3J7a_QelpnqxaGj8HsWnclmHAo7_WZI1SiiSOuSDYhQjjS7qnFvNkXlMV6EoyVaUnA1xGsFxQw-w4xM9oWXCQxmAzTadUjJ-B3MCj8yZknZOnOeGJI5eraJTm0zheWCAWj6kG5nU-g5nmwNSgUE-0t426Q89k.Rncefuz5PqKV6Jn6smOAyS0a0ZThQxKeZTZ1qZC62AM&dib_tag=se&keywords=mk7548i&qid=1770952292&sprefix=mk7548i%2F35546875%2Fbuy%2Caps%2C376&sr=8-4-spons&aref=1T6VEHdMSx&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&th=1"
    
    # MOCK 1: URL Extraction (Simulating what URLScraperService would return for this URL)
    # The URL clearly shows MK4733, but the user query might be about MK7548I (from the URL params)
    # However, for a Direct URL Search, we trust the PAGE content.
    service.url_service.extract_product_from_url = MagicMock(return_value={
        "image": "https://m.media-amazon.com/images/I/61gRjGN2+tL._AC_UY1000_.jpg", # Simplified real image URL
        "search_query": "Michael Kors MK4733 Women's Watch", # Extracted from title/url
        "resolved_url": "https://www.amazon.in/Michael-Kors-Analog-Womens-Watch-MK4733/dp/B0CJNCL7CQ"
    })

    # MOCK 2: Search Results (Candidates found on other sites)
    # We simulate finding the SAME watch on Myntra and Flipkart, plus a DIFFERENT color variant
    mock_results = {
        "online": [
            {
                "title": "Michael Kors Women's Watch MK4733 Silver",
                "source": "Myntra", 
                "price": 14995,
                "image": "https://example.com/mk4733_myntra.jpg",
                "link": "https://myntra.com/..."
            },
            {
                "title": "Michael Kors Women's Watch MK4733",
                "source": "Flipkart", 
                "price": 15500,
                "image": "https://example.com/mk4733_flipkart.jpg",
                "link": "https://flipkart.com/..."
            },
            {
                "title": "Michael Kors Women's Watch MK4734 Gold", # Different model/color
                "source": "Tata Cliq", 
                "price": 16000,
                "image": "https://example.com/mk4734_gold.jpg",
                "link": "https://tatacliq.com/..."
            }
        ]
    }
    service.scraper.search_products = MagicMock(return_value=mock_results)
    
    # MOCK 3: Visual Matcher logic
    def mock_visual_compare(target, candidate):
        # We simulate that the Myntra/Flipkart images match the Amazon target perfectly
        if "mk4733" in candidate:
            return {"visual_score": 98, "match_type": "IDENTICAL"}
        else:
            return {"visual_score": 40, "match_type": "DIFFERENT_ITEM"}
            
    service.matcher.compare_images = MagicMock(side_effect=mock_visual_compare)

    print("-" * 60)
    print(f"Executing Smart Search for URL:\n{user_url[:80]}...")
    
    results = service.smart_search(user_url)
    
    print("\n--- RESULTS ANALYSIS ---")
    exact = results['results'].get('exact_matches', [])
    variant = results['results'].get('variant_matches', [])
    similar = results['results'].get('similar_matches', [])
    
    print(f"Exact Matches: {len(exact)}")
    print(f"Variant Matches: {len(variant)}")
    
    for item in exact:
        print(f"\n[EXACT] {item['title']} ({item['source']})")
        print(f"  Score: {item['match_score']}")
        print(f"  Reasons: {item['match_reasons']}")
        if "Visually Verified (Exact)" in item['match_reasons']:
            print("  ✅ VISUALLY VERIFIED")
            
    for item in variant:
         print(f"\n[VARIANT] {item['title']} ({item['source']})")
         print(f"  Score: {item['match_score']}")
         

if __name__ == "__main__":
    walkthrough_parker_amazon()
