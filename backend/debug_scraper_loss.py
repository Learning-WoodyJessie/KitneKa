import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("SERPAPI_API_KEY")

def debug_loss():
    print("--- Debugging Result Loss for 'Old School Rituals' ---")
    query = "Old School Rituals"
    
    # 1. Fetch RAW data directly to see what exists
    params = {
        "engine": "google_shopping",
        "q": query,
        "gl": "in",
        "hl": "en",
        "location": "Mumbai, Maharashtra, India",
        "google_domain": "google.co.in",
        "api_key": key,
        "num": 100
    }
    
    print("Fetching raw SerpApi data...")
    resp = requests.get("https://serpapi.com/search.json", params=params)
    data = resp.json()
    
    shopping_results = data.get("shopping_results", [])
    print(f"Raw Shopping Results found: {len(shopping_results)}")
    
    if len(shopping_results) == 0:
        print("Empty raw results! Is the query blocked or just empty?")
        return

    # 2. Simulate Filter Logic
    valid_count = 0
    rejection_reasons = {}
    
    print("\n--- Simulating Filters ---")
    for i, item in enumerate(shopping_results[:10]): # Check first 10
        title = item.get("title", "No Title")
        link = item.get("link", "")
        product_link = item.get("product_link", "")
        
        url = product_link or link
        
        status = "Unknown"
        if not url:
            status = "REJECT: No URL"
        elif "google.com" in url or "google.co.in" in url:
             if "url?q=" in url:
                 status = "POSSIBLE (Redirect)"
             elif "/aclk" in url:
                 status = "POSSIBLE (Ad)"
             elif "ibp=oshop" in url:
                 status = "REJECT: Viewer Link (ibp=oshop)"
             else:
                 status = "REJECT: Generic Google Link"
        else:
            status = "ACCEPT: Direct Link"
            
        print(f"[{i}] {title[:30]}... | URL: {url[:40]}... | {status}")
        
        if "ACCEPT" in status or "POSSIBLE" in status:
            valid_count += 1
            
    print(f"\nEstimated Valid Items in top 10: {valid_count}")

def test_alternatives():
    print("\n\n--- TESTING ALTERNATIVES ---")
    
    # 1. SPECIFIC Query on Shopping
    query_specific = "Old School Rituals Shampoo"
    print(f"\n1. Testing Specific Query: '{query_specific}' on Shopping...")
    params_s = {
        "engine": "google_shopping",
        "q": query_specific,
        "gl": "in",
        "hl": "en",
        "location": "Mumbai, Maharashtra, India",
        "google_domain": "google.co.in",
        "api_key": key,
        "num": 20
    }
    resp_s = requests.get("https://serpapi.com/search.json", params=params_s)
    data_s = resp_s.json()
    results_s = data_s.get("shopping_results", [])
    print(f"Results found: {len(results_s)}")
    
    # 2. ORGANIC Search on General Query
    print(f"\n2. Testing Organic Search: 'Old School Rituals'...")
    params_o = {
        "engine": "google",
        "q": "Old School Rituals products",
        "gl": "in",
        "hl": "en",
        "location": "Mumbai, Maharashtra, India",
        "google_domain": "google.co.in",
        "api_key": key,
        "num": 20
    }
    resp_o = requests.get("https://serpapi.com/search.json", params=params_o)
    data_o = resp_o.json()
    results_o = data_o.get("organic_results", [])
    print(f"Organic Results found: {len(results_o)}")
    for i, item in enumerate(results_o[:3]):
        print(f"  [{i}] {item.get('title')} -> {item.get('link')}")

if __name__ == "__main__":
    debug_loss()
    test_alternatives()
