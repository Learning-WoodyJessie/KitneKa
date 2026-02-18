"""
Step-by-step trace of the Smart Product Matching Pipeline
for the Fabindia Kalamkari Dress URL.

Runs all 4 layers and documents output at each step.
Results are written to: tests/fabindia_pipeline_results.md
"""

import sys
import os
import json
import time

# ── Load .env FIRST before any backend imports ────────────────────────────────
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)
print(f"[ENV] Loaded .env from: {os.path.abspath(env_path)}")
print(f"[ENV] SERPAPI_API_KEY present: {bool(os.environ.get('SERPAPI_API_KEY'))}")
print(f"[ENV] OPENAI_API_KEY present:  {bool(os.environ.get('OPENAI_API_KEY'))}")
print()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.url_scraper_service import URLScraperService
from app.services.smart_search_service import SmartSearchService

# ── Config ────────────────────────────────────────────────────────────────────
FABINDIA_URL = (
    "https://www.fabindia.com/red-cotton-kalamkari-printed-midi-dress-20124192"
    "?currencyCode=USD&nsbp=true"
)
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "fabindia_pipeline_results.md")

url_service = URLScraperService()
searcher = SmartSearchService()

lines = []  # Collect all output lines for the markdown file

def log(text=""):
    print(text)
    lines.append(text)

def section(title):
    log()
    log(f"## {title}")
    log("─" * 60)

def subsection(title):
    log()
    log(f"### {title}")

# ─────────────────────────────────────────────────────────────────────────────
log("# Fabindia Kalamkari Dress — Smart Matching Pipeline Trace")
log(f"URL: {FABINDIA_URL}")
log(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")

# ══════════════════════════════════════════════════════════════════════════════
section("STEP 1 — URL Resolution & HTML Metadata Extraction")
# ══════════════════════════════════════════════════════════════════════════════

t0 = time.time()
resolved = url_service._resolve_url(FABINDIA_URL)
log(f"Resolved URL: {resolved}")

html_meta = url_service._extract_metadata_from_html(resolved)
log(f"HTML Title:   {html_meta.get('title', 'N/A')}")
log(f"OG Site:      {html_meta.get('og_site_name', 'N/A')}")
json_ld = html_meta.get('json_ld', {})
log(f"JSON-LD name: {json_ld.get('name', 'N/A')}")
log(f"JSON-LD brand:{json_ld.get('brand', 'N/A')}")
log(f"Time: {time.time()-t0:.2f}s")

# Determine the product title to use
product_title = json_ld.get('name') or html_meta.get('title') or "Red Cotton Kalamkari Printed Midi Dress"
product_image = None
if json_ld.get('image'):
    img = json_ld['image']
    product_image = img[0] if isinstance(img, list) else img
log(f"\nUsing title: '{product_title}'")
log(f"Using image: {product_image or 'None (will skip Vision step)'}")

# ══════════════════════════════════════════════════════════════════════════════
section("STEP 2 — Layer 1: Structured Product Extraction (GPT-4o-mini)")
# ══════════════════════════════════════════════════════════════════════════════

t0 = time.time()
attrs = url_service._extract_structured_attributes(product_title, image_url=product_image)
elapsed = time.time() - t0

log(f"Source: {attrs.get('source', 'unknown')} ({elapsed:.2f}s)")
log()
log("Structured attributes:")
for key in ["title", "brand", "category", "color", "material", "pattern", "length", "type", "price"]:
    log(f"  {key:15}: {attrs.get(key, '')}")
log(f"  {'search_query':15}: {attrs.get('search_query', '')}")
log(f"  {'match_keywords':15}: {attrs.get('match_keywords', [])}")
log(f"  {'images':15}: {attrs.get('images', [])}")

brand_neutral_query = attrs.get("search_query") or product_title
log(f"\n✅ Brand-neutral query for SerpAPI: '{brand_neutral_query}'")
log(f"   (Original title was: '{product_title}')")

# ══════════════════════════════════════════════════════════════════════════════
section("STEP 3 — Layer 2: SerpAPI Search with Brand-Neutral Query")
# ══════════════════════════════════════════════════════════════════════════════

t0 = time.time()
scraper_response = searcher.scraper.search_products(brand_neutral_query)
all_results = scraper_response.get("online", [])
elapsed = time.time() - t0

log(f"SerpAPI returned {len(all_results)} results in {elapsed:.2f}s")
log()
log("Top 5 raw results:")
for i, r in enumerate(all_results[:5]):
    log(f"  {i+1}. [{r.get('source','')}] {r.get('title','')[:70]} — ₹{r.get('price',0)}")

# ══════════════════════════════════════════════════════════════════════════════
section("STEP 4 — Fuzzy Pre-scoring (all results)")
# ══════════════════════════════════════════════════════════════════════════════

target_brand = attrs.get("brand", "")
target_fingerprint = {
    "color": attrs.get("color", ""),
    "material": attrs.get("material", ""),
    "collection": attrs.get("pattern", ""),  # pattern maps to collection for fingerprint
    "image_url": (attrs.get("images") or [None])[0],
    "is_image_search": False
}

for item in all_results:
    calc = searcher._calculate_match_score(
        target_model=None,
        target_brand=target_brand,
        target_fingerprint=target_fingerprint,
        candidate_title=item.get("title", ""),
        candidate_source=item.get("source", ""),
        candidate_image_url=item.get("thumbnail") or item.get("image")
    )
    item["match_score"] = calc["score"]
    item["match_reasons"] = calc["reasons"]

all_results.sort(key=lambda x: x.get("match_score", 0), reverse=True)
top20 = all_results[:20]

log(f"Fuzzy-scored {len(all_results)} results. Top 20 selected for LLM scoring.")
log()
log("Top 10 by fuzzy score:")
for i, r in enumerate(top20[:10]):
    log(f"  {i+1:2}. score={r['match_score']:3} [{r.get('source','')}] {r.get('title','')[:60]}")

# ══════════════════════════════════════════════════════════════════════════════
section("STEP 5 — Layer 3: LLM Batch Match Scoring (GPT-4o-mini)")
# ══════════════════════════════════════════════════════════════════════════════

t0 = time.time()
llm_scores = searcher._llm_score_matches(attrs, top20)
elapsed = time.time() - t0

log(f"LLM scored {len(llm_scores)} candidates in {elapsed:.2f}s (1 API call)")
log()

exact_count = sum(1 for v in llm_scores.values() if v["classification"] == "EXACT")
variant_count = sum(1 for v in llm_scores.values() if v["classification"] == "VARIANT")
similar_count = sum(1 for v in llm_scores.values() if v["classification"] == "SIMILAR")
log(f"Classification breakdown: EXACT={exact_count}, VARIANT={variant_count}, SIMILAR={similar_count}")
log()

log("LLM results for top 20:")
for i, item in enumerate(top20):
    llm = llm_scores.get(i, {})
    cls = llm.get("classification", "NOT_SCORED")
    conf = llm.get("confidence", 0)
    reason = llm.get("reason", "")[:60]
    log(f"  {i+1:2}. {cls:8} (conf={conf:.2f}) [{item.get('source','')}] {item.get('title','')[:50]}")
    if reason:
        log(f"       reason: {reason}")

# ══════════════════════════════════════════════════════════════════════════════
section("STEP 6 — Final Classification (LLM for top 20, fuzzy for rest)")
# ══════════════════════════════════════════════════════════════════════════════

exact_matches = []
variant_matches = []
similar_matches = []

for i, item in enumerate(top20):
    llm = llm_scores.get(i, {})
    llm_class = llm.get("classification", "").upper()
    llm_conf = llm.get("confidence", 0.5)
    item["llm_reason"] = llm.get("reason", "")
    score = item["match_score"]

    if llm_class == "EXACT":
        item["match_classification"] = "EXACT_MATCH"
        item["match_score"] = max(score, int(llm_conf * 100))
        exact_matches.append(item)
    elif llm_class == "VARIANT":
        item["match_classification"] = "VARIANT_MATCH"
        item["match_score"] = max(score, int(llm_conf * 100))
        variant_matches.append(item)
    else:
        item["match_classification"] = "SIMILAR"
        similar_matches.append(item)

for item in all_results[20:]:
    score = item.get("match_score", 0)
    if score >= 85:
        item["match_classification"] = "EXACT_MATCH"
        exact_matches.append(item)
    elif score >= 60:
        item["match_classification"] = "VARIANT_MATCH"
        variant_matches.append(item)
    else:
        item["match_classification"] = "SIMILAR"
        similar_matches.append(item)

log(f"EXACT matches:   {len(exact_matches)}")
log(f"VARIANT matches: {len(variant_matches)}")
log(f"SIMILAR matches: {len(similar_matches)}")

if exact_matches:
    log()
    log("EXACT matches:")
    for r in exact_matches[:5]:
        log(f"  ✅ [{r.get('source','')}] {r.get('title','')[:70]} — ₹{r.get('price',0)}")
        if r.get("llm_reason"):
            log(f"     LLM reason: {r['llm_reason'][:80]}")

if variant_matches:
    log()
    log("VARIANT matches (top 5):")
    for r in variant_matches[:5]:
        log(f"  🔄 [{r.get('source','')}] {r.get('title','')[:70]} — ₹{r.get('price',0)}")

# ══════════════════════════════════════════════════════════════════════════════
section("STEP 7 — Layer 4: Image Matching (top EXACT candidates)")
# ══════════════════════════════════════════════════════════════════════════════

source_image_url = (attrs.get("images") or [None])[0]
if source_image_url and exact_matches:
    log(f"Source image: {source_image_url}")
    log()
    image_checks = 0
    for item in list(exact_matches):
        if image_checks >= 5:
            break
        cand_img = item.get("thumbnail") or item.get("image")
        if cand_img:
            t0 = time.time()
            img_score = searcher._image_match_score(source_image_url, cand_img)
            elapsed = time.time() - t0
            item["image_match_score"] = img_score
            action = "✅ KEPT" if img_score >= 40 else "⬇️  DOWNGRADED to VARIANT"
            log(f"  {action} (img_score={img_score}) [{item.get('source','')}] {item.get('title','')[:50]} ({elapsed:.2f}s)")
            if img_score < 40:
                exact_matches.remove(item)
                item["match_classification"] = "VARIANT_MATCH"
                variant_matches.append(item)
            image_checks += 1
else:
    log("Skipped: no source image URL available or no EXACT matches to check.")

# ══════════════════════════════════════════════════════════════════════════════
section("STEP 8 — /product/compare Deduplication (simulate backend)")
# ══════════════════════════════════════════════════════════════════════════════

all_online = exact_matches + variant_matches + similar_matches
sorted_results = sorted(
    [r for r in all_online if r.get("price", 0) > 0],
    key=lambda x: x.get("price", float("inf"))
)

sources_seen = set()
unique_by_source = []
for r in sorted_results:
    source = r.get("source", "Unknown")
    if source not in sources_seen:
        sources_seen.add(source)
        unique_by_source.append(r)

log(f"After dedup by store: {len(unique_by_source)} unique stores")
log()
log("Price comparison table:")
log(f"  {'Store':25} {'Price':>8}  {'Match':10}  Title")
log(f"  {'-'*25} {'-'*8}  {'-'*10}  {'-'*40}")
for r in unique_by_source[:15]:
    cls = r.get("match_classification", "SIMILAR")[:10]
    log(f"  {r.get('source',''):25} ₹{r.get('price',0):>7}  {cls:10}  {r.get('title','')[:40]}")

# ══════════════════════════════════════════════════════════════════════════════
section("SUMMARY")
# ══════════════════════════════════════════════════════════════════════════════

log(f"Brand-neutral query used:  '{brand_neutral_query}'")
log(f"Total SerpAPI results:     {len(all_results)}")
log(f"EXACT matches found:       {len(exact_matches)}")
log(f"VARIANT matches found:     {len(variant_matches)}")
log(f"Unique stores in compare:  {len(unique_by_source)}")
log(f"LLM extraction source:     {attrs.get('source', 'unknown')}")

# ── Write to file ─────────────────────────────────────────────────────────────
with open(OUTPUT_FILE, "w") as f:
    f.write("\n".join(lines))

print()
print(f"✅ Results written to: {OUTPUT_FILE}")
