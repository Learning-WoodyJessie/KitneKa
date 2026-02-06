import asyncio
from app.services.smart_search_service import SmartSearchService

async def verify_boost():
    service = SmartSearchService()
    query = "Old School Rituals"
    print(f"Testing Search for: {query}")
    
    result = await asyncio.to_thread(service.smart_search, query)
    
    online_results = result.get("results", {}).get("online", [])
    count = len(online_results)
    
    print(f"Total Results Found: {count}")
    
    if count < 10:
        print("❌ FAIL: Count is too low.")
    else:
        print("✅ PASS: Boost logic likely working.")
        
    # Print a few titles to verify relevance
    for i, item in enumerate(online_results[:5]):
        print(f"{i+1}. {item.get('title')} - {item.get('price')}")

if __name__ == "__main__":
    asyncio.run(verify_boost())
