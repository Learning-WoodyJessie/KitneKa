import os
from dotenv import load_dotenv
import requests

# Load env
load_dotenv()

key = os.getenv("SERPAPI_API_KEY")

print(f"Checking SerpApi Key...")

if not key:
    print("❌ ERROR: SERPAPI_API_KEY is missing from environment/file.")
else:
    masked = key[:4] + "..." + key[-4:]
    print(f"ℹ️  Found Key: {masked}")
    
    # Test Request
    print("Testing key with a small request...")
    url = f"https://serpapi.com/search.json?q=Coffee&api_key={key}&num=1"
    try:
        resp = requests.get(url)
        data = resp.json()
        
        if resp.status_code == 200 and "error" not in data:
            print("✅ SUCCESS: Key is valid and working!")
        else:
            print(f"❌ FAILED: API returned {resp.status_code}")
            print(f"Error Message: {data.get('error')}")
            
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
