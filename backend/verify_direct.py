import requests
import json

def fetch_shopify_data():
    url = "https://www.oldschoolrituals.in/products.json?limit=250"
    print(f"Fetching {url}...")
    
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        products = data.get("products", [])
        
        print(f"✅ Found {len(products)} products directly from source.\n")
        
        print(f"{'TITLE':<50} | {'PRICE':<10} | {'IMAGE'}")
        print("-" * 100)
        
        valid_count = 0
        for p in products:
            title = p.get("title")
            handle = p.get("handle")
            
            # Get Price
            variants = p.get("variants", [])
            price = "N/A"
            if variants:
                price = variants[0].get("price")
            
            # Get Image
            images = p.get("images", [])
            img_url = "N/A"
            if images:
                img_url = images[0].get("src")
                
            print(f"{title[:47]:<50} | {price:<10} | {img_url[:30]}...")
            
            if title and price != "N/A":
                valid_count += 1
                
        print(f"\nTotal Valid Items: {valid_count}")
        return products
        
    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        return []

if __name__ == "__main__":
    fetch_shopify_data()
