# Fabindia Kalamkari Dress — Smart Matching Pipeline Trace
URL: https://www.fabindia.com/red-cotton-kalamkari-printed-midi-dress-20124192?currencyCode=USD&nsbp=true
Timestamp: 2026-02-17 21:34:50

## STEP 1 — URL Resolution & HTML Metadata Extraction
────────────────────────────────────────────────────────────
Resolved URL: https://www.fabindia.com/red-cotton-kalamkari-printed-midi-dress-20124192?currencyCode=USD&nsbp=true
HTML Title:   Red Cotton Kalamkari Printed Midi Dress
OG Site:      N/A
JSON-LD name: Red Cotton Kalamkari Printed Midi Dress
JSON-LD brand:N/A
Time: 0.45s

Using title: 'Red Cotton Kalamkari Printed Midi Dress'
Using image: https://apisap.fabindia.com/medias/20124191-01.jpg?context=bWFzdGVyfGltYWdlc3wxNTQyMDV8aW1hZ2UvanBlZ3xhR1JsTDJnek55OHhNemc1TkRVek5USXhOekU0TWk4eU1ERXlOREU1TVY4d01TNXFjR2N8MDZkYzJkM2I5MjZkY2IxNGVmZjczMTFhNzEwYmFjNjIwODZkNzczNjBjODZiYjgyYmIxZTBjZTVmMDMyMjc5Mg

## STEP 2 — Layer 1: Structured Product Extraction (GPT-4o-mini)
────────────────────────────────────────────────────────────
Source: llm_vision (5.58s)

Structured attributes:
  title          : Red Cotton Kalamkari Printed Midi Dress
  brand          : Unknown
  category       : Women's Ethnic Wear
  color          : red
  material       : Cotton
  pattern        : kalamkari
  length         : midi
  type           : dress
  price          : None
  search_query   : Cotton Kalamkari Printed Midi Dress
  match_keywords : ['Red', 'Cotton', 'Kalamkari', 'Printed', 'Midi', 'Dress']
  images         : ['https://apisap.fabindia.com/medias/20124191-01.jpg?context=bWFzdGVyfGltYWdlc3wxNTQyMDV8aW1hZ2UvanBlZ3xhR1JsTDJnek55OHhNemc1TkRVek5USXhOekU0TWk4eU1ERXlOREU1TVY4d01TNXFjR2N8MDZkYzJkM2I5MjZkY2IxNGVmZjczMTFhNzEwYmFjNjIwODZkNzczNjBjODZiYjgyYmIxZTBjZTVmMDMyMjc5Mg']

✅ Brand-neutral query for SerpAPI: 'Cotton Kalamkari Printed Midi Dress'
   (Original title was: 'Red Cotton Kalamkari Printed Midi Dress')

## STEP 3 — Layer 2: SerpAPI Search with Brand-Neutral Query
────────────────────────────────────────────────────────────
SerpAPI returned 40 results in 0.13s

Top 5 raw results:
  1. [Myntra] fabindia Red Cotton Kalamkari Printed Midi Dress — ₹2343.0
  2. [Fabindia] Black Cotton Kalamkari Printed Midi Dress — ₹3499.0
  3. [amazon.in] HOK Women's Midi Dress Original Kalamkari Potli Pattern (Red, Pure Cot — ₹1350.0
  4. [ScrollnShops] Buy Charu Bhaskar Beige Kalamkari Flared Dress Online — ₹3699.0
  5. [Myntra - MNow] fabindia Orange Cotton Kalamkari Printed Peony Ruffle Midi Dress — ₹2155.0

## STEP 4 — Fuzzy Pre-scoring (all results)
────────────────────────────────────────────────────────────
Fuzzy-scored 40 results. Top 20 selected for LLM scoring.

Top 10 by fuzzy score:
   1. score= 35 [Myntra] fabindia Red Cotton Kalamkari Printed Midi Dress
   2. score= 35 [amazon.in] HOK Women's Midi Dress Original Kalamkari Potli Pattern (Red
   3. score= 35 [AJIO.com] fabindia Red Cotton Kalamkari Printed Peony Ruffle Midi Dres
   4. score= 35 [Nykaa Fashion] Red Kalamkari Print Goa Holiday Cotton Dress
   5. score= 35 [amazon.in] Magnetism Women's Kalamkari Print Cotton Midi Dress, Sleevel
   6. score= 25 [Fabindia] Black Cotton Kalamkari Printed Midi Dress
   7. score= 25 [ScrollnShops] Buy Charu Bhaskar Beige Kalamkari Flared Dress Online
   8. score= 25 [Myntra - MNow] fabindia Orange Cotton Kalamkari Printed Peony Ruffle Midi D
   9. score= 25 [Fabindia] fabindia Maroon Cotton Kalamkari Printed Peony Ruffle Midi D
  10. score= 25 [amazon.in] Magnetism Kalamkari Print Cotton Midi Dress, Sleeveless A-Li

## STEP 5 — Layer 3: LLM Batch Match Scoring (GPT-4o-mini)
────────────────────────────────────────────────────────────
LLM scored 20 candidates in 14.94s (1 API call)

Classification breakdown: EXACT=2, VARIANT=0, SIMILAR=18

LLM results for top 20:
   1. EXACT    (conf=0.90) [Myntra] fabindia Red Cotton Kalamkari Printed Midi Dress
       reason: Same brand, type, color, material, and pattern.
   2. SIMILAR  (conf=0.80) [amazon.in] HOK Women's Midi Dress Original Kalamkari Potli Pa
       reason: Same type and color, but different pattern (Potli pattern).
   3. EXACT    (conf=0.90) [AJIO.com] fabindia Red Cotton Kalamkari Printed Peony Ruffle
       reason: Same brand, type, color, material, and pattern.
   4. SIMILAR  (conf=0.70) [Nykaa Fashion] Red Kalamkari Print Goa Holiday Cotton Dress
       reason: Same color and material, but different style and pattern.
   5. SIMILAR  (conf=0.70) [amazon.in] Magnetism Women's Kalamkari Print Cotton Midi Dres
       reason: Same type and color, but different style (Sleeveless V-Neck)
   6. SIMILAR  (conf=0.60) [Fabindia] Black Cotton Kalamkari Printed Midi Dress
       reason: Different color and style, but same material and pattern.
   7. SIMILAR  (conf=0.50) [ScrollnShops] Buy Charu Bhaskar Beige Kalamkari Flared Dress Onl
       reason: Different color and style, but same material and pattern.
   8. SIMILAR  (conf=0.50) [Myntra - MNow] fabindia Orange Cotton Kalamkari Printed Peony Ruf
       reason: Different color and style, but same material and pattern.
   9. SIMILAR  (conf=0.50) [Fabindia] fabindia Maroon Cotton Kalamkari Printed Peony Ruf
       reason: Different color and style, but same material and pattern.
  10. SIMILAR  (conf=0.60) [amazon.in] Magnetism Kalamkari Print Cotton Midi Dress, Sleev
       reason: Same type and color, but different style (Sleeveless A-Line)
  11. SIMILAR  (conf=0.50) [Myntra - MNow] fabindia Beige Cotton Kalamkari Printed Peony Ruff
       reason: Different color and style, but same material and pattern.
  12. SIMILAR  (conf=0.50) [Myntra] fabindia Maroon Cotton Kalamkari Printed Midi Dres
       reason: Different color and style, but same material and pattern.
  13. SIMILAR  (conf=0.40) [amazon.in] Kuruti B sheets Brand Women's Designer Midi-Dress 
       reason: Different style and pattern, but same category.
  14. SIMILAR  (conf=0.40) [Unblockbyjenny] Black Kalamkari Handblock Printed Frock Style Cott
       reason: Different color and style, but same material and pattern.
  15. SIMILAR  (conf=0.40) [Studio Trayee] Shravani Kalamkari Cotton Dress
       reason: Different style and pattern, but same category.
  16. SIMILAR  (conf=0.40) [Myntra] Black Cotton Flax Kalamkari Printed Pocket Dress
       reason: Different color and style, but same material and pattern.
  17. SIMILAR  (conf=0.40) [BaSaKa] Kalamkari Earth Blossom COTTON Dress
       reason: Different style and pattern, but same category.
  18. SIMILAR  (conf=0.40) [Myntra] Fairies Forever Blue & Red Kalamkari Kaftan Midi D
       reason: Different style and pattern, but same category.
  19. SIMILAR  (conf=0.40) [InWeave] InWeave Women's Paisley Kalamkari Flared Dress
       reason: Different style and pattern, but same category.
  20. SIMILAR  (conf=0.40) [Naksh Fashion Studio] Kalamkari Cotton Dress
       reason: Different style and pattern, but same category.

## STEP 6 — Final Classification (LLM for top 20, fuzzy for rest)
────────────────────────────────────────────────────────────
EXACT matches:   2
VARIANT matches: 0
SIMILAR matches: 38

EXACT matches:
  ✅ [Myntra] fabindia Red Cotton Kalamkari Printed Midi Dress — ₹2343.0
     LLM reason: Same brand, type, color, material, and pattern.
  ✅ [AJIO.com] fabindia Red Cotton Kalamkari Printed Peony Ruffle Midi Dress — ₹1931.0
     LLM reason: Same brand, type, color, material, and pattern.

## STEP 7 — Layer 4: Image Matching (top EXACT candidates)
────────────────────────────────────────────────────────────
Source image: https://apisap.fabindia.com/medias/20124191-01.jpg?context=bWFzdGVyfGltYWdlc3wxNTQyMDV8aW1hZ2UvanBlZ3xhR1JsTDJnek55OHhNemc1TkRVek5USXhOekU0TWk4eU1ERXlOREU1TVY4d01TNXFjR2N8MDZkYzJkM2I5MjZkY2IxNGVmZjczMTFhNzEwYmFjNjIwODZkNzczNjBjODZiYjgyYmIxZTBjZTVmMDMyMjc5Mg

  ✅ KEPT (img_score=95) [Myntra] fabindia Red Cotton Kalamkari Printed Midi Dress (2.14s)
  ✅ KEPT (img_score=40) [AJIO.com] fabindia Red Cotton Kalamkari Printed Peony Ruffle (2.98s)

## STEP 8 — /product/compare Deduplication (simulate backend)
────────────────────────────────────────────────────────────
After dedup by store: 27 unique stores

Price comparison table:
  Store                        Price  Match       Title
  ------------------------- --------  ----------  ----------------------------------------
  Amazon.in                 ₹  299.0  SIMILAR     Monique Brand Women's Jaipuri Print Long
  Myntra                    ₹  389.0  SIMILAR     Myntra Taavi Kalamkari Indie Floral Prin
  amazon.in                 ₹  436.0  SIMILAR     Kuruti B sheets Brand Women's Designer M
  Swaabha                   ₹  899.0  SIMILAR     Kalamkaari floral cotton midi dress
  Fashor.com                ₹ 1199.0  SIMILAR     Fashor Kalamkari Printed A-Line Pleated 
  InWeave                   ₹ 1249.0  SIMILAR     InWeave Women's Paisley Kalamkari Flared
  Parikala                  ₹ 1249.0  SIMILAR     Parikala Women's Kalamkari Printed Dress
  Maybell                   ₹ 1299.0  SIMILAR     Printed Kalamkari Ethnic Dress
  Musings                   ₹ 1450.0  SIMILAR     Aaradhya Kalamkari Block Printed Sleevel
  Nykaa Fashion             ₹ 1520.0  SIMILAR     WEAVLLITE Blue Sanganeri Cotton Kalamkar
  Sukhi                     ₹ 1650.0  SIMILAR     Antique Sunshine Kalamkari Dress
  TATA CLiQ LUXURY          ₹ 1665.0  SIMILAR     Okhai Festive Jigar Hand Block Printed K
  The Phoenix Company       ₹ 1680.0  SIMILAR     Olive Printed Kalamkari Dress
  Studio Trayee             ₹ 1750.0  SIMILAR     Shravani Kalamkari Cotton Dress
  Unblockbyjenny            ₹ 1890.0  SIMILAR     Black Kalamkari Handblock Printed Frock 

## SUMMARY
────────────────────────────────────────────────────────────
Brand-neutral query used:  'Cotton Kalamkari Printed Midi Dress'
Total SerpAPI results:     40
EXACT matches found:       2
VARIANT matches found:     0
Unique stores in compare:  27
LLM extraction source:     llm_vision