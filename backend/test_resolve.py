import requests
from bs4 import BeautifulSoup

def resolve_viewer_link(url: str) -> str:
    print(f"Resolving: {url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        links = soup.find_all('a')
        
        # 1. Look for "Visit site"
        for link in links:
            if "Visit site" in link.get_text():
                href = link.get('href')
                if href and href.startswith("http"):
                    print(f"Found 'Visit site': {href}")
                    return href

        # 2. Look for any external link that isn't google
        for link in links:
            href = link.get('href')
            if href and href.startswith("http") and "google." not in href:
                 print(f"Found fallback: {href}")
                 return href
                 
        print("No direct link found.")
        return url
        
    except Exception as e:
        print(f"Error: {e}")
        return url

if __name__ == "__main__":
    url = "https://www.google.com/search?ibp=oshop&q=Women%27s%20Wear&prds=catalogid:11864382942291042997,headlineOfferDocid:15708213893158791770,imageDocid:2185056202624057878,pvt:a&hl=en&gl=in&udm=28"
    resolve_viewer_link(url)
