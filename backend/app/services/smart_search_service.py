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

    def _rank_results(self, results, query, original_url=None):
        """
        Rank results based on relevance to the query.
        Returns a list of (score, item) tuples.
        """
        if not results:
            return []
            
        query_terms = query.lower().split()
        if not query_terms:
            return results
            
        # Identify potential model numbers (e.g., MK9022, iPhone15, 3080Ti)
        model_terms = [term for term in query_terms if any(c.isdigit() for c in term) and len(term) > 2]
        
        # Identify Phrases (2-word combinations) for specific name boosting
        # e.g., "mini izzy" needs to be boosted more than just "mini" + "izzy" separately
        phrases = [" ".join(query_terms[i:i+2]) for i in range(len(query_terms)-1)] if len(query_terms) > 1 else []

        scored_results = []
        for item in results:
            title = item.get("title", "").lower()
            item_url = item.get("url", "")
            score = 0
            
            # 0. Original URL Match (The Absolute Best Match)
            # If the user searched via URL, this IS the product.
            if original_url:
                 # Check for equality or mutual inclusion (to handle redirect mismatches/query params)
                 if original_url == item_url or (original_url in item_url) or (item_url in original_url and len(item_url) > 20):
                     score += 1000

            # 1. Exact Brand Match (First word usually)
            if title.startswith(query_terms[0]):
                score += 50
                
            # 2. Term Overlap
            matches = sum(1 for term in query_terms if term in title)
            score += matches * 10
            
            # 3. Phrase Match Boost (High priority for specific product names)
            for phrase in phrases:
                if phrase in title:
                    score += 200
            
            # 4. Model Number Boost (Critical for specific URL searches)
            for model in model_terms:
                if model in title:
                    score += 500 # Massive boost for exact model match
            
            # Determine match quality based on score
            # Score >= 200 implies a Phrase Match (200) or Model Match (500)
            if score >= 200:
                item['match_quality'] = 'exact'
            else:
                item['match_quality'] = 'related'

            scored_results.append((score, item))
            
        # Sort by score descending
        scored_results.sort(key=lambda x: x[0], reverse=True)
        
        # Return all results, sorted by score.
        return [item for _, item in scored_results]

    # Placeholder for the new _generate_ai_insight method
    def _generate_ai_insight(self, ranked_online, query):
        # Delegate to the real synthesis method
        # We pass empty lists for local/instagram for now as the new signature supports them but current flow might not prioritize them for insight
        return self._synthesize_results(query, ranked_online, [], [])

    def smart_search(self, query: str, location: str = "Mumbai"):
        """
        Orchestrates the search:
        1. Analyzes query (is it a URL?)
        2. Extracts product info if URL
        3. Searches Google/SerpAPI
        4. Ranks Results
        """
        logger.info(f"Smart Search Analysis for: {query}")
        
        # 1. Check if query is URL
        url_pattern = re.compile(r'https?://\S+')
        extracted_data = None
        original_url = None
        
        if url_pattern.match(query):
            extracted_data = self.url_service.extract_product_from_url(query)
            query = extracted_data.get("search_query", query)
            original_url = extracted_data.get("original_url", query) # Use resolved URL
        
        logger.info(f"Fetching Data for: {query}")
        
        # 2. Results Fetching (Parallel placeholders)
        serp_results = self.scraper.search_serpapi(query) # Using correct scraper reference
        local_results = self.scraper.search_local_stores(query, location)
        instagram_results = self.scraper.search_instagram(query, location)
        
        # 3. Synthesis
        final_results = []
        final_results.extend(serp_results)
        
        # Rank Results
        ranked_online = self._rank_results(final_results, query, original_url=original_url)
        
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
