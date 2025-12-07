import requests
from bs4 import BeautifulSoup
import random
import logging
import os
from serpapi import GoogleSearch
import asyncio

logger = logging.getLogger(__name__)

class RealScraperService:
    def __init__(self):
        self.serpapi_key = os.environ.get("SERPAPI_API_KEY")
        self.user_agents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ]

    def search_serpapi(self, query: str):
        """
        Uses SerpApi to search Google Shopping.
        Returns a list of dictionaries with product details.
        """
        logger.info(f"Searching SerpApi for: {query}")
        try:
            params = {
                "engine": "google_shopping",
                "q": query,
                "gl": "in",
                "hl": "en",
                "api_key": self.serpapi_key,
                "num": 100
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            shopping_results = results.get("shopping_results", [])
            
            cleaned_results = []
            for item in shopping_results:
                cleaned_results.append({
                    "id": item.get("product_id", f"serp_{random.randint(1000,9999)}"),
                    "source": item.get("source", "Google Shopping"),
                    "title": item.get("title"),
                    "price": float(item.get("price", "0").replace("₹", "").replace(",", "").strip()) if item.get("price") else 0,
                    "url": item.get("link"),
                    "image": item.get("thumbnail"),
                    "rating": item.get("rating", 0),
                    "reviews": item.get("reviews", 0),
                    "delivery": item.get("delivery", "Check Site")
                })
            return cleaned_results
        except Exception as e:
            logger.error(f"SerpApi Failed: {e}")
            return []

    async def search_playwright(self, query: str):
        # ... (Implementation kept as fallback)
        pass 

    def search_local_stores(self, query: str, location: str = "Mumbai"):
        """
        Uses SerpApi to search Local Google Shopping (tbm=lcl).
        """
        logger.info(f"Searching Local Stores for: {query} in {location}")
        try:
            params = {
                "engine": "google_local", # Uses Google Maps/Local results
                "q": query,
                "location": location,
                "google_domain": "google.co.in",
                "gl": "in",
                "hl": "en",
                "api_key": self.serpapi_key
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            local_results = results.get("local_results", [])
            
            cleaned_results = []
            for item in local_results:
                cleaned_results.append({
                    "id": item.get("place_id", f"loc_{random.randint(1000,9999)}"),
                    "source": item.get("title", "Local Store"), # Store Name
                    "title": query, # Local results often don't have product titles, so we assume they carry the query item
                    "price": float(item.get("price", "0").replace("₹", "").replace(",", "").strip()) if item.get("price") else 0,
                    "distance": item.get("distance", "Nearby"),
                    "address": item.get("address", "Check Map"),
                    "rating": item.get("rating", 0),
                    "reviews": item.get("reviews", 0),
                    "image": item.get("thumbnail"), 
                    "delivery": "In Store"
                })
            return cleaned_results
        except Exception as e:
            logger.error(f"SerpApi Local Failed: {e}")
            return []


    def search_products(self, query: str):
        # Primary: SerpApi
        online_results = self.search_serpapi(query)
        
        # If SerpApi returns nothing or fails, we could try Playwright (async handling needed)
        # For now, let's just return SerpApi results as they are high quality.
        # To truly use both, we'd need to run parsing logic which is complex to sync.
        
        return {
            "online": online_results,
            "local": [] 
        }
