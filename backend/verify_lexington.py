
import os
import re
import sys
from typing import Optional, List

# Setup path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.scraper_service import RealScraperService

# --- DUPLICATE LOGIC FROM SMART SEARCH FOR TESTING ---
def _extract_series_name(text: str) -> Optional[str]:
    if not text: return None
    
    # Same list as in prod
    known_series = [
        "LEXINGTON", "BRADSHAW", "RUNWAY", "DARCI", "SOFIE", "PYPER", "PARKER", "SLIM", "RITZ", 
        "GEN 5", "GEN 6", "VANDERBILT", "EVEREST", "LAYTON", "TIBBY"
    ]
    
    text_upper = text.upper()
    for series in known_series:
        if f" {series} " in f" {text_upper} " or text_upper.startswith(f"{series} ") or text_upper.endswith(f" {series}"):
            return series
            
    return None

def run_test():
    query = "MICHAEL KORS Lexington Analog Watch - For Women"
    print(f"\n--- TESTING LEXINGTON SERIES LOGIC FOR: '{query}' ---\n")
    
    # 1. Detect Series
    series = _extract_series_name(query)
    print(f"Detected Series: {series}")
    
    if not series:
        print("CRITICAL: No Series detected! Strict filtering will NOT run.")
        return

    # 2. Fetch Results (Real Scraper)
    # MANUALLY SET ENV VAR FOR SCRIPT EXECUTION
    os.environ["SERPAPI_API_KEY"] = "0828d0d428fe26941382a02fab5b08b2e6f707749e046089b30cbbced9d25e67"
    
    scraper = RealScraperService()
    print("\nFetching results from Google Shopping (via SerpApi)...")
    results = scraper.search_products(query).get("online", [])
    
    print(f"\nRAW RESULTS FOUND: {len(results)}")
    
    # 3. Apply Strict Series Filter
    print(f"\nAPPLYING STRICT SERIES FILTER: '{series}'")
    filtered = []
    rejected = []
    
    for item in results:
        title_upper = item.get("title", "").upper()
        # Check if SERIES is in title works as a strict filter
        if series in title_upper:
            filtered.append(item)
        else:
            rejected.append(item)
            
    print(f"\nFILTERED RESULTS (KEPT): {len(filtered)}")
    print(f"REJECTED RESULTS: {len(rejected)}")
    
    print("\n--- SAMPLES KEPT (CORRECT) ---")
    for i, item in enumerate(filtered[:5]):
        print(f"✅ {item['title']} ({item['source']})")
        
    print("\n--- SAMPLES REJECTED (INCORRECT - SHOULD BE GONE) ---")
    for i, item in enumerate(rejected[:5]):
        print(f"❌ {item['title']} ({item['source']})")

if __name__ == "__main__":
    run_test()
