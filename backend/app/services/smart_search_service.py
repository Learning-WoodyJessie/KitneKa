from typing import List, Dict, Optional
from openai import OpenAI
import json
import logging
import os
import re
from app.services.scraper_service import RealScraperService
from app.services.url_scraper_service import URLScraperService
from app.services.trust_service import TrustService
from app.services.registry import BRANDS, STORES
from app.services.cache_service import get_cached_search, cache_search, get_cached_brand, cache_brand
from app.services.smart_match_service import SmartMatchService

logger = logging.getLogger(__name__)

class SmartSearchService:
    def __init__(self):
        try:
            api_key = os.environ.get("OPENAI_API_KEY")
            if api_key:
                self.client = OpenAI(api_key=api_key)
            else:
                self.client = None
                logger.warning("OPENAI_API_KEY not found at startup. Smart Search running in limited mode.")
        except Exception as e:
            logger.warning(f"OpenAI Client Init Failed: {e}")
            self.client = None
            
        self.scraper = RealScraperService()
        self.url_service = URLScraperService()
        self.trust_service = TrustService()
        self.matcher = SmartMatchService()

    def _get_client(self):
        """Lazy load client"""
        if self.client:
            return self.client
        
        api_key = os.environ.get("OPENAI_API_KEY")
        if api_key:
            try:
                self.client = OpenAI(api_key=api_key)
                logger.info("OpenAI Client successfully lazy-loaded.")
                return self.client
            except Exception as e:
                logger.error(f"Lazy load failed: {e}")
        return None

    def _urls_match(self, a: str, b: str) -> str | None:
        """
        Returns match type: 'exact', 'path_prefix', or None.
        Uses URLScraperService's robust normalizer.
        """
        if not a or not b: return None
        
        ah, ap, aq = self.url_service._normalize_url_for_match(a)
        bh, bp, bq = self.url_service._normalize_url_for_match(b)
        
        if not ah or not bh or ah != bh:
            return None

        # strongest: host+path exact
        if ap == bp and ap:
            return "exact"

        # safer fuzzy: path prefix match with boundary
        if ap and bp:
            if ap.startswith(bp) and (ap == bp or ap[len(bp):].startswith("/")):
                return "path_prefix"
            if bp.startswith(ap) and (bp == ap or bp[len(ap):].startswith("/")):
                return "path_prefix"

        return None


    def _analyze_query(self, query: str):
        """
        Uses LLM to understand category and optimize search terms.
        """
        client = self._get_client()
        if not client:
            return {"category": "General", "optimized_term": query, "needs_local": True}
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo", # Using 3.5 for speed/cost, can upgrade to gpt-4
                messages=[
                    {"role": "system", "content": "You are a Shopping Assistant. Analyze the query. Return JSON with: 'category' (e.g., Electronics, Fashion), 'optimized_term' (better search keywords), 'needs_local' (boolean, true if user might want to buy offline e.g. appliances, false for digital goods)."},
                    {"role": "user", "content": query}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"LLM Analysis Failed: {e}")
            return {"category": "General", "optimized_term": query, "needs_local": True}

    def _score_products(self, products: list) -> list:
        """
        Score products for ranking without user data.
        Uses: store availability, discount, price competitiveness, title quality,
              trusted store bonus (from registry), clean beauty bonus.
        """
        from collections import defaultdict
        from app.services.registry import STORES, BRANDS, CLEAN_BEAUTY_BRANDS
        
        # Build trusted store name set from registry
        trusted_store_names = set()
        for store in STORES:
            trusted_store_names.add(store['display_name'].lower())
            for domain in store.get('domains', []):
                trusted_store_names.add(domain.lower().replace('.com', '').replace('.in', ''))
        
        # Build clean beauty brand keywords
        clean_beauty_keywords = set()
        for brand_id, brand_data in BRANDS.items():
            if brand_data.get('is_clean_beauty'):
                clean_beauty_keywords.add(brand_data['display_name'].lower())
                clean_beauty_keywords.update(alias.lower() for alias in brand_data.get('aliases', []))
        
        # Group products by normalized title for store counting
        title_groups = defaultdict(list)
        for p in products:
            title = (p.get('title') or '').lower().strip()
            key = ' '.join(title.split()[:8])
            title_groups[key].append(p)
        
        scored = []
        for product in products:
            score = 0
            title = (product.get('title') or '').lower().strip()
            source = (product.get('source') or '').lower()
            key = ' '.join(title.split()[:8])
            same_products = title_groups.get(key, [product])
            
            # 1. STORE AVAILABILITY (0-50 pts)
            sources = set(p.get('source', '').lower() for p in same_products)
            store_count = len(sources)
            if store_count >= 4:
                score += 50
            elif store_count == 3:
                score += 40
            elif store_count == 2:
                score += 25
            else:
                score += 10
            
            # 2. TRUSTED STORE BONUS (0-20 pts) - from registry
            source_clean = source.replace('.com', '').replace('.in', '').replace(' ', '').lower()
            if any(ts in source_clean or source_clean in ts for ts in trusted_store_names):
                score += 20
            
            # 3. DISCOUNT (0-25 pts)
            old_price = product.get('extracted_old_price') or product.get('old_price', 0)
            current_price = product.get('extracted_price') or product.get('price', 0)
            if old_price and current_price and old_price > current_price:
                discount_pct = (old_price - current_price) / old_price
                if discount_pct >= 0.40:
                    score += 25
                elif discount_pct >= 0.30:
                    score += 20
                elif discount_pct >= 0.20:
                    score += 15
                elif discount_pct >= 0.10:
                    score += 10
            
            # 4. PRICE COMPETITIVENESS (0-15 pts)
            if store_count >= 2:
                prices = [p.get('extracted_price') or p.get('price', 0) for p in same_products]
                prices = [p for p in prices if p > 0]
                if len(prices) >= 2:
                    price_variance = (max(prices) - min(prices)) / max(prices)
                    if price_variance <= 0.10:
                        score += 15
                    elif price_variance <= 0.20:
                        score += 10
                    elif price_variance <= 0.30:
                        score += 5
            
            # 5. CLEAN BEAUTY BONUS (0-15 pts) - from registry BRANDS
            if any(cb in title for cb in clean_beauty_keywords):
                score += 15
                product['is_clean_beauty'] = True
            
            # 6. TITLE QUALITY (0-10 pts)
            brand_keywords = list(clean_beauty_keywords) + ['nike', 'adidas', 'puma', 'zara', 'h&m']
            has_brand = any(b in title for b in brand_keywords)
            has_variant = any(v in title for v in ['size', 'ml', 'pack', 'set', 'g ', 'gm', 'gram', 'piece'])
            if has_brand and has_variant:
                score += 10
            elif has_brand:
                score += 7
            else:
                score += 3
            
            product['_score'] = score
            product['_store_count'] = store_count
            product['_is_trusted_store'] = any(ts in source_clean for ts in trusted_store_names)
            scored.append(product)
        
        # OUTLIER FILTERING - Remove invalid products
        # 1. Statistical outlier detection using IQR (both high and low)
        # 2. Remove samples/testers
        # 3. Remove products without proper titles
        
        # Calculate IQR for price outlier detection
        all_prices = [p.get('extracted_price') or p.get('price', 0) for p in scored]
        valid_prices = sorted([p for p in all_prices if p > 0])
        
        if len(valid_prices) >= 4:
            q1_idx = len(valid_prices) // 4
            q3_idx = (3 * len(valid_prices)) // 4
            q1 = valid_prices[q1_idx]
            q3 = valid_prices[q3_idx]
            iqr = q3 - q1
            lower_bound = max(10, q1 - 1.5 * iqr)  # At least ₹10
            upper_bound = q3 + 3 * iqr  # More lenient for high prices (3x IQR)
            logger.info(f"Price bounds: ₹{lower_bound:.0f} - ₹{upper_bound:.0f} (Q1={q1}, Q3={q3}, IQR={iqr})")
        else:
            lower_bound = 10  # Fallback minimum
            upper_bound = float('inf')
        
        filtered = []
        for p in scored:
            price = p.get('extracted_price') or p.get('price', 0)
            title = (p.get('title') or '').lower()
            
            # Skip if price is a statistical outlier
            if price > 0 and (price < lower_bound or price > upper_bound):
                logger.info(f"Filtered price outlier (₹{price}): {p.get('title', '')[:50]}")
                continue
            
            # Skip samples, testers, damaged items
            exclude_terms = ['sample', 'tester', 'tstr', 'damaged', 'defective', 'demo']
            if any(term in title for term in exclude_terms):
                logger.info(f"Filtered excluded item: {p.get('title', '')[:50]}")
                continue
            
            # Skip if title is too short (likely garbage data)
            if len(title) < 10:
                continue
            
            filtered.append(p)
        
        # Sort by score descending
        filtered.sort(key=lambda x: x.get('_score', 0), reverse=True)
        return filtered

    def _enforce_diversity(self, results, max_share=0.4):
        """
        Ensures no single store/domain dominates more than max_share (40%) of results.
        Prioritizes retaining higher-ranked items.
        """
        if not results: return []
        
        limit = max(1, int(len(results) * max_share))
        store_counts = {}
        diverse_results = []
        
        for item in results:
            # Identify store (domain or source name)
            source = item.get("store_name") or item.get("source") or "unknown"
            source = source.lower().replace("www.", "").replace(".com", "").replace(".in", "")
            
            # Allow Official Sites to bypass limits (User wants them prioritized)
            is_official = item.get("is_official", False)
            
            current_count = store_counts.get(source, 0)
            
            if is_official or current_count < limit:
                diverse_results.append(item)
                if not is_official:
                    store_counts[source] = current_count + 1
            else:
                # Skip this item to allow space for other stores
                pass
                
        return diverse_results

    def _synthesize_results(self, query, online_data, local_data, instagram_data):
        """
        Uses LLM to rank products and generate recommendations.
        """
        # DISABLED: Diversity filter removed per user request - show all results\n        # online_data = self._enforce_diversity(online_data, max_share=0.40)

        client = self._get_client()
        if not client:
             return {
                "best_value": None,
                "authenticity_note": "AI Analysis unavailable (No API Key).",
                "recommendation_text": "Here are the top results we found."
            }
        # Prepare context for LLM (limit data to avoid token limits)
        context = {
            "query": query,
            "online_top_5": online_data[:5],
            "local_top_5": local_data[:5],
            "instagram_top_5": instagram_data[:5]
        }
        
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": """You are a Pricing Expert. Analyze the provided product data.
                    Generate a JSON response with:
                    1. 'best_value': The single best deal (object with title, price, reason).
                    2. 'authenticity_note': Tips on checking authenticity for this category.
                    3. 'price_trend': A short comment on if this price is good.
                    4. 'recommendation_text': A 2-sentence summary for the user.
                    
                    Data Format:
                    {
                        "best_value": {"id": "...", "reason": "..."},
                        "authenticity_note": "...",
                        "recommendation_text": "..."
                    }
                    """},
                    {"role": "user", "content": json.dumps(context)}
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"LLM Synthesis Failed: {e}")
            return {
                "best_value": None,
                "authenticity_note": "Could not generate analysis.",
                "recommendation_text": "Here are the top results we found."
            }

    def _rank_results(self, results, query, target_url=None, canonical_url=None, product_id=None, debug=True):
        """
        Rank results based on relevance (Tiered Logic).
        Prioritizes: Product ID > Canonical URL > Fuzzy URL > Model > Text
        """
        if not results: return []
        
        query_terms = query.lower().split()
        if not query_terms: return results
        
        model_terms = [t for t in query_terms if any(c.isdigit() for c in t) and len(t) > 2]
        phrases = [" ".join(query_terms[i:i+2]) for i in range(len(query_terms)-1)] if len(query_terms) > 1 else []
        
        # Prepare Identity signals
        pid_val = product_id.get("value") if product_id else None
        
        scored_results = []
        for item in results:
            title = item.get("title", "").lower()
            item_url = item.get("url", "")
            score = 0
            score_components = {}
            match_reasons = []
            pinned = False

            def add(points, reason):
                nonlocal score
                score += points
                score_components[reason] = points
                if reason not in match_reasons:
                    match_reasons.append(reason)
            
            # Trust Tagging & Exclusion
            item = self.trust_service.enrich_result(item)
            if item.get("is_excluded"):
                # Skip testers/samples
                continue
                
            # BOOST TRUSTED SOURCES
            # 1. Broad Popularity Boost
            if item.get("is_popular") or item.get("is_official"):
                 add(500, "trusted_source_boost")

            # 2. CLEAN BEAUTY SPECIFIC MARKETPLACE BOOST (User Request)
            # If item is Clean Beauty (e.g. Mamaearth) and from specific trusted retailers, give EXTRA boost
            # to ensure they appear alongside official site.
            trusted_clean_marketplaces = ["nykaa", "amazon", "flipkart", "myntra", "sephora", "tatacliq", "tira", "purplle"]
            
            if item.get("is_clean_beauty"):
                store_id = item.get("store_name", "").lower()
                source_check = item.get("source", "").lower()
                
                # Check if this item is from a trusted marketplace
                is_trusted_mp = any(mp in store_id or mp in source_check for mp in trusted_clean_marketplaces)
                
                if is_trusted_mp:
                     add(300, "clean_beauty_marketplace_boost")

            # --- 1. PRODUCT ID MATCH (Highest Confidence) ---
            if pid_val and pid_val in item_url:
                add(1500, "product_id_match")
                pinned = True
            
            # --- 2. URL MATCHING (Canonical / Resolved) ---
            if not pinned and target_url and item_url:
                # Compare against Canonical first if available
                match_target = canonical_url if canonical_url else target_url
                match_type = self._urls_match(match_target, item_url)
                
                if match_type == "exact":
                    add(1200, "canonical_url_match")
                    pinned = True
                elif match_type == "path_prefix":
                    add(800, "fuzzy_url_match")
            
            # --- 3. TEXT MATCHING ---
            # Brand Prefix
            if title.startswith(query_terms[0]):
                add(50, "brand_prefix")
            
            # Phrase Match
            for phrase in phrases:
                if phrase in title:
                    add(200, "phrase_match")
            
            # Model Match
            for model in model_terms:
                if model in title:
                    add(500, "model_match")
            
            # Term Overlap
            matches = sum(1 for term in query_terms if term in title)
            if matches:
                add(matches * 10, "term_overlap")

            # Determine Match Quality
            if "product_id_match" in match_reasons:
                match_quality = "id_exact"
            elif "canonical_url_match" in match_reasons:
                match_quality = "url_canonical"
            elif "fuzzy_url_match" in match_reasons:
                match_quality = "url_fuzzy" 
            elif "model_match" in match_reasons:
                match_quality = "model_exact"
            elif "phrase_match" in match_reasons:
                match_quality = "phrase_exact"
            else:
                match_quality = "related"
            
            item['match_score'] = score
            item['match_quality'] = match_quality
            item['pinned'] = pinned
            
            if debug:
                item['match_reasons'] = match_reasons
                item['score_components'] = score_components
                
            scored_results.append((score, item))
            
        scored_results.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in scored_results]

    def _calculate_confidence(self, item, target_url=None, extracted_metadata=None):
        """
        Calculates a confidence score (0.0 - 1.0) for a candidate recommendation.
        Rubric:
        - Match Quality: +0.50 (Exact/ID), +0.30 (Fuzzy)
        - Trust: +0.30 (Official), +0.15 (Popular)
        - Price: +0.10 (Competitive)
        - Rating: +0.05 (High Rating)
        """
        score = 0.0
        reasons = []
        
        # 1. Match Quality (Reuse match logic logic or item metadata)
        # Assuming item['match_quality'] is populated by _rank_results
        qual = item.get('match_quality', 'related')
        if qual in ('id_exact', 'url_canonical'):
            score += 0.60
            reasons.append("Exact Match")
        elif qual in ('url_fuzzy', 'model_exact'):
            score += 0.30
            reasons.append("High Relevance")
            
        # 2. Trust Signals
        if item.get("is_official"):
            score += 0.30
            reasons.append("Official Store")
        elif item.get("is_popular"):
            score += 0.15
            reasons.append("Trusted Seller")
            
        # 3. Rating Bonus
        if item.get("rating", 0) > 4.2:
            score += 0.05
            
        # 4. Exclusion Penalty
        if item.get("is_excluded"):
            score -= 1.0
            
        return round(min(score, 1.0), 2), reasons

    
    def _inject_registry_cards(self, query, current_results):
        """
        Injects official Store Cards if the query matches a known Brand in the Registry.
        This acts as a fallback or enhancement if search results are poor.
        """
        if not query: return []
        
        injected = []
        q_lower = query.lower()
        
        # CATEGORY EXPANSION:
        # If query is "clean beauty" or similar, return ALL clean brands
        is_category_search = any(term in q_lower for term in ["clean beauty", "clean brands", "organic beauty"])
        
        # Check against Registry
        for b_id, data in BRANDS.items():
            # MATCH LOGIC:
            # 1. Exact/Alias match (STRICT Word Boundary)
            # Replaced loose substring check to prevent "mk" matching "pumpkin" etc.
            check_terms = data["aliases"] + [data["display_name"].lower()]
            matches_brand = False
            for term in check_terms:
                # Regex: (Start or Non-Word) + Term + (End or Non-Word)
                pattern = r'(?:^|\W)' + re.escape(term) + r'(?:$|\W)'
                if re.search(pattern, q_lower):
                    matches_brand = True
                    break
            
            # 2. Category Match (New)
            matches_category = is_category_search and data.get("is_clean_beauty", False)
            
            if matches_brand or matches_category:
                # Create Official Site Card
                for domain_data in data.get("official_domains", []):
                    # check deduplication
                    host = domain_data["host"]
                    if any(host in (r.get("link") or "") for r in current_results):
                        continue
                        
                    full_url = f"https://{host}{domain_data.get('path_prefix', '/')}"
                    
                    card = {
                        "title": f"Visit {data['display_name']} Official Store",
                        "price": 0, # Placeholder
                        "currency": "INR",
                        "source": f"{data['display_name']} Official",
                        "link": full_url,
                        "url": full_url,
                        # Use specific image if available, else generic
                        "thumbnail": data.get("image", "https://cdn-icons-png.flaticon.com/512/3596/3596091.png"),
                        "image": data.get("image", "https://cdn-icons-png.flaticon.com/512/3596/3596091.png"), 
                        "banner_image": data.get("banner_image"),
                        "popular_searches": data.get("popular_searches", []),
                        "is_official": True,
                        "is_popular": True,
                        "is_clean_beauty": data.get("is_clean_beauty", False),
                        "is_injected_card": True, # For UI styling
                        "rating": 5.0,
                        "reviews": 1000 # Trust Booster
                    }
                    injected.append(card)
        
        return injected

    def _generate_recommendation(self, results, target_url=None, extracted_metadata=None):
        """
        Picks the single best offer based on "Lowest Trusted Price".
        Candidates must be:
        1. Trusted (Popular or Official)
        2. High Quality Match (Exact/Canonical/Fuzzy/Model) - ensures we compare same product
        3. Lowest Price wins.
        """
        if not results: return None
        
        # 1. Broad Filter: Must be Popular or Official
        trusted_items = [item for item in results if item.get('is_popular') or item.get('is_official')]
        
        # 2. Strict Filter: Must be arguably the "Same Product" (High Match Quality)
        # We don't want to recommend a cheap accessory that happens to be from a trusted seller.
        valid_candidates = [
            item for item in trusted_items 
            if item.get('match_quality') in ('id_exact', 'url_canonical', 'url_fuzzy', 'model_exact')
        ]
        
        if not valid_candidates:
            return None
            
        # 3. Strategy: Lowest Price Wins
        # Official stores are treated equally to detailed marketplaces.
        valid_candidates.sort(key=lambda x: x.get('price', float('inf')))
        
        best_pick = valid_candidates[0]
        
        # 4. Calculate Confidence (Final Gate)
        confidence, reasons = self._calculate_confidence(best_pick, target_url, extracted_metadata)
        
        # 5. Gate: Threshold 0.75
        if confidence >= 0.75:
            best_pick["recommendation_reason"] = " • ".join(reasons)
            best_pick["confidence_score"] = confidence
            return best_pick
            
        return None

    # Placeholder for the new _generate_ai_insight method
    # Placeholder for the new _generate_ai_insight method
    def _generate_ai_insight(self, ranked_online, query):
        # Delegate to the real synthesis method
        return self._synthesize_results(query, ranked_online, [], [])

    def _extract_model_numbers(self, text: str) -> List[str]:
        """
        Extracts alphanumeric model codes (e.g., MK6475, WH-1000XM4, iPhone15)
        Ignores generic terms like 'Women', 'Watch', 'Size', 'Pack'
        """
        # Look for tokens with mixed alpha+digits OR pure digits of specific length (e.g. 501)
        tokens = text.split()
        models = []
        for t in tokens:
            # CLEAN: Remove all non-alphanumeric characters (including hyphens) for standardization
            # MK-7548 -> MK7548
            t_clean = re.sub(r'[^a-zA-Z0-9]', '', t).upper()
            
            # Strict Rule: Model numbers MUST have at least one digit (e.g. MK3192, iphone15)
            # Pure alpha words (MICHAEL, ROSE, GOLD) are almost never unique model IDs in this context.
            if any(c.isdigit() for c in t_clean) and len(t_clean) > 2:
                 # Check for India/International suffix "I" (e.g. MK7548I -> MK7548)
                 # Only strip if it ends with digit+I to avoid stripping valid models ending in I
                 if t_clean.endswith('I') and len(t_clean) > 3 and t_clean[-2].isdigit():
                     logger.info(f"Stripping 'I' suffix from model: {t_clean} -> {t_clean[:-1]}")
                     t_clean = t_clean[:-1]

                 # Filter out common false positives
                 if t_clean not in ["SIZE", "PACK", "WITH", "BLACK", "WHITE", "BLUE", "GOLD", "WOMEN", "MENS", "KIDS", "ROSE", "GOLD", "WATCH", "DARCI", "1PC", "2PC", "100ML", "50ML", "500G", "1KG"]:
                    models.append(t_clean)
        return models

        return models

    def _calculate_match_score(self, target_model: str, target_brand: str, target_fingerprint: dict, candidate_title: str, candidate_source: str, candidate_image_url: str = None) -> dict:
        """
        Calculates a compatibility score (0-150) for Tiered Matching.
        Tiers:
          - Tier 1: Exact Model Match (Score >= 90)
          - Tier 2: Fingerprint Match (Score 70-89)
          - Tier 3: Similar/Fuzzy (Score < 70)
        """
        score = 0
        reasons = []
        # Normalize title for matching: Remove hyphens/spaces for loose check
        title_upper = candidate_title.upper()
        title_clean = re.sub(r'[^a-zA-Z0-9]', '', title_upper)
        
        # 1. MODEL MATCH (+90 pts) - The "Gold Standard" in absence of GTIN
        # Handle Alias: MK7548I == MK7548
        # We assume target_model is already stripped/normalized (e.g. "MK7548")
        if target_model:
            # Check in raw title OR cleaned title (handles "MK-7548" in title matching "MK7548" target)
            if target_model in title_upper or target_model in title_clean:
                score += 90
                reasons.append("Model Match")
        
        # 2. BRAND MATCH (+20 pts)
        if target_brand and target_brand.upper() in title_upper:
            score += 20
            reasons.append("Brand Match")
            
        # 3. FINGERPRINT MATCH (+10 pts per attribute)
        # Collection (e.g. "COREY", "PARKER", "LEXINGTON")
        if target_fingerprint.get("collection"):
            coll = target_fingerprint["collection"].upper()
            if coll in title_upper:
                score += 15 # Stronger signal
                reasons.append(f"Collection: {coll}")
            else:
                 # CONFLICT: Target is "Corey" but Candidate is "Parker"
                 # We need to extract candidate's collection to know for sure
                 candidate_series = self._extract_series_name(candidate_title)
                 if candidate_series and candidate_series != coll:
                     score -= 30 
                     reasons.append(f"Conflict: Series {candidate_series}")
        
        # Color (e.g. "ROSE GOLD")
        if target_fingerprint.get("color"):
            color = target_fingerprint["color"].upper()
            if color in title_upper:
                score += 10
                reasons.append(f"Color: {color}")
                
        # Material (e.g. "STAINLESS")
        if target_fingerprint.get("material"):
            mat = target_fingerprint["material"].upper()
            if mat in title_upper:
                score += 10
                reasons.append(f"Material: {mat}")

        # 4. VISUAL VERIFICATION (Phase 4) 👁️
        # Trigger if:
        # a) We have a Target Image (from URL or Upload) AND Candidate Image
        # b) Candidate Source is NOT Official (Official is trusted)
        # c) Text Score is HIGH (Validate Match) OR Query was Image-Based (Find Visual Match)
        target_image = target_fingerprint.get("image_url")
        is_image_search = target_fingerprint.get("is_image_search", False)
        
        if target_image and candidate_image_url and candidate_source != "Official Site":
             # Logic: Only verify if we have a model match or strong signal but want to confirm
             # OR if we have NO model match but strong visual signal is needed (Image Search)
             
             # Clause: If text score is high (Candidate matches text), verify visually to screen False Positives (Straps)
             # Clause: If text score is low BUT query was image-based, verify visually to find matches (allow 0 text score)
             should_verify = (score >= 90) or (is_image_search) 
             
             if should_verify:
                 # Call GPT-4 Vision (Slow/Costly - use sparsely in real prod, here we demonstrate)
                 logger.info(f"Triggering Visual Verification for: {candidate_title}")
                 visual_result = self.matcher.compare_images(target_image, candidate_image_url)
                 
                 v_score = visual_result.get("visual_score", 0)
                 v_type = visual_result.get("match_type", "UNCERTAIN")
                 
                 reasons.append(f"Visual Score: {v_score} ({v_type})")
                 
                 if v_score >= 85: 
                     # Phase 4 Update: If Visual Score is very high, it should be a Top Match
                     # even if text is poor (e.g. "Summer Dress" query matching specific dress image)
                     score += 90 
                     reasons.append("Visually Verified (Exact)")
                 elif v_score >= 70:
                      score += 50
                      reasons.append("Visually Verified (Similar)")
                 elif v_score < 40 and score >= 90:
                     score -= 50 # Penalize False Positives (Item looks different despite text match)
                     reasons.append("Visual Mismatch")

        return {"score": score, "reasons": reasons}

    def _extract_series_name(self, text: str) -> Optional[str]:
        """
        Extracts known series/collection names for watches and accessories.
        Helps when no specific model number is present (e.g. 'Michael Kors Lexington')
        """
        if not text: return None
        
        # Common Watch/Bag Series (Expand as needed)
        known_series = [
            "LEXINGTON", "BRADSHAW", "RUNWAY", "DARCI", "SOFIE", "PYPER", "PARKER", "SLIM", "RITZ", 
            "GEN 5", "GEN 6", "VANDERBILT", "EVEREST", "LAYTON", "TIBBY", "COREY", "EMERY", "SAGE", "LENNOX"
        ]
        
        text_upper = text.upper()
        for series in known_series:
            # check for word boundary to avoid partial matches
            pattern = r'(?:^|\W)' + re.escape(series) + r'(?:$|\W)'
            if re.search(pattern, text_upper):
                return series
                
        return None

    def smart_search(self, query: str, location: str = "Mumbai", db=None):
        """
        Orchestrates the search:
        1. Analyzes query (is it a URL?)
        2. Extracts product info if URL
        3. Searches Google/SerpAPI
        4. Ranks Results
        5. (Passive) Saves results to DB for History
        """
        logger.info(f"Smart Search Analysis for: {query}")
        
        # CACHE CHECK - Return cached results if available (huge speed boost)
        cached_result = get_cached_search(query, location)
        if cached_result:
            logger.info(f"Returning CACHED results for '{query}'")
            return cached_result
        
        # 1. Check if query contains a URL (anywhere in text)
        url_pattern = re.compile(r'https?://\S+')
        extracted_data = None
        target_url = None
        
        url_match = url_pattern.search(query)
        if url_match:
            # Extract just the URL part
            raw_url = url_match.group(0)
            logger.info(f"Detected URL in query: {raw_url}")
            
            extracted_data = self.url_service.extract_product_from_url(raw_url)
            
            # capture best available URL for matching
            target_url = (
                extracted_data.get("resolved_url") 
                or extracted_data.get("canonical_url") 
                or extracted_data.get("original_url") 
                or raw_url
            )
            # extraction might give us a clean product name to search
            query = extracted_data.get("search_query", query)
        
        logger.info(f"Fetching Data for: {query}, Target URL: {target_url}")
        
        # Detect Model Numbers in Query (Critical for "Compare Prices" exact match)
        query_models = self._extract_model_numbers(query)
        logger.info(f"Detected Model Numbers in Query: {query_models}")

        # Extract Fingerprint (Collection, Brand, etc.)
        # We use simple extraction first, can fallback to LLM matcher if needed
        # Assuming Brand is usually first word or we can look it up
        target_brand = None
        for b_name in BRANDS:
             if b_name.lower() in query.lower():
                 target_brand = BRANDS[b_name]["display_name"]
                 break
        
        target_fingerprint = {
            "collection": self._extract_series_name(query),
            "color": None, # complex to extract without LLM, skipping for now or using simple logic
            "material": "STAINLESS" if "stainless" in query.lower() else None
        }
        if "rose gold" in query.lower(): target_fingerprint["color"] = "ROSE GOLD"
        elif "gold" in query.lower(): target_fingerprint["color"] = "GOLD"
        elif "silver" in query.lower(): target_fingerprint["color"] = "SILVER"

        # Populate Target Image for Visual Verification (Phase 4)
        if extracted_data and extracted_data.get("image"):
            target_fingerprint["image_url"] = extracted_data["image"]
            target_fingerprint["is_image_search"] = True 
            logger.info(f"Visual Verification Enabled. Target Image: {extracted_data['image']}")
        elif "http" in query and (".jpg" in query or ".png" in query or ".webp" in query):
             # Direct Image URL search
             target_fingerprint["image_url"] = query
             target_fingerprint["is_image_search"] = True

        # 2. FETCH RESULTS (Multi-Query for Marketplace Mix)
        # Check if this is a Brand Search to trigger Marketplace Spread
        is_brand_search = any(b['display_name'].lower() in query.lower() for b in BRANDS.values()) or len(query.split()) < 2

        
        all_serp_results = []
        
        # Updated Condition: Use Marketplace Mix for Brands OR Valid URL Searches
        # This ensures URL searches also check Amazon/Flipkart/etc. explicitly
        should_use_mix = False
        if is_brand_search and not target_url:
             should_use_mix = True
        elif target_url and extracted_data and extracted_data.get("search_query"):
             should_use_mix = True
        # NEW: If we have a specific model number, FORCE mix to find it on all platforms
        elif query_models:
             should_use_mix = True
             logger.info(f"Model number detected ({query_models}), forcing Marketplace Mix.")
             
        if should_use_mix:
            # MARKETPLACE MIX: Query each major marketplace separately for equal representation
            # Note: site: operator doesn't work in Google Shopping - use store name instead
            marketplaces = [
                "",  # Base query (often returns official site)
                "Amazon",
                "Flipkart", 
                "Nykaa",
                "Myntra",
                "Ajio",
                "Tata Cliq",
                "Purplle"
            ]
            
            logger.info(f"Executing Multi-Marketplace Search for: {query}")
            
            for marketplace in marketplaces:
                if marketplace:
                    sub_query = f"{query} {marketplace}"
                else:
                    sub_query = query
                    
                logger.info(f"  Searching: {sub_query}")
                res = self.scraper.search_products(sub_query)
                all_serp_results.extend(res.get("online", []))
        else:
            # Standard single query
            scraper_response = self.scraper.search_products(query)
            all_serp_results = scraper_response.get("online", [])

        # TIERED RESULT CLASSIFICATION
        exact_matches = []
        variant_matches = []
        similar_matches = []
        
        # Use first model as target if available
        target_model_clean = query_models[0] if query_models else None
        
        for item in all_serp_results:
             # Calculate Score
             calc = self._calculate_match_score(
                 target_model=target_model_clean, 
                 target_brand=target_brand, 
                 target_fingerprint=target_fingerprint, 
                 candidate_title=item.get("title", ""),
                 candidate_source=item.get("source", ""),
                 candidate_image_url=item.get("thumbnail") or item.get("image")
             )
             score = calc["score"]
             item["match_score"] = score
             item["match_reasons"] = calc["reasons"]
             
             # NEW: Force Official Store results to be EXACT matches if they have high similarity matches
             if item.get("is_official") or item.get("source") == "Official Site":
                 # If model matches or score is decent, boost it
                 if target_model_clean and target_model_clean in item.get("title", "").upper():
                     score += 100 # Super boost
                     item["match_score"] += 100
                 elif score > 50:
                     score = 95 # Assume correct if decent
            
             # CLASSIFY
             if score >= 90:
                 item["match_classification"] = "EXACT_MATCH"
                 exact_matches.append(item)
             elif score >= 70:
                 item["match_classification"] = "VARIANT_MATCH"
                 variant_matches.append(item)
             else:
                 item["match_classification"] = "SIMILAR"
                 similar_matches.append(item)

        # 4. Synthesize with LLM (Optional, mostly for "Top Pick" text)
        # We skip this for raw search speed usually, but if needed:
        recommendation_data = {
            "best_value": None,
            "authenticity_note": "Ensure seller has good ratings.",
            "recommendation_text": "Found these matches based on your search."
        }
        
        # Deduping (Simple ID/URL check)
        # Note: We should dedupe WITHIN lists to avoid duplicates across tiers if logic was loose
        # But here we partitioned them so they are unique sets logic-wise. 
        # But multiple marketplaces might return same item.
        def _dedupe(items):
             seen = set()
             unique = []
             for i in items:
                 k = i.get("link") or i.get("url")
                 if k and k not in seen:
                     seen.add(k)
                     unique.append(i)
             return unique

        final_response = {
            "original_query": query,
            "query_type": "product", # or 'brand'
            "results": {
                "online": _dedupe(all_serp_results), # Dataset for legacy frontend
                "local": [],
                "instagram": [],
                "exact_matches": _dedupe(exact_matches),
                "variant_matches": _dedupe(variant_matches),
                "similar_matches": _dedupe(similar_matches)
            },
            "recommendation": recommendation_data,
            "clean_brands": self._inject_registry_cards(query, all_serp_results)
        }
        
        # Cache the result
        cache_search(query, location, final_response)
        
        return final_response                         # Fuzzy brand check

    def _deduplicate_results(self, items: List[Dict]) -> List[Dict]:
        """
        Removes duplicates based on (Normalized Title + Source + Price).
        Keeps the first occurrence (which is usually higher ranked).
        """
        seen = set()
        unique_items = []
        
        for item in items:
            # Create a unique key
            title = (item.get("title") or "").lower().strip()
            source = (item.get("source") or "").lower().strip()
            price = item.get("price")
            
            # Key: (Title, Source, Price)
            # We use a simplified title (first 30 chars) to catch minor variations like "..." suffix
            # but strict on source and price.
            dist_key = (title[:30], source, price)
            
            if dist_key not in seen:
                seen.add(dist_key)
                unique_items.append(item)
                
        return unique_items
