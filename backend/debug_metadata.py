
import requests
from bs4 import BeautifulSoup

url = "https://www.amazon.in/BRUTON-Sport-Shoes-Running-White/dp/B0F2THXY4T?source=ps-sl-shoppingads-lpcontext&ref_=fplfs&smid=A22K40KEJWHSL8&th=1&psc=1"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

print(f"Fetching URL...")
try:
    resp = requests.get(url, headers=headers, timeout=5)
    soup = BeautifulSoup(resp.content, 'html.parser')
    
    print("\n--- STEP 2: METADATA EXTRACTION ---")
    if soup.title:
        print(f"Found HTML <title>: '{soup.title.string.strip()}'")
    else:
        print("No <title> tag found.")
        
    og_title = soup.find("meta", property="og:title")
    if og_title:
        print(f"Found <meta property='og:title'>: '{og_title['content']}'")
        
except Exception as e:
    print(f"Error fetching: {e}")
