from bs4 import BeautifulSoup

def analyze():
    with open("google_shopping_sample.html", "r", encoding="utf-8") as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Strategy: Find a price text (e.g., "₹") and print its parent classes
    # This helps us find the "Price" class.
    
    print("--- Finding Price Classes ---")
    prices = soup.find_all(string=lambda text: text and "₹" in text)
    for i, p in enumerate(prices[:5]):
        parent = p.parent
        print(f"Price {i}: '{p}' -> Tag: {parent.name}, Classes: {parent.get('class')}")
        # Go up to find the card container
        container = parent.find_parent('div')
        if container:
             print(f"  Parent Div Classes: {container.get('class')}")

    print("\n--- Finding Title Classes ---")
    # Look for h3 or common title tags usually found near prices
    # We can assume the structure is usually Title -> ... -> Price
    titles = soup.find_all('h3') 
    for i, t in enumerate(titles[:5]):
        print(f"Title {i}: '{t.get_text(strip=True)}' -> Classes: {t.get('class')}")

if __name__ == "__main__":
    analyze()
