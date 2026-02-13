
import sys
import os
import logging
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.services.smart_search_service import SmartSearchService

# Mock Logger
logging.basicConfig(level=logging.INFO)

def walkthrough_lakme_radiance():
    print("Initializing Service for Lakme Walkthrough...")
    service = SmartSearchService()
    
    # 1. USER INPUT
    user_url = "https://www.amazon.in/Pigmentation-Treatment-Niacinamide-Resorcinol-Antioxidants/dp/B01C571752/ref=sr_1_18?crid=ITYUHMBNTUWA..."
    
    # MOCK 1: URL Extraction
    # Simulating extraction from the Amazon page
    service.url_service.extract_product_from_url = MagicMock(return_value={
        "image": "https://m.media-amazon.com/images/I/51+t1+s+s+L._SX679_.jpg", 
        "search_query": "Lakmé Absolute Perfect Radiance Skin Brightening Day Crème", 
        "resolved_url": "https://www.amazon.in/Pigmentation-Treatment-Niacinamide-Resorcinol-Antioxidants/dp/B01C571752"
    })

    # MOCK 2: Search Results (Simulating real marketplace results)
    # We mix exact matches, size variants, and different products (Night Creme)
    mock_results = {
        "online": [
            # 1. Exact Match (Amazon - Duplicate of input but found in search)
            {
                "title": "Lakmé Absolute Perfect Radiance Skin Brightening Day Crème 50g",
                "source": "Amazon", 
                "price": 399,
                "image": "https://m.media-amazon.com/images/I/51+t1+s+s+L._SX679_.jpg",
                "link": "https://amazon.in/dp/B01C571752"
            },
            # 2. Exact Match (Nykaa)
            {
                "title": "Lakme Absolute Perfect Radiance Brightening Day Cream",
                "source": "Nykaa", 
                "price": 420,
                "image": "https://images-static.nykaa.com/media/catalog/product/...jpg",
                "link": "https://nykaa.com/..."
            },
            # 3. Variant Match (Smaller Size)
            {
                "title": "Lakmé Absolute Perfect Radiance Skin Brightening Day Crème 15g",
                "source": "Flipkart", 
                "price": 115,
                "image": "https://rukminim1.flixcart.com/image/...",
                "link": "https://flipkart.com/..."
            },
            # 4. Similar Match (Night Creme - Different Product)
            {
                "title": "Lakmé Absolute Perfect Radiance Skin Brightening Night Crème",
                "source": "Myntra", 
                "price": 450,
                "image": "https://assets.myntassets.com/...",
                "link": "https://myntra.com/..."
            },
             # 5. Similar Match (Serum - Different Product)
            {
                "title": "Lakmé Absolute Perfect Radiance Skin Brightening Serum",
                "source": "Amazon", 
                "price": 600,
                "image": "https://m.media-amazon.com/...",
                "link": "https://amazon.in/..."
            }
        ]
    }
    service.scraper.search_products = MagicMock(return_value=mock_results)
    
    # MOCK 3: Visual Matcher logic
    def mock_visual_compare(target, candidate):
        # We simulate visual matching based on the candidate image URL, 
        # which we'll make distinctive in the mock data for testing purposes.
        
        # In a real scenario, GPT-4 Vision sees the actual image. 
        # Here we use keywords in the URL or just consistent mapping.
        
        if "SX679" in candidate: # The exact Amazon image
            return {"visual_score": 99, "match_type": "IDENTICAL"}
        elif "nykaa" in candidate: # The Nykaa image
            return {"visual_score": 95, "match_type": "IDENTICAL"}
        elif "rukminim1" in candidate: # The Flipkart image (smaller size)
            return {"visual_score": 90, "match_type": "SIMILAR_PACKAGING"}
        elif "myntassets" in candidate: # Night Creme
            return {"visual_score": 60, "match_type": "DIFFERENT_COLOR"}
        else: # Serum
             return {"visual_score": 30, "match_type": "DIFFERENT_SHAPE"}
            
    service.matcher.compare_images = MagicMock(side_effect=mock_visual_compare)

    print("-" * 60)
    print(f"Executing Smart Search for URL:\n{user_url[:80]}...")
    
    results = service.smart_search(user_url)
    
    print("\n--- STEP-BY-STEP BREAKDOWN ---")
    
    print(f"\n1. EXTRACTED QUERY: '{results['original_query']}'")
    
    exact = results['results'].get('exact_matches', [])
    variant = results['results'].get('variant_matches', [])
    similar = results['results'].get('similar_matches', [])
    
    print(f"\n2. CLASSIFICATION RESULTS:")
    print(f"   - Exact Matches: {len(exact)}")
    print(f"   - Variant Matches: {len(variant)}")
    print(f"   - Similar Items: {len(similar)}")
    
    print("\n3. DETAILED LIST:")
    
    for i, item in enumerate(exact, 1):
        print(f"\n   [EXACT #{i}] {item['title']} ({item['source']})")
        print(f"     Price: ₹{item['price']}")
        print(f"     Score: {item['match_score']}")
        print(f"     Reasons: {item['match_reasons']}")
        
    for i, item in enumerate(variant, 1):
        print(f"\n   [VARIANT #{i}] {item['title']} ({item['source']})")
        print(f"     Price: ₹{item['price']}")
        print(f"     Score: {item['match_score']}")
        print(f"     Reasons: {item['match_reasons']}")
        
    for i, item in enumerate(similar, 1):
        print(f"\n   [SIMILAR #{i}] {item['title']} ({item['source']})")
        print(f"     Price: ₹{item['price']}")
        print(f"     Score: {item['match_score']}")
        print(f"     Reasons: {item['match_reasons']}")

if __name__ == "__main__":
    walkthrough_lakme_radiance()
