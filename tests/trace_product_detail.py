"""
Trace: Product Detail Page Flow
Product: fabindia Red Cotton Kalamkari Printed Midi Dress
URL: https://kitneka-7o3d.onrender.com/#/product/17418984777308666955

This script simulates EXACTLY what happens when a user clicks a product card
and lands on the product detail page — step by step.
"""

import sys
import os
import json
import time
import re

# ─── Load .env FIRST before any backend imports ───────────────────────────────
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
loaded = load_dotenv(env_path)
print(f"[ENV] Loaded .env from {os.path.abspath(env_path)}: {loaded}")
print(f"[ENV] SERPAPI_API_KEY present: {bool(os.environ.get('SERPAPI_API_KEY'))}")
print(f"[ENV] OPENAI_API_KEY present:  {bool(os.environ.get('OPENAI_API_KEY'))}")
print()

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

PRODUCT_TITLE = "fabindia Red Cotton Kalamkari Printed Midi Dress"
PRODUCT_SOURCE = "Myntra"
PRODUCT_PRICE = 699

POPULAR_RETAILERS = [
    'amazon', 'flipkart', 'myntra', 'ikea', 'h&m', 'zara', 'nike', 'adidas',
    'uniqlo', 'tata cliq', 'nykaa', 'ajio', 'michael kors', 'lakme', 'sephora'
]
SAMPLE_STORES = ['smytten', 'myglamm', 'freecultr', 'vaana', 'gharstuff']

def is_popular_store(seller_name, brand=None):
    name = (seller_name or '').lower()
    if any(r in name for r in POPULAR_RETAILERS):
        return True
    if brand and brand.lower() in name:
        return True
    return False

def is_sample_store(seller_name):
    name = (seller_name or '').lower()
    return any(s in name for s in SAMPLE_STORES)

def separator(title):
    print(f"\n{'='*60}")
    print(f"  STEP: {title}")
    print(f"{'='*60}")

def run_trace():
    print("\n🔍 PRODUCT DETAIL PAGE TRACE")
    print(f"   Product: {PRODUCT_TITLE}")
    print(f"   Source:  {PRODUCT_SOURCE} @ ₹{PRODUCT_PRICE}")

    # =========================================================
    # STEP 1: User clicks product card in SearchInterface
    # =========================================================
    separator("1. User Clicks Product Card")
    print(f"  → handleProductClick() called")
    print(f"  → Product saved to localStorage as 'product_shared_<id>'")
    print(f"  → navigate('/product/17418984777308666955')")

    # =========================================================
    # STEP 2: ProductPage mounts, fetchData() runs
    # =========================================================
    separator("2. ProductPage Mounts → fetchData()")
    print(f"  → Check localStorage for 'product_shared_17418984777308666955'")
    print(f"  → Found! Product loaded instantly (no API call needed)")
    print(f"  → Product title: '{PRODUCT_TITLE}'")
    print(f"  → Now triggering price comparison...")

    # =========================================================
    # STEP 3: /product/compare API call
    # =========================================================
    separator("3. Frontend calls GET /product/compare?title=<title>")
    print(f"  → Query: '{PRODUCT_TITLE}'")
    print(f"  → Backend receives this and calls smart_search(title)")

    # Now actually call the backend
    try:
        from app.services.smart_search_service import SmartSearchService
        searcher = SmartSearchService()

        separator("4. smart_search() runs internally")
        print(f"  → Calling smart_search('{PRODUCT_TITLE}', location='Mumbai')")
        t0 = time.time()
        results = searcher.smart_search(PRODUCT_TITLE, location="Mumbai")
        elapsed = time.time() - t0
        print(f"  → Completed in {elapsed:.2f}s")

        online = results.get("results", {}).get("online", [])
        exact = results.get("results", {}).get("exact_matches", [])
        variants = results.get("results", {}).get("variant_matches", [])
        similar = results.get("results", {}).get("similar_matches", [])

        separator("5. Raw Search Results")
        print(f"  → Total online results: {len(online)}")
        print(f"  → Exact matches:        {len(exact)}")
        print(f"  → Variant matches:      {len(variants)}")
        print(f"  → Similar matches:      {len(similar)}")

        # =========================================================
        # STEP 6: /product/compare endpoint filters & deduplicates
        # =========================================================
        separator("6. /product/compare Filtering Logic")
        print(f"  → Takes 'online' list ({len(online)} items)")
        print(f"  → Filters out items with price=0")
        priced = [r for r in online if r.get("price", 0) > 0]
        print(f"  → After price filter: {len(priced)} items")

        # Sort by price
        sorted_results = sorted(priced, key=lambda x: x.get("price", float("inf")))
        print(f"  → Sorted by price (lowest first)")

        # Deduplicate by source
        sources_seen = set()
        unique_by_source = []
        for r in sorted_results:
            source = r.get("source", "Unknown")
            if source not in sources_seen:
                sources_seen.add(source)
                unique_by_source.append({
                    "source": source,
                    "title": r.get("title"),
                    "price": r.get("price"),
                    "url": r.get("url") or r.get("link"),
                })

        print(f"  → After dedup by store: {len(unique_by_source)} unique stores")
        print(f"\n  Stores returned by /product/compare:")
        for i, s in enumerate(unique_by_source):
            print(f"    {i+1}. {s['source']:20s} ₹{s['price']}")

        # =========================================================
        # STEP 7: Frontend builds allOffers
        # =========================================================
        separator("7. Frontend builds allOffers list")
        all_offers = unique_by_source.copy()

        # Add current product if not already in list
        current_source = PRODUCT_SOURCE.lower()
        if not any((o.get("source") or "").lower() == current_source for o in all_offers):
            all_offers.insert(0, {
                "source": PRODUCT_SOURCE,
                "price": PRODUCT_PRICE,
                "isBest": True,
                "note": "(added from clicked product)"
            })
            print(f"  → Current product ({PRODUCT_SOURCE}) not in compare results — added manually")
        else:
            print(f"  → Current product ({PRODUCT_SOURCE}) already in compare results")

        # Sort by price
        all_offers.sort(key=lambda x: x.get("price", 0))
        print(f"  → allOffers sorted by price: {len(all_offers)} items")

        # =========================================================
        # STEP 8: Split into Top Retailers vs Other Options
        # =========================================================
        separator("8. Splitting into 'Top Retailers' vs 'Other Options'")
        popular_offers = [o for o in all_offers if is_popular_store(o.get("source"), brand="fabindia")][:15]
        other_offers   = [o for o in all_offers if not is_popular_store(o.get("source"), brand="fabindia")][:15]

        print(f"\n  TOP RETAILERS ({len(popular_offers)}):")
        for i, o in enumerate(popular_offers):
            best = " ← BEST DEAL" if i == 0 else ""
            print(f"    {i+1}. {o.get('source'):20s} ₹{o.get('price')}{best}")

        print(f"\n  OTHER OPTIONS ({len(other_offers)}):")
        for i, o in enumerate(other_offers):
            print(f"    {i+1}. {o.get('source'):20s} ₹{o.get('price')}")

        # =========================================================
        # STEP 9: AI Recommendation
        # =========================================================
        separator("9. AI Recommendation Calculation")
        real_offers = [o for o in all_offers if not is_sample_store(o.get("source", ""))]
        prices = [o.get("price", 0) for o in real_offers if o.get("price", 0) > 0]
        if prices:
            avg_price = sum(prices) / len(prices)
            best_price = min(prices)
            discount_vs_avg = ((avg_price - best_price) / avg_price) * 100
            print(f"  → Average price across stores: ₹{avg_price:.0f}")
            print(f"  → Best price: ₹{best_price}")
            print(f"  → Best is {discount_vs_avg:.0f}% cheaper than average")
            if discount_vs_avg >= 20:
                print(f"  → Recommendation: 🟢 GREAT BUY — Excellent Price!")
            elif discount_vs_avg >= 5:
                print(f"  → Recommendation: 🟡 GOOD DEAL")
            else:
                print(f"  → Recommendation: ⚪ FAIR PRICE")

        # =========================================================
        # STEP 10: fetchSimilar() runs separately
        # =========================================================
        separator("10. fetchSimilar() — 'Similar Products' Section")
        brand = "fabindia"
        category = "fashion"
        similar_query = f"{brand} {category}".strip()
        # Strip model numbers
        import re
        similar_query = re.sub(r'[A-Z0-9]{4,}', '', similar_query).strip()
        print(f"  → Query built: '{similar_query}'")
        print(f"  → Calls GET /search?q={similar_query}")
        print(f"  → Filters out current product, shows top 5")

        print(f"\n✅ TRACE COMPLETE")

    except Exception as e:
        separator("ERROR — Backend not available locally")
        print(f"  Error: {e}")
        print(f"\n  This is expected if running outside the backend environment.")
        print(f"  The trace above (Steps 1-3, 7-10) is based on code analysis.")
        print(f"  Steps 4-6 require the backend to be running.")

if __name__ == "__main__":
    run_trace()
