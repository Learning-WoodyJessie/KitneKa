from openai import OpenAI
import json
import logging
import os
from app.services.scraper_service import RealScraperService

logger = logging.getLogger(__name__)

class SmartSearchService:
    def __init__(self):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        self.scraper = RealScraperService()

    def _analyze_query(self, query: str):
        """
        Uses LLM to understand category and optimize search terms.
        """
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

    def _synthesize_results(self, query, online_data, local_data):
        """
        Uses LLM to rank products and generate recommendations.
        """
        # Prepare context for LLM (limit data to avoid token limits)
        context = {
            "query": query,
            "online_top_5": online_data[:5],
            "local_top_5": local_data[:5]
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

    def smart_search(self, query: str, location: str = "Mumbai"):
        # 1. Analyze
        logger.info(f"Smart Search Analysis for: {query}")
        analysis = self._analyze_query(query)
        search_term = analysis.get("optimized_term", query)
        
        # 2. Fetch Data (Parallel ideally, sequential for now)
        logger.info(f"Fetching Data for: {search_term}")
        online_results = self.scraper.search_serpapi(search_term) # We already have this
        local_results = self.scraper.search_local_stores(search_term, location) # Need to implement this
        
        # 3. Synthesize
        logger.info("Synthesizing Results...")
        insight = self._synthesize_results(query, online_results, local_results)
        
        return {
            "analysis": analysis,
            "results": {
                "online": online_results,
                "local": local_results
            },
            "insight": insight
        }
