# Logic: Mapping URL -> Product Name

The system uses a sophisticated **6-Step Waterfall** approach to extract a clean product identity from a raw URL.

## The 6-Step Waterfall 🌊

### Step 1: Link Resolution (The Un-Shortener)
First, we resolve shortened links (`amzn.to`, `bit.ly`) to their final destination.
*   **Method**: `HEAD` request to follow redirects.
*   **Goal**: Get the real URL where data lives.

### Step 2: HTML Metadata (The "Quick Peek") 🚀
**New**: Before doing anything heavy, we check if the page has structured data.
*   **Method**: Lightweight HTML fetch (timeout: 3s).
*   **Goal**: Extract:
    *   **Canonical URL** (`<link rel="canonical" ...>`)
    *   **JSON-LD** (`@type: Product`) - The Gold Standard.
    *   **OG Title** (`<meta property="og:title" ...>`)

### Step 3: Stable ID Extraction (The Fingerprint) 🧬
We scan the URL for known Product IDs.
*   **Regex**: `/(?:dp|gp/product)/([A-Z0-9]{10})` (Amazon ASIN).
*   **Why**: IDs are more accurate than names. If we find `B0F2THXY4T`, we know *exactly* what this is.

### Step 4: SerpAPI Strategy (The Google Fallback)
If metadata failed, we ask Google.
*   **Query**: `https://www.amazon.in/...`
*   **Method**: Google Search API.
*   **Goal**: Get the Title/Snippet that Google indexed.

### Step 5: Path Parsing (The Regex Fallback)
If external tools fail, we parse the URL text itself.
*   **Method**: Split URL (`/my-shoe-name/dp/...`) and clean hyphens.
*   **Goal**: Get a rough "best guess" name.

### Step 6: AI Refinement (The Polisher) ✨
Finally, we send the messy extracted text to **OpenAI (GPT-3.5)**.
*   **Input**: *"BRUTON Sport Shoes for Men Running White Size 10..."*
*   **Prompt**: *"Extract: 'product_name' (concise), 'brand'. Remove SEO filler."*
*   **Output**: "BRUTON Sport Shoes"
*   **Why**: Ensures we search for the *product*, not the *keywords*.

---

## Canonicalization Strategy
The user asked: *"Are we doing canonicalization?"*

**Answer: Yes, but in two specific layers.**

### 1. Technical Canonicalization (Redirect Resolution)
We **always** resolve the URL to its final destination and verify against `<link rel="canonical">`.

### 2. Parameter Handling (Fuzzy Canonicalization)
We **do not** aggressively strip all query parameters. Instead, we use **Normalization & Match Levels**.

*   **Normalization**: We strip tracking params (`utm_`, `ref`, `source`) and lowercase the URL.
*   **Match Levels**:
    1.  **ID Match** (+1500 pts): Does the ASIN match?
    2.  **Canonical Match** (+1200 pts): Do the official URLs match?
    3.  **Fuzzy/Prefix Match** (+800 pts): Is the URL fundamentally the same?

This gives us the accuracy of strict canonicalization without the maintenance burden of per-site rules.
