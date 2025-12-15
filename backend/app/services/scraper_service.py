import requests
from bs4 import BeautifulSoup
import random
import logging
import os
from serpapi import GoogleSearch
import asyncio
import re

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
                "num": 100,
                "direct_link": True
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            shopping_results = results.get("shopping_results", [])
            
            cleaned_results = []
            valid_count = 0
            
            for item in shopping_results:
                url = item.get("link")
                if not url:
                    url = item.get("product_link")
                
                if not url:
                    continue

                # URL Cleaning & Filtering
                if "google.com" in url or "google.co.in" in url:
                    # 1. Try to extract real URL from redirect (e.g. url?q=)
                    url = self._clean_google_url(url)
                    
                    # 2. Filtering Logic
                    # Allow 'aclk' (Ad Click) redirects as they go to the product (User Option A)
                    if "/aclk" in url:
                        pass 
                    # Discard 'search' pages (Shopping Viewer, e.g. ibp=oshop) which are bad UX
                    elif "/search" in url or "ibp=oshop" in url:
                        continue
                    # Any other google links that weren't cleaned? Maybe keep them if they aren't search pages.
                    # But to be safe, if it's still a raw google link and not aclk, we might want to skip it 
                    # to strictly avoid search pages.
                    elif "google.com" in url or "google.co.in" in url:
                         # If it's just a google domain but not aclk, it's likely a search page or profile
                         continue

                valid_count += 1
                cleaned_results.append({
                    "id": item.get("product_id", f"serp_{random.randint(1000,9999)}"),
                    "source": item.get("source", "Google Shopping"),
                    "title": item.get("title"),
                    "price": float(item.get("price", "0").replace("₹", "").replace(",", "").strip()) if item.get("price") else 0,
                    "url": url,
                    "image": item.get("thumbnail"),
                    "rating": item.get("rating", 0),
                    "reviews": item.get("reviews", 0),
                    "delivery": item.get("delivery", "Check Site")
                })
            
            # If we found very few direct links, return empty to trigger strict fallback
            if valid_count < 3:
                logger.warning(f"Only found {valid_count} valid direct links. Triggering fallback.")
                return []

            return cleaned_results
        except Exception as e:
            logger.error(f"SerpApi Failed: {e}")
            return []

    def _clean_google_url(self, url: str) -> str:
        """
        Extracts the destination URL from a Google redirect link.
        e.g., https://www.google.com/url?q=https://example.com/...
        """
        try:
            if "url?q=" in url:
                start = url.find("url?q=") + len("url?q=")
                end = url.find("&", start)
                if end != -1:
                    return requests.utils.unquote(url[start:end])
                else:
                    return requests.utils.unquote(url[start:])
            return url
        except:
            return url

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
        Discover Instagram boutiques using Google web search with site:instagram.com restriction.
        Returns Instagram shop profiles discovered via Google search.
        """
        # Build search query with Instagram site restriction
        if location:
            search_query = f"{query} {location} site:instagram.com"
        else:
            search_query = f"{query} India site:instagram.com"
        
        logger.info(f"Discovering Instagram shops via Google search: {search_query}")
        
        try:
            params = {
                "engine": "google",
                "q": search_query,
                "api_key": self.serpapi_key,
                "num": 10
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            
            organic_results = results.get("organic_results", [])
            logger.info(f"Found {len(organic_results)} Google results for Instagram shops")
            
            # Filter keywords for boutiques/stores
            store_keywords = ['store', 'boutique', 'shop', 'label', 'studio', 'collection', 'designer', 'brand']
            
            instagram_results = []
            seen_handles = set()
            
            for item in organic_results:
                link = item.get("link", "")
                title = item.get("title", "")
                snippet = item.get("snippet", "")
                
                # Extract Instagram handle from URL
                if "instagram.com" in link:
                    import re
                    handle_match = re.search(r'instagram\.com/([^/?]+)', link)
                    if handle_match:
                        handle = handle_match.group(1)
                        
                        # Skip if we've already seen this handle
                        if handle in seen_handles:
                            continue
                        
                        # Filter for likely store accounts
                        text_to_check = (title + ' ' + snippet).lower()
                        is_likely_store = any(keyword in text_to_check for keyword in store_keywords)
                        
                        # Include all for now (can tighten filter later)
                        if is_likely_store or True:
                            seen_handles.add(handle)
                            
                            # Don't extract price from snippets - too many false positives (addresses, dates, etc.)
                            # Instagram sellers typically use "DM for price" model anyway
                            
                            instagram_results.append({
                                "type": "account",
                                "id": f"ig_profile_{handle}",
                                "username": handle,
                                "profile_url": f"https://instagram.com/{handle}",
                                "post_url": f"https://instagram.com/{handle}",
                                "caption": snippet[:150] + "..." if len(snippet) > 150 else snippet,
                                "image": "https://via.placeholder.com/400x400?text=Instagram+Shop",
                                "price": 0,  # Always 0 - prices not reliable from search snippets
                                "likes": 0,
                                "comments": 0,
                                "followers": 0
                            })
                            
                            if len(instagram_results) >= 15:
                                break
            
            logger.info(f"Returning {len(instagram_results)} unique Instagram shop profiles")
            return instagram_results
            
        except Exception as e:
            logger.error(f"Google Instagram search failed: {e}")
            return []

    def search_organic(self, query: str):
        """
        Fallback: Uses Google Organic Search to find direct product pages (Amazon, Nykaa, etc.)
        when Google Shopping fails to provide direct links (returns only 'Compare' pages).
        """
        logger.info(f"Searching Organic Fallback for: {query}")
        try:
            params = {
                "engine": "google",
                "q": query,
                "gl": "in",
                "hl": "en",
                "api_key": self.serpapi_key,
                "num": 20
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            organic_results = results.get("organic_results", [])
            
            cleaned_results = []
            for item in organic_results:
                title = item.get("title")
                link = item.get("link")
                snippet = item.get("snippet", "")
                rich_snippet = item.get("rich_snippet", {})
                
                # Try to extract price from text (e.g. "₹450")
                price = 0
                text_blob = f"{title} {snippet} {str(rich_snippet)}"
                price_match = re.search(r'₹\s?([\d,]+\.?\d*)', text_blob)
                if price_match:
                    try:
                        price = float(price_match.group(1).replace(",", ""))
                    except:
                        pass
                else:
                    # Alternative regex for "Rs."
                    price_match_rs = re.search(r'(?:Rs\.?|INR)\s?([\d,]+\.?\d*)', text_blob, re.IGNORECASE)
                    if price_match_rs:
                         try:
                            price = float(price_match_rs.group(1).replace(",", ""))
                         except:
                            pass

                cleaned_results.append({
                    "id": f"org_{random.randint(1000,9999)}",
                    "source": item.get("source", "Web Result"), # Often extracted from domain
                    "title": title,
                    "price": price,
                    "url": link,
                    "image": item.get("thumbnail", "https://via.placeholder.com/150?text=Web+Result"),
                    "rating": 0,
                    "reviews": 0,
                    "delivery": "Check Site"
                })
            
            return cleaned_results
        except Exception as e:
            logger.error(f"Organic Fallback Failed: {e}")
            return []


    def search_products(self, query: str):
        # Primary: SerpApi Google Shopping
        online_results = self.search_serpapi(query)
        
        # Fallback: If no valid shopping results (likely due to strict link filtering), use Organic
        if not online_results:
            logger.warning("Google Shopping returned 0 valid links. Switching to Organic Search.")
            online_results = self.search_organic(query)
        
        # If SerpApi returns nothing or fails, we could try Playwright (async handling needed)
        # For now, let's just return SerpApi results as they are high quality.
        # To truly use both, we'd need to run parsing logic which is complex to sync.
        
        return {
            "online": online_results,
            "local": [] 
        }
