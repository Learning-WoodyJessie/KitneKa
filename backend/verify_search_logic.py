
import os
import re
import sys
from typing import List

# Setup path so we can import app modules if needed, or just mock/re-implement key parts
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.scraper_service import RealScraperService

# --- DUPLICATE LOGIC FROM SMART SEARCH FOR TESTING ---
def _extract_model_numbers(text: str) -> List[str]:
    tokens = text.split()
    models = []
    for t in tokens:
        t_clean = re.sub(r'[^\w\-]', '', t).upper()
        if any(c.isdigit() for c in t_clean) and len(t_clean) > 2:
             if t_clean not in ["SIZE", "PACK", "WITH", "BLACK", "WHITE", "BLUE", "GOLD", "WOMEN", "MENS", "KIDS", "ROSE", "GOLD", "WATCH", "DARCI", "1PC", "2PC", "100ML", "50ML", "500G", "1KG"]:
                models.append(t_clean)
    return models

def run_test():
    query = "Michael Kors Women Darci Rose Gold Watch MK3192"
    print(f"\n--- TESTING SEARCH LOGIC FOR: '{query}' ---\n")
    
    # 1. Detect Models
    models = _extract_model_numbers(query)
    print(f"Detected Models: {models}")
    
    if not models:
        print("CRITICAL: No models detected! Strict filtering will NOT run.")
        return

    # 2. Fetch Results (Real Scraper)
    # MANUALLY SET ENV VAR FOR SCRIPT EXECUTION
    os.environ["SERPAPI_API_KEY"] = "0828d0d428fe26941382a02fab5b08b2e6f707749e046089b30cbbced9d25e67"
    
    scraper = RealScraperService()
    
    # SIMULATE MARKETPLACE MIX (as enabled in smart_search)
    # We query specific stores because the generic query failed to find Amazon
    mix_queries = [
        f"{query}",                # Generic
        f"MK3192 amazon.in",       # Amazon Specific
        f"MK3192 flipkart.com",    # Flipkart Specific
        f"MK3192 myntra.com"       # Myntra Specific
    ]
    
    results = []
    print("\nSimulating Smart Search Marketplace Mix...")
    for q in mix_queries:
        print(f"  -> Querying: {q}")
        # Note: In real app this is async/parallel
        res = scraper.search_products(q).get("online", [])
        results.extend(res)

    # Deduplicate by URL
    seen_urls = set()
    unique_results = []
    for r in results:
        if r['url'] not in seen_urls:
            unique_results.append(r)
            seen_urls.add(r['url'])
    
    results = unique_results

    print(f"\nRAW RESULTS FOUND (Combined): {len(results)}")
    print("-" * 50)
    for i, item in enumerate(results[:5]): # Show first 5 raw
        print(f"[{i+1}] {item['title']} \n    {item['url'][:60]}...")
    print("-" * 50)

    # 3. Apply Strict Model Filter
    print(f"\nAPPLYING STRICT MODEL FILTER: {models}")
    filtered = []
    rejected = []
    
    for item in results:
        title_upper = item.get("title", "").upper()
        # Check if ANY model is in title
        if any(m in title_upper for m in models):
            filtered.append(item)
        else:
            rejected.append(item)
            
    print(f"\nFILTERED RESULTS: {len(filtered)}")
    print(f"REJECTED RESULTS: {len(rejected)}")
    
    print("\n--- SAMPLES KEPT (CORRECT) ---")
    for i, item in enumerate(filtered[:5]):
        print(f"✅ {item['title']} ({item['source']})")
        
    print("\n--- SAMPLES REJECTED (INCORRECT) ---")
    for i, item in enumerate(rejected[:5]):
        print(f"❌ {item['title']} ({item['source']})")

if __name__ == "__main__":
    run_test()
