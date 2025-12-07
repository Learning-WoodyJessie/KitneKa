import requests
import random

def fetch_google_shopping(query):
    # Google Shopping URL pattern
    url = "https://www.google.com/search"
    params = {
        "q": query,
        "tbm": "shop", # vital: switches to Shopping tab
        "hl": "en",    # English
        "gl": "in"     # India
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
    }
    
    print(f"Fetching {url} for '{query}'...")
    response = requests.get(url, params=params, headers=headers)
    
    if response.status_code == 200:
        print("Success! Saving html...")
        with open("google_shopping_sample.html", "w", encoding="utf-8") as f:
            f.write(response.text)
        print("Saved to google_shopping_sample.html")
    else:
        print(f"Failed: {response.status_code}")

if __name__ == "__main__":
    fetch_google_shopping("iPhone 15")
