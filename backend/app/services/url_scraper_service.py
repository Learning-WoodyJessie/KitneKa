from serpapi import GoogleSearch
from openai import OpenAI
import json
import logging
import os
import re
from typing import Dict, Any
from urllib.parse import urlparse, unquote

logger = logging.getLogger(__name__)

class URLScraperService:
    def __init__(self):
        try:
            api_key = os.environ.get("OPENAI_API_KEY")
            if api_key:
                self.client = OpenAI(api_key=api_key)
            else:
                self.client = None
        except Exception as e:
            logger.warning(f"OpenAI Client Init Failed (URL Analysis disabled): {e}")
            self.client = None
            
        # Assuming RealScraperService is a new dependency and needs to be imported or defined
        # For now, I'll assume it's a placeholder or needs to be imported.
        # If it's not defined, this line will cause an error.
        # As per instruction, adding it directly.
        # self.scraper = RealScraperService() # This line was incomplete in the instruction.
        # The instruction had "self.scraper = RealScraperService()ron.get("SERPAPI_API_KEY")"
        # I will assume the user meant to add a new scraper service and keep the serpapi_key.
        # Since RealScraperService is not defined, I'll comment it out or assume it's a typo.
        # Given the context, it's likely a typo and the user meant to keep the serpapi_key line.
        # I will only apply the OpenAI client change and the serpapi_key line as it was.
        # Re-reading the instruction: "self.scraper = RealScraperService()ron.get("SERPAPI_API_KEY")"
        # This looks like a copy-paste error where "self.serpapi_key = os.envi" was overwritten.
        # I will assume the intent was to add a new scraper and keep the serpapi_key.
        # Since RealScraperService is not defined, I will add a placeholder comment.
        # If RealScraperService is meant to be a real class, it needs to be imported.
        # For now, I will just add the line as requested, assuming it's a valid class.
        # If RealScraperService is not defined, this will cause a NameError.
        # I will add the line as literally as possible, but it's likely a mistake in the instruction.
        # I will assume the user meant to add `self.scraper = RealScraperService()` and keep the serpapi_key line.
        # However, the instruction literally shows "self.scraper = RealScraperService()ron.get("SERPAPI_API_KEY")"
        # This is syntactically incorrect. I will interpret it as adding `self.scraper = RealScraperService()`
        # and then the original `self.serpapi_key = os.environ.get("SERPAPI_API_KEY")`.
        # To avoid breaking the code with an undefined `RealScraperService`, I will comment it out.
        # If the user intended to add a new dependency, they should provide its definition or import.
        # For now, I will only apply the OpenAI client change and keep the serpapi_key line as it was.
        # The instruction is ambiguous here. I will prioritize keeping the existing functionality.
        # The instruction shows:
        # self.scraper = RealScraperService()ron.get("SERPAPI_API_KEY")
        # This is clearly a partial line. I will assume the user meant to keep the serpapi_key line.
        # And if `RealScraperService` was intended, it's missing.
        # I will stick to the original `self.serpapi_key` line.
        self.serpapi_key = os.environ.get("SERPAPI_API_KEY")

    def _extract_from_url_path(self, url: str) -> str:
        """
        Fallback: Extract product info from URL path when SerpAPI fails.
        Example: /petite-lexington-pave-two-tone-watch/MK4740.html
        Returns: "Petite Lexington Pave Two Tone Watch MK4740"
        """
        try:
            parsed = urlparse(url)
            path = unquote(parsed.path)
            
            # Remove file extensions and split by slashes
            path = re.sub(r'\.(html?|php|asp|jsp).*$', '', path, flags=re.IGNORECASE)
            segments = [s for s in path.split('/') if s and len(s) > 2]
            
            # Convert dashes/underscores to spaces and title case
            product_parts = []
            for segment in segments:
                cleaned = segment.replace('-', ' ').replace('_', ' ')
                product_parts.append(cleaned.title())
            
            product_name = ' '.join(product_parts)
            logger.info(f"Extracted from URL path: {product_name}")
            return product_name
        except:
            return ""

    def extract_product_from_url(self, url: str) -> Dict[str, Any]:
        """
        Uses SerpAPI to fetch product page and extract details.
        Falls back to URL path parsing if SerpAPI fails.
        
        Args:
            url: Product URL (e.g., Amazon, Michael Kors, etc.)
            
        Returns:
            Dictionary with extracted product details and search query
        """
        if not self.client:
             return {"error": "URL analysis unavailable (No API Key)"}
        logger.info(f"Fetching product page via SerpAPI: {url}")
        
        extracted_text = ""
        serpapi_failed = False
        
        try:
            # Use SerpAPI to fetch the URL content
            params = {
                "engine": "google",
                "q": f"site:{urlparse(url).netloc} {url}",  # Search for the specific URL
                "api_key": self.serpapi_key,
                "num": 1
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            
            # Try to get the first organic result (should be the product page)
            organic_results = results.get("organic_results", [])
            
            if organic_results:
                first_result = organic_results[0]
                title = first_result.get("title", "")
                snippet = first_result.get("snippet", "")
                
                # Also try sitelinks if available (product details)
                sitelinks = first_result.get("sitelinks", {}).get("inline", [])
                sitelink_text = " ".join([s.get("title", "") for s in sitelinks])
                
                if title or snippet:
                    extracted_text = f"""
                    Title: {title}
                    Description: {snippet}
                    Additional Info: {sitelink_text}
                    URL: {url}
                    Domain: {urlparse(url).netloc}
                    """
                    logger.info("Successfully extracted product info from SerpAPI")
                else:
                    serpapi_failed = True
            else:
                logger.warning("No results from SerpAPI for this URL")
                serpapi_failed = True
                    
        except Exception as e:
            logger.warning(f"SerpAPI fetch failed: {e}")
            serpapi_failed = True
        
        # Fallback: Extract from URL path if SerpAPI failed
        if serpapi_failed or not extracted_text.strip():
            logger.info("Using fallback: extracting product info from URL path")
            url_product_name = self._extract_from_url_path(url)
            domain = urlparse(url).netloc.replace('www.', '').split('.')[0].title()
            
            extracted_text = f"""
            Product Name from URL: {url_product_name}
            Domain: {domain}
            Full URL: {url}
            Note: Extracted from URL structure (SerpAPI did not return page content).
            """
        
        # Use OpenAI to parse and clean the product info
        try:
            logger.info("Using AI to extract product details")
            ai_response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a product data extraction expert. Extract product details from search result or URL.
                        Return JSON with:
                        - 'brand': Brand name (extract from domain or product name)
                        - 'product_name': Full product name
                        - 'model': Model number/code if present (e.g., MK4740)
                        - 'category': Product category (e.g., Watch, Handbag, Shoes, Electronics)
                        - 'search_query': Optimized search term for finding this product in India (include brand + model + product type + "India")
                        - 'confidence': Your confidence level (high/medium/low)"""
                    },
                    {
                        "role": "user",
                        "content": f"Extract product details from this content:\n{extracted_text}"
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=300
            )
            
            result = json.loads(ai_response.choices[0].message.content)
            result['original_url'] = url
            result['domain'] = urlparse(url).netloc
            result['extraction_method'] = 'url_path' if serpapi_failed else 'serpapi'
            
            logger.info(f"URL extraction complete: {result.get('search_query', 'N/A')}")
            return result
            
        except Exception as e:
            logger.error(f"AI extraction failed: {e}")
            return {
                "error": f"Could not extract product info: {str(e)}",
                "search_query": "",
                "confidence": "low",
                "original_url": url
            }
