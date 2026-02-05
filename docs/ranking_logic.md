# Smart Search Ranking Logic

This document details the algorithm used in `SmartSearchService._rank_results` to prioritize search results. The goal is to surface the *exact* product the user is looking for, especially when they provide a specific URL.

## The Scoring Algorithm

Every product result starts with a **Score of 0**. Points are added based on the following criteria:

### 1. The "Golden Ticket": Original URL Match (+1000 Points)
If the user provided a URL, we compare it against the URLs of the search results. This is the single most important factor.

*   **Logic**:
    ```python
    if original_url == item_url or (original_url in item_url) or (item_url in original_url):
        score += 1000
    ```
*   **Why**: If Google Shopping returns the exact same link you pasted (or a variant of it), that IS the product. We force it to the top.
*   **Result**: The specific item you searched for appears first, even if other items have similar names.

### 2. Model Number Boost (+500 Points)
We identify "Model Numbers" in your query (words with digits, like `iPhone15`, `MK5022`, `RTX3080`).

*   **Logic**:
    ```python
    if model_term in product_title:
        score += 500
    ```
*   **Why**: Model numbers are specific. "Michael Kors Bag" is vague, but "Michael Kors **35F2GM9M1B**" is precise. A match here strongly indicates the correct variant.

### 3. Exact Phrase Match (+200 Points)
We look for consecutive word pairs (phrases) from your query in the product title.

*   **Logic**: "Jet Set" (Phrase) match is better than just "Jet" ... "Set" appearing separately.
*   **Why**: Preserves the integrity of multi-word product names.

### 4. Brand Match (+50 Points)
Checks if the product title *starts* with the first word of your query (usually the Brand).

*   **Logic**: `title.startswith(query_terms[0])`
*   **Why**: Ensures brand relevancy. If you search "Nike Shoes", results starting with "Nike..." are prioritized over "Adidas (similar to Nike)".

### 5. Term Overlap (+10 Points per word)
Basic keyword matching.

*   **Logic**: +10 points for every word from your query found in the title.
*   **Why**: General relevance fallback.

---

## Example Scenario

**User Search**: `https://michaelkors.com/jet-set-tote-mk123`
*   **Extracted Query**: "Michael Kors Jet Set Tote MK123"

**Candidate Results:**

| Result Product | Points Breakdown | Total Score | Rank |
| :--- | :--- | :--- | :--- |
| **1. MK Jet Set Tote (URL Match)** | **URL Match (+1000)**<br>Brand (+50)<br>Model (+500)<br>Phrase (+200) | **1750** | **#1** 🏆 |
| **2. MK Jet Set Tote (Diff Store)** | Brand (+50)<br>Model (+500)<br>Phrase (+200) | **750** | **#2** |
| **3. MK Jet Set Wallet** | Brand (+50)<br>Phrase "Jet Set" (+200) | **260** | **#3** |
| **4. Generic White Tote** | Term "Tote" (+10) | **10** | **#4** |

## Conclusion
The **URL Match (+1000)** effectively "short-circuits" the ranking, guaranteeing that if we found the link you gave us, it wins. If not, the **Model Number (+500)** acts as the secondary anchor for high precision.

---

## Data Schema: The Result Object 📄

Here is an example of a single **"Online Result Item"** as it flows through the Ranking Engine.

```json
{
  "title": "BRUTON Sport Shoes for Men | Running Sneaker (Blue)",
  "url": "https://www.amazon.in/dp/B0F2THXY4T?th=1",
  "price": "₹499.00",
  "source": "Amazon.in",
  "thumbnail": "https://m.media-amazon.com/images/I/71xyz.jpg",
  
  // --- Fields Added by The Judge (Ranker) ---
  "match_quality": "id_match",  // Reasons: id_match, exact_url, fuzzy_url, exact_text, related
  "match_score": 1750           // The finalized score used for sorting
}
```

### Key Fields Breakdown
*   **`title` & `url`**: The raw data from Google Shopping.
*   **`source`**: The retailer name (e.g., Flipkart, Amazon).
*   **`match_quality`**: The final verdict from the ranker. This tells the Frontend how to display the item (e.g., show a "Top Match" badge).
*   **`match_score`**: The numeric score.
    *   `> 1000`: Verified Match (ID or Exact URL).
    *   `> 500`: Strong Match (Model Number).
    *   `< 300`: Weak/Text Match.
