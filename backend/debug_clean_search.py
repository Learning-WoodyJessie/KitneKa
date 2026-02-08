
import os
import sys
import json
from app.services.smart_search_service import SmartSearchService

# Mock Env
os.environ["SERPAPI_API_KEY"] = "fc630ce0e61d876357805174092497645f7c327429177a4990fa728a2a072023" # Use valid key if needed or rely on existing env

def debug_search():
    service = SmartSearchService()
    query = "Mamaearth"
    print(f"--- Debugging Search for '{query}' ---\n")
    
    # 1. Run Search
    results = service.smart_search(query)
    
    online_items = results.get("results", {}).get("online", [])
    print(f"Total Online Items Found: {len(online_items)}")
    
    # 2. Analyze Sources
    sources = {}
    for item in online_items:
        src = item.get("source", "Unknown")
        sources[src] = sources.get(src, 0) + 1
        
        # Print top 5 items details
        if sources[src] <= 3:
             print(f"[{src}] {item['title']} - {item['price']}")
             print(f"   URL: {item.get('merchant_url') or item.get('url')}")
             print(f"   Score: {item.get('match_score')}")
             print(f"   Boosts: {item.get('match_reasons')}")
             print("")

    print("\n--- Source Distribution ---")
    for src, count in sources.items():
        print(f"{src}: {count}")

if __name__ == "__main__":
    debug_search()
