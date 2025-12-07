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

    def search_instagram(self, query: str, location: str = None):
        """
        Uses SerpApi to search Instagram for product-related posts AND profiles/accounts.
        Returns combined results of Instagram posts and seller accounts.
        """
        # Include location in query for better local results
        search_query = f"{query} {location}" if location else query
        logger.info(f"Searching Instagram posts and accounts for: {search_query}")
        
        all_results = []
        
        # 1. Search for Posts
        try:
            params_posts = {
                "engine": "instagram",
                "q": search_query,
                "api_key": self.serpapi_key
            }
            
            search = GoogleSearch(params_posts)
            results = search.get_dict()
            
            logger.info(f"Instagram Posts API response keys: {list(results.keys())}")
            posts = results.get("posts", results.get("results", results.get("organic_results", [])))
            logger.info(f"Found {len(posts)} Instagram posts")
            
            for item in posts[:10]:  # Limit to 10 posts
                caption = item.get("caption", item.get("text", ""))
                price = 0
                if caption:
                    import re
                    price_match = re.search(r'[₹Rs\.?\s]*(\d+(?:,\d+)*)', caption)
                    if price_match:
                        try:
                            price = float(price_match.group(1).replace(',', ''))
                        except:
                            price = 0
                
                all_results.append({
                    "type": "post",
                    "id": item.get("post_id", item.get("id", f"ig_post_{random.randint(1000,9999)}")),
                    "username": item.get("username", item.get("user", {}).get("username", "Instagram User")),
                    "profile_url": f"https://instagram.com/{item.get('username', item.get('user', {}).get('username', ''))}",
                    "post_url": item.get("link", item.get("url", "")),
                    "caption": caption[:150] + "..." if len(caption) > 150 else caption,
                    "image": item.get("thumbnail", item.get("image", "")),
                    "price": price,
                    "likes": item.get("likes", item.get("like_count", 0)),
                    "comments": item.get("comments", item.get("comment_count", 0))
                })
        except Exception as e:
            logger.error(f"SerpApi Instagram Posts search failed: {e}")
        
        # 2. Search for Profiles/Accounts
        try:
            # Try searching with type=user to get profiles
            params_profiles = {
                "engine": "instagram",
                "q": search_query,
                "type": "users",  # Search for user profiles
                "api_key": self.serpapi_key
            }
            
            search_profiles = GoogleSearch(params_profiles)
            profile_results = search_profiles.get_dict()
            
            logger.info(f"Instagram Profiles API response keys: {list(profile_results.keys())}")
            profiles = profile_results.get("users", profile_results.get("accounts", profile_results.get("results", [])))
            logger.info(f"Found {len(profiles)} Instagram profiles")
            
            for profile in profiles[:10]:  # Limit to 10 profiles
                username = profile.get("username", profile.get("user", {}).get("username", ""))
                bio = profile.get("bio", profile.get("biography", ""))
                
                # Try to extract price from bio
                price = 0
                if bio:
                    import re
                    price_match = re.search(r'[₹Rs\.?\s]*(\d+(?:,\d+)*)', bio)
                    if price_match:
                        try:
                            price = float(price_match.group(1).replace(',', ''))
                        except:
                            price = 0
                
                all_results.append({
                    "type": "account",
                    "id": f"ig_profile_{username}",
                    "username": username,
                    "profile_url": f"https://instagram.com/{username}",
                    "post_url": f"https://instagram.com/{username}",
                    "caption": bio[:150] + "..." if len(bio) > 150 else bio,
                    "image": profile.get("profile_pic_url", profile.get("profile_picture", "")),
                    "price": price,
                    "likes": 0,
                    "comments": profile.get("posts_count", profile.get("media_count", 0)),
                    "followers": profile.get("followers", profile.get("follower_count", 0))
                })
        except Exception as e:
            logger.error(f"SerpApi Instagram Profiles search failed: {e}")
        
        logger.info(f"Returning {len(all_results)} total Instagram results ({sum(1 for r in all_results if r['type'] == 'post')} posts, {sum(1 for r in all_results if r['type'] == 'account')} accounts)")
        return all_results



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
