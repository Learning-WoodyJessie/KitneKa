# Logic: Mapping URL -> Product Name

The system uses a "Waterfall" approach to extract a clean product name (e.g., "Michael Kors Jet Set Tote") from a raw URL. If one method fails, it falls back to the next.

## The 4-Step Waterfall

### Step 1: Link Resolution (The Un-Shortener)
First, we check if the link is a shortened URL (like `amzn.to/xyz` or `bit.ly/abc`).
*   **Action**: We try a `HEAD` request to follow the redirect chain.
*   **Result**: We get the "Real" final URL (e.g., `https://www.amazon.in/Michael-Kors-Tote...`).

### Step 2: SerpAPI Strategy (The "Google It" Method)
We ask Google directly: *"What is the title of this page?"*
*   **Query**: `site:amazon.in https://www.amazon.in/Michael-Kors...`
*   **Why**: Google has already crawled the page. Its cache is faster than visiting the site ourselves.
*   **Extraction**: We take the `title` and `snippet` from the first organic result.
*   **Success Rate**: ~90% for popular e-commerce sites.

### Step 3: DOM Scraping (The "Headless Browser" Method)
**Trigger**: If Step 2 fails OR returns a generic title like "Amazon Product", we use a headless browser (Playwright).
*   **Action**: We launch a hidden Chromium browser and visit the page.
*   **Targeting**: We look for specific HTML ID/Class tags used by major retailers:
    *   `#productTitle` (Amazon)
    *   `h1#title` (General)
    *   `.B_NuCI` (Flipkart)
*   **Why**: This gets the *exact* text displayed on the page, avoiding "SEO Metadata" which can be messy.

### Step 4: URL Path Parsing (The Regex Fallback)
If all external calls fail, we analyze the URL string itself.
*   **Example URL**: `.../Michael-Kors-Jet-Set-Tote/dp/B012345`
*   **Regex Logic**:
    1.  Split URL by `/`
    2.  Ignore known garbage segments (`dp`, `product`, `ref=...`)
    3.  Find segments that look like names (`Michael-Kors...`)
    4.  Identify Brand identifiers in query params (Amazon uses `p_89`).
    5.  Clean hyphens: `Michael-Kors` -> `Michael Kors`

---

## The AI Refinement Layer (The Polisher)
Once we have a raw string from one of the steps above (which might be messy like *"Michael Kors Tote Bag - Blue 2024 Model [Best Value]..."*), we pass it to **OpenAI (GPT-3.5)**.

*   **Prompt**: *"Extract: 'product_name', 'brand', 'model', 'search_query' (optimized for India). Return JSON."*
*   **Input**: The messy title we found.
*   **Output**: A clean, structured JSON object.
    *   `product_name`: "Michael Kors Jet Set Tote"
    *   `search_query`: "Michael Kors Jet Set Tote Blue" (Optimized for shopping search)

## Final Output
This clean `search_query` is what gets sent to the search engine, ensuring we search for the *item*, not the *link*.

## Canonicalization Strategy
The user asked: *"Are we doing canonicalization?"*

**Answer: Yes, but in two specific layers.**

### 1. Technical Canonicalization (Redirect Resolution)
We **always** resolve the URL to its final destination before processing.
*   **Input**: `https://amzn.to/3xyz` (Short Link)
*   **Process**: Follow HTTP 301/302 Redirects.
*   **Canonical Output**: `https://www.amazon.in/Sony-Headphones...`
*   **Why**: We cannot scrape or identify a product from a shortened wrapper.

### 2. Parameter Handling (Fuzzy Canonicalization)
We **do not** aggressively strip all query parameters (like `?ref=`, `?source=`) from the URL string we store. Instead, we use **Fuzzy Matching** in our ranking logic.

*   **Problem**: `amazon.in/p/123?ref=mobile` != `amazon.in/p/123`
*   **Our Solution**: We use an inclusion check:
    ```python
    if original_url in item_url or item_url in original_url:
        score += 1000
    ```
*   **Benefit**: This is safer than writing complex Regex to strip parameters for every single retailer domain (Amazon, Flipkart, Myntra, etc.), which breaks often. Use the "Core" URL text for the match, ignore the noise.
