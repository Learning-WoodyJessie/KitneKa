from openai import OpenAI
import json
import logging
import os
import re
from app.services.scraper_service import RealScraperService
from app.services.url_scraper_service import URLScraperService

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

    def _normalize_url(self, url: str) -> str:
        """
        Normalize URL for stable comparison:
        - Lowercase host
        - Remove default ports
        - Remove tracking params (utm_*, ref, etc.)
        - Remove fragments
        """
        if not url: return ""
        try:
            from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
            
            parsed = urlparse(url)
            # 1. Lowercase scheme and netloc
            netloc = parsed.netloc.lower()
            if netloc.startswith("www."):
                netloc = netloc[4:]
            
            # 2. Filter query params
            query_params = parse_qsl(parsed.query)
            # tracking params to drop
            blocklist = {'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'gclid', 'fbclid'}
            cleaned_params = sorted([(k, v) for k, v in query_params if k.lower() not in blocklist])
            
            new_query = urlencode(cleaned_params)
            
            # Reconstruct (drop fragment)
            return urlunparse((parsed.scheme, netloc, parsed.path, parsed.params, new_query, ''))
        except Exception:
            return url.lower() # Fallback


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

    def _synthesize_results(self, query, online_data, local_data, instagram_data):
        """
        Uses LLM to rank products and generate recommendations.
        """
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

    def _rank_results(self, results, query, target_url=None):
        """
        Rank results based on relevance.
        Prioritizes URL matches (Normalized) > Model Numbers > Exact Phrases > Brand.
        """
        if not results:
            return []
            
        query_terms = query.lower().split()
        if not query_terms:
            return results
            
        # Pre-compute target match key
        target_key = self._normalize_url(target_url) if target_url else None
            
        # Identify potential model numbers (e.g., MK9022, iPhone15, 3080Ti)
        model_terms = [term for term in query_terms if any(c.isdigit() for c in term) and len(term) > 2]
        
        # Identify Phrases
        phrases = [" ".join(query_terms[i:i+2]) for i in range(len(query_terms)-1)] if len(query_terms) > 1 else []

        scored_results = []
        for item in results:
            title = item.get("title", "").lower()
            item_url = item.get("url", "")
            score = 0
            
            # --- 1. URL MATCHING (High Confidence) ---
            if target_key:
                item_key = self._normalize_url(item_url)
                
                # Level 1: Exact Normalized Match
                if item_key == target_key:
                    score += 1000
                    item['match_quality'] = 'exact_url'
                # Level 2: Prefix Match (e.g. target is base product, item has extra params)
                # Or Target contained in item (fuzzy backup)
                elif item_key.startswith(target_key) or target_key in item_key:
                    score += 800
                    item['match_quality'] = 'fuzzy_url'

            # --- 2. TEXT MATCHING ---
            # 1. Exact Brand Match (First word usually)
            if title.startswith(query_terms[0]):
                score += 50
                
            # 2. Term Overlap
            matches = sum(1 for term in query_terms if term in title)
            score += matches * 10
            
            # 3. Phrase Match Boost
            for phrase in phrases:
                if phrase in title:
                    score += 200
            
            # 4. Model Number Boost
            for model in model_terms:
                if model in title:
                    score += 500
            
            # Set generic match quality if not set by URL
            if 'match_quality' not in item:
                if score >= 200:
                    item['match_quality'] = 'exact_text'
                else:
                    item['match_quality'] = 'related'

            scored_results.append((score, item))
            
        # Sort by score descending
        scored_results.sort(key=lambda x: x[0], reverse=True)
        
        return [item for _, item in scored_results]

    # Placeholder for the new _generate_ai_insight method
    def _generate_ai_insight(self, ranked_online, query):
        # Delegate to the real synthesis method
        # We pass empty lists for local/instagram for now as the new signature supports them but current flow might not prioritize them for insight
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
        
        # 1. Check if query is URL
        url_pattern = re.compile(r'https?://\S+')
        extracted_data = None
        target_url = None
        
        if url_pattern.match(query):
            extracted_data = self.url_service.extract_product_from_url(query)
            # Fix: Capture original/resolved URLs before overwriting query
            target_url = extracted_data.get("resolved_url") or extracted_data.get("original_url") or query
            query = extracted_data.get("search_query", query)
        
        logger.info(f"Fetching Data for: {query}, Target URL: {target_url}")
        
        logger.info(f"Fetching Data for: {query}")
        
        # 2. Results Fetching
        # Use search_products which handles the fallback to organic search if shopping fails
        scraper_response = self.scraper.search_products(query)
        serp_results = scraper_response.get("online", [])
        local_results = self.scraper.search_local_stores(query, location)
        instagram_results = self.scraper.search_instagram(query, location)
        
        # 3. Synthesis
        final_results = []
        final_results.extend(serp_results)
        
        # Rank Results
        ranked_online = self._rank_results(final_results, query, target_url=target_url)

        # 4. Passive History Recording (New)
        if db:
            from app.services.db_utils import save_product_snapshot
            try:
                # We save the top 5 most relevant results to avoid spamming DB with low quality matches
                # Only save results that are 'exact' matches or top ranked
                for item in ranked_online[:5]:
                    save_product_snapshot(db, item)
            except Exception as e:
                logger.error(f"Passive History Save Failed: {e}")
        
        return {
            "query": query,
            "match_type": "url" if extracted_data else "text",
            "extracted_metadata": extracted_data,
            "results": {
                "online": ranked_online,
                "instagram": instagram_results,
                "local": local_results
            },
            "insight": self._generate_ai_insight(ranked_online, query)
        }
