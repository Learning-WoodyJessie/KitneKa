
---

## Trace 3: Myntra Generic Path Fix (M.A.C Cream) 💄

**Input URL**:
`https://www.myntra.com/mailers/skin-care/m.a.c/m.a.c-mini-strobe-cream-15-ml---pinklite/12218208/buy`

This example shows how we handle generic path segments (`mailers`, `skin-care`) that used to pollute the search query.

### Step 1: Extraction (Path Parsing)
*   **Raw Path**: `/mailers/skin-care/m.a.c/m.a.c-mini-strobe-cream...`
*   **Old Logic**: Extracted "Mailers Skin Care M.A.C".
*   **New Logic**:
    *   Ignores: `mailers`, `skin-care`, `buy`.
    *   Extracts: **"M.A.C m.a.c mini strobe cream 15 ml pinklite"**
    *   **Refined Query**: **"M.A.C m.a.c mini strobe cream"** (First 5 words).

### Step 2: The Manager (Search)
*   Searches Google Shopping for: "M.A.C m.a.c mini strobe cream".
*   *Result*: Accurate product results found.

### Step 3: The Judge (Ranking)
*   **Myntra Result**: Found via **Fuzzy Path Match** (`/12218208` matches `/12218208/buy`). **(Score +800)**
*   **Nykaa/Amazon Results**: Found via **Text Match**.
