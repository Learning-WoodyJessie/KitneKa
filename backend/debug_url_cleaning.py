
import requests
import re
from urllib.parse import unquote

def _clean_google_url(url: str) -> str:
    try:
        if "url?q=" in url:
            start = url.find("url?q=") + len("url?q=")
            end = url.find("&", start)
            if end != -1:
                return unquote(url[start:end])
            else:
                return unquote(url[start:])
        return url
    except:
        return url

def _clean_tracking_params(url: str) -> str:
    if "?" not in url:
        return url
    
    try:
        bad_params = ['srsltid', 'gclid', 'fbclid', 'dclid', 'msclkid']
        cleaned_url = url
        for param in bad_params:
            cleaned_url = re.sub(f'[?&]{param}=[^&]*', '', cleaned_url)
        
        if '?' not in cleaned_url and '&' in cleaned_url:
            cleaned_url = cleaned_url.replace('&', '?', 1)
            
        if cleaned_url.endswith('?') or cleaned_url.endswith('&'):
            cleaned_url = cleaned_url[:-1]
            
        return cleaned_url
    except:
        return url

# Test Cases
test_urls = [
    # Standard Google Redirect
    "https://www.google.com/url?q=https://www.myntra.com/watches/michael-kors/watch&sa=U&ved=0ahUKEwi...",
    # Complex Google Redirect
    "https://www.google.co.in/url?q=https://www.flipkart.com/shirt/p/itm123?pid=123&srsltid=AfmBOor...&source=gmail",
    # Direct with tracking
    "https://www.myntra.com/dress?srsltid=AfmBOor...",
    # Already clean
    "https://www.amazon.in/dp/B08L5V",
    # User's Problem URL? (Simulated)
    "https://www.google.com/url?q=https://www.myntra.com/watches/michael+kors/michael-kors-women-bracelet-style-chronograph-watch-mk6475i/1812549/buy&sa=U"
]

print("--- Testing URL Cleaning ---")
for url in test_urls:
    print(f"\nOriginal: {url}")
    step1 = _clean_google_url(url)
    print(f"Cleaned Google: {step1}")
    step2 = _clean_tracking_params(step1)
    print(f"Final: {step2}")
