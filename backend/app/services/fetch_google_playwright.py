import asyncio
from playwright.async_api import async_playwright

async def fetch_google_shopping(query):
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Google Shopping URL
        url = f"https://www.google.com/search?q={query}&tbm=shop&gl=in"
        print(f"Navigating to {url}...")
        
        await page.goto(url)
        
        # Wait for some results to load
        try:
            await page.wait_for_selector('div.sh-dgr__content', timeout=5000) # Common class for shopping cards
            print("Found shopping results!")
        except:
            print("Specific selector not found, waiting for body...")
            await page.wait_for_selector('body')

        # Get content
        content = await page.content()
        
        with open("google_shopping_playwright.html", "w", encoding="utf-8") as f:
            f.write(content)
        
        print("Saved rendered HTML to google_shopping_playwright.html")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(fetch_google_shopping("iPhone 15"))
