import asyncio
from app.services.smart_search_service import SmartSearchService

async def verify_quality():
    service = SmartSearchService()
    
    print("--- TEST 1: Plum Filtering ---")
    query = "Plum Goodness"
    result = await asyncio.to_thread(service.smart_search, query)
    items = result.get("results", {}).get("online", [])
    
    fruit_count = 0
    for item in items:
        title = item.get("title", "").lower()
        if "1kg" in title or "fruit" in title or "cake" in title:
            print(f"❌ FOUND BAD ITEM: {title}")
            fruit_count += 1
            
    if fruit_count == 0:
        print("✅ PASS: No fruits found in Plum results.")
    else:
        print(f"❌ FAIL: Found {fruit_count} irrelevant items.")

    print("\n--- TEST 2: Old School Rituals Count ---")
    query2 = "Old School Rituals"
    result2 = await asyncio.to_thread(service.smart_search, query2)
    items2 = result2.get("results", {}).get("online", [])
    count = len(items2)
    
    print(f"Total Old School Rituals Found: {count}")
    if count >= 40:
        print("✅ PASS: Count is >= 40.")
    else:
         print(f"❌ FAIL: Count is {count} (Expected 40+).")

if __name__ == "__main__":
    asyncio.run(verify_quality())
