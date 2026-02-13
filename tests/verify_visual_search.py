
import sys
import os
import logging
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.services.smart_search_service import SmartSearchService

# Mock Logger
logging.basicConfig(level=logging.INFO)

def test_visual_verification_integration():
    print("Initializing Service...")
    service = SmartSearchService()
    
    # MOCK COMPONENT 1: Scraper
    # enhanced mock to return an item with an image
    mock_results = {
        "online": [
            {
                "title": "Michael Kors Women's Gen 5E Darci Watch",
                "source": "Amazon", 
                "price": 18000,
                "image": "https://example.com/candidate.jpg", # Candidate Image
                "link": "https://amazon.in/dp/B08H..."
            }
        ]
    }
    service.scraper.search_products = MagicMock(return_value=mock_results)
    
    # MOCK COMPONENT 2: Visual Matcher
    # We pretend GPT-4 Vision returns a 95% match
    service.matcher.compare_images = MagicMock(return_value={
        "visual_score": 95,
        "match_type": "IDENTICAL", 
        "key_differences": "None"
    })
    
    # MOCK URL Scraper (to provide target image)
    service.url_service.extract_product_from_url = MagicMock(return_value={
        "image": "https://example.com/target.jpg",
        "search_query": "Michael Kors Gen 5E"
    })

    print("-" * 60)
    print("TEST 1: Image URL Check (Trigger Visual Verification)")
    # We query with a fake image URL to trigger the "target_fingerprint['image_url']" logic
    query = "https://example.com/target.jpg" 
    
    results = service.smart_search(query)
    
    # CHECK RESULTS
    print("\n--- RESULTS ANALYSIS ---")
    
    exact = results['results'].get('exact_matches', [])
    variant = results['results'].get('variant_matches', [])
    similar = results['results'].get('similar_matches', [])
    
    print(f"Exact Matches: {len(exact)}")
    print(f"Variant Matches: {len(variant)}")
    print(f"Similar Matches: {len(similar)}")
    
    top_match = None
    if exact: top_match = exact[0]
    elif variant: top_match = variant[0]
    elif similar: top_match = similar[0]
    
    if top_match:
        print(f"\nTop Match Title: {top_match.get('title')}")
        print(f"Match Score: {top_match.get('match_score')}")
        print(f"Match Reasons: {top_match.get('match_reasons')}")
    else:
        print("No matches found at all.")

    # ASSERTIONS
    passed = False
    if top_match and "Visually Verified" in top_match.get('match_reasons', []):
        print("✅ SUCCESS: 'Visually Verified' tag present.")
        passed = True
    else:
        print("❌ FAILURE: 'Visually Verified' tag missing.")
        
    if service.matcher.compare_images.called:
         print("✅ SUCCESS: compare_images was called.")
    else:
         print("❌ FAILURE: compare_images was NOT called.")
         
if __name__ == "__main__":
    test_visual_verification_integration()
