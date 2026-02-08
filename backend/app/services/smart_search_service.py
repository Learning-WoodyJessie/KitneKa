from openai import OpenAI
import json
import logging
import os
import re
from app.services.scraper_service import RealScraperService
from app.services.url_scraper_service import URLScraperService
from app.services.trust_service import TrustService
from app.services.registry import BRANDS, STORES

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
        
        # Sort by score descending
        scored.sort(key=lambda x: x.get('_score', 0), reverse=True)
        return scored

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
            # 1. Exact/Alias match (Existing)
            matches_brand = any(alias in q_lower for alias in data["aliases"] + [data["display_name"].lower()])
            
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
    def _generate_ai_insight(self, ranked_online, query):
        # Delegate to the real synthesis method
        return self._synthesize_results(query, ranked_online, [], [])

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
        
        logger.info(f"Fetching Data for: {query}")
        
        # 2. Results Fetching
        # 2. FETCH RESULTS (Multi-Query for Marketplace Mix)
        # Check if this is a Brand Search to trigger Marketplace Spread
        is_brand_search = any(b['display_name'].lower() in query.lower() for b in BRANDS.values()) or len(query.split()) < 2
        
        all_serp_results = []
        
        if is_brand_search and not target_url:
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

        # Deduplicate by ID or URL
        seen_ids = set()
        serp_results = []
        for item in all_serp_results:
            uid = item.get("url") or item.get("id")
            if uid not in seen_ids:
                seen_ids.add(uid)
                serp_results.append(item)
        
        # 2a. Direct Integration for Registry Brands (Live Data)
        if "old school rituals" in query.lower():
             logger.info("Triggering Direct Shopify Fetch for Old School Rituals")
             direct_items = self.scraper.fetch_direct_shopify("https://www.oldschoolrituals.in")
             if direct_items:
                 logger.info(f"Replacing SERP results with {len(direct_items)} Direct Items.")
                 serp_results = direct_items



        local_results = self.scraper.search_local_stores(query, location)
        instagram_results = self.scraper.search_instagram(query, location)
        
        # 3. Synthesis
        final_results = []
        
        # INJECT SOURCE ITEM: If we started with a URL, ensure it's in the results!
        if extracted_data and extracted_data.get("title"):
             source_item = {
                 "title": extracted_data.get("title"),
                 "price": extracted_data.get("price"),
                 "currency": extracted_data.get("currency", "INR"),
                 "link": target_url,
                 "url": target_url, # CRITICAL: TrustService & Ranking rely on 'url' key
                 "source": self.url_service._get_domain(target_url), # simple helper or just domain
                 "thumbnail": extracted_data.get("image"),
                 "is_source_url": True 
             }
             final_results.append(source_item)

        final_results.extend(serp_results)
        
        # 2b. Strict Filtering for Ambiguous Brands (User Feedback)
        # remove "fruit", "eating", "kg" for Plum
        if "plum" in query.lower():
             logger.info("Applying strict filtering for 'Plum' to remove fruits/groceries.")
             filtered_results = []
             negative_terms = ["fruit", "dry fruit", "eating", "fresh plum", "1kg", "500g", "250g", "cake", "candy"]
             for item in final_results:
                 title_lower = item.get("title", "").lower()
                 if not any(term in title_lower for term in negative_terms):
                     filtered_results.append(item)
                 else:
                     logger.info(f"Filtered out irrelevant item: {item.get('title')}")
             final_results = filtered_results

        # Rank Results
        canonical_url = extracted_data.get("canonical_url") if extracted_data else None
        product_id = extracted_data.get("product_id") if extracted_data else None
        # 2. Rank Results
        ranked_results = self._rank_results(
            final_results, 
            query=query, 
            target_url=target_url,
            canonical_url=canonical_url,
            product_id=product_id
        )
        
        # 3. Registry Injection (NEW)
        # Inject official cards if query matches a Brand
        # MODIFIED: Return these as a separate 'clean_brands' list for specific UI handling
        clean_brands = self._inject_registry_cards(query, ranked_results)
        
        # 4. Score & Re-rank products for diversity and relevance
        scored_results = self._score_products(ranked_results)
        
        # 4. Passive History Recording (New)
        if db:
            from app.services.db_utils import save_product_snapshot
            try:
                # We save the top 5 most relevant results to avoid spamming DB with low quality matches
                # Only save results that are 'exact' matches or top ranked
                for item in ranked_results[:5]:
                    save_product_snapshot(db, item)
            except Exception as e:
                logger.error(f"Passive History Save Failed: {e}")
        
        response_payload = {
            "query": query,
            "match_type": "url" if extracted_data else "text",
            "extracted_metadata": extracted_data,
            "results": {
                "online": scored_results,
                "instagram": instagram_results,
                "local": local_results
            },
            "clean_brands": clean_brands, # New Explicit Key
            "recommendation": self._generate_recommendation(ranked_results, target_url, extracted_data),
            "insight": self._generate_ai_insight(ranked_results, query)
        }
        
        # DEBUG LOGGING
        logger.info(f"Smart Search Response for '{query}': {len(ranked_results)} online results, {len(clean_brands)} clean brands.")
        if clean_brands:
             logger.info(f"Clean Brands Data: {json.dumps(clean_brands, default=str)}")
             
        return response_payload
