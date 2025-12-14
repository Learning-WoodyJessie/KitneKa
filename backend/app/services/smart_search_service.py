from openai import OpenAI
import json
import logging
import os
from app.services.scraper_service import RealScraperService

logger = logging.getLogger(__name__)

class SmartSearchService:
    def __init__(self):
        try:
            api_key = os.environ.get("OPENAI_API_KEY")
            if api_key:
                self.client = OpenAI(api_key=api_key)
            else:
                self.client = None
        except Exception as e:
            logger.warning(f"OpenAI Client Init Failed (Smart Search will use fallbacks): {e}")
            self.client = None
            
        self.scraper = RealScraperService()

    def _analyze_query(self, query: str):
        """
        Uses LLM to understand category and optimize search terms.
        """
        if not self.client:
            return {"category": "General", "optimized_term": query, "needs_local": True}
        try:
            response = self.client.chat.completions.create(
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
        if not self.client:
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
            response = self.client.chat.completions.create(
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

    def _rank_results(self, results, query):
        """
        Re-rank results to prioritize items matching the query.
        Filters out completely irrelevant results if good matches exist.
        """
        if not results:
            return []
            
        query_terms = query.lower().split()
        if not query_terms:
            return results
            
        scored_results = []
        for item in results:
            title = item.get("title", "").lower()
            score = 0
            
            # 1. Exact Brand Match (First word usually)
            if title.startswith(query_terms[0]):
                score += 50
                
            # 2. Term Overlap
            matches = sum(1 for term in query_terms if term in title)
            score += matches * 10
            
            # 3. Penalty for competitor names if query is specific? (Advanced, skipping for now)
            
            scored_results.append((score, item))
            
        # Sort by score descending
        scored_results.sort(key=lambda x: x[0], reverse=True)
        
        # Filter Logic:
        # If we have items with score > 0, keep only those.
        # If all are 0 (no text match), keep all (fallback).
        has_matches = any(s > 0 for s, _ in scored_results)
        
        if has_matches:
            # Keep top 80% relevant or just those with score > 0
            # Let's keep strict checks: score > 0
            final_results = [item for s, item in scored_results if s > 0]
            return final_results
        
        return [item for _, item in scored_results]

    def smart_search(self, query: str, location: str = "Mumbai"):
        # 1. Analyze
        logger.info(f"Smart Search Analysis for: {query}")
        analysis = self._analyze_query(query)
        search_term = analysis.get("optimized_term", query)
        
        # 2. Fetch Data (Parallel ideally, sequential for now)
        logger.info(f"Fetching Data for: {search_term}")
        online_results = self.scraper.search_serpapi(search_term)
        local_results = self.scraper.search_local_stores(search_term, location)
        instagram_results = self.scraper.search_instagram(search_term, location)
        
        # 3. Re-Rank / Filter Online Results
        # Use original query for relevance check to ensure user intent is preserved
        # (Optimized term might be broad, but ranking should respect original intent)
        online_results = self._rank_results(online_results, query)
        
        # 4. Synthesize
        logger.info("Synthesizing Results...")
        insight = self._synthesize_results(query, online_results, local_results, instagram_results)
        
        return {
            "analysis": analysis,
            "results": {
                "online": online_results,
                "local": local_results,
                "instagram": instagram_results
            },
            "insight": insight
        }
