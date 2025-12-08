import requests
from bs4 import BeautifulSoup
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
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

    def _extract_from_url_path(self, url: str) -> str:
        """
        Fallback: Extract product info from URL path when scraping fails.
        Example: /petite-lexington-pave-two-tone-watch/MK4740.html
        Returns: "Petite Lexington Pave Two Tone Watch MK4740"
        """
        try:
            parsed = urlparse(url)
            path = unquote(parsed.path)  # Decode URL encoding
            
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
        Scrapes a product URL and extracts product details.
        Falls back to URL path parsing if scraping fails.
        
        Args:
            url: Product URL (e.g., Amazon, Michael Kors, etc.)
            
        Returns:
            Dictionary with extracted product details and search query
        """
        logger.info(f"Scraping product URL: {url}")
        
        extracted_text = ""
        scraping_failed = False
        
        try:
            # Try to fetch the page
            response = requests.get(url, headers=self.headers, timeout=10, allow_redirects=True)
            
            # Check if we got blocked
            if response.status_code == 403 or "access denied" in response.text.lower():
                logger.warning(f"Website blocked our request (Status: {response.status_code})")
                scraping_failed = True
            else:
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract various metadata
                title = soup.find('title')
                title_text = title.text.strip() if title else ""
                
                # Try to get product name from meta tags
                og_title = soup.find('meta', property='og:title')
                og_title_content = og_title.get('content', '').strip() if og_title else ""
                
                meta_desc = soup.find('meta', attrs={'name': 'description'})
                description = meta_desc.get('content', '').strip() if meta_desc else ""
                
                # Try to get JSON-LD structured data
                json_ld = soup.find('script', type='application/ld+json')
                structured_data = ""
                if json_ld:
                    try:
                        structured_data = json_ld.string[:500]
                    except:
                        pass
                
                # If we got meaningful content, use it
                if title_text or og_title_content or description:
                    extracted_text = f"""
                    Title: {title_text}
                    OG Title: {og_title_content}
                    Description: {description}
                    Structured Data: {structured_data}
                    URL: {url}
                    """
                else:
                    scraping_failed = True
                    
        except requests.exceptions.RequestException as e:
            logger.warning(f"Failed to fetch URL: {e}")
            scraping_failed = True
        except Exception as e:
            logger.warning(f"Scraping failed: {e}")
            scraping_failed = True
        
        # Fallback: Extract from URL path if scraping failed
        if scraping_failed or not extracted_text.strip():
            logger.info("Using fallback: extracting product info from URL path")
            url_product_name = self._extract_from_url_path(url)
            domain = urlparse(url).netloc.replace('www.', '').split('.')[0].title()
            
            extracted_text = f"""
            Product Name from URL: {url_product_name}
            Domain: {domain}
            Full URL: {url}
            Note: Could not scrape page content (website may block bots), extracted from URL structure instead.
            """
        
        # Use OpenAI to parse and clean the product info
        try:
            logger.info("Using AI to extract product details")
            ai_response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a product data extraction expert. Extract product details from webpage content or URL.
                        Return JSON with:
                        - 'brand': Brand name (extract from domain or product name)
                        - 'product_name': Full product name
                        - 'model': Model number/code if present (e.g., MK4740)
                        - 'category': Product category (e.g., Watch, Handbag, Shoes)
                        - 'search_query': Optimized search term for finding this product in India (include brand, model, India)
                        - 'confidence': Your confidence level (high/medium/low)
                        - 'note': Any relevant notes about extraction method"""
                    },
                    {
                        "role": "user",
                        "content": f"Extract product details from this content:\\n{extracted_text}"
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=300
            )
            
            result = json.loads(ai_response.choices[0].message.content)
            result['original_url'] = url
            result['domain'] = urlparse(url).netloc
            result['scraping_method'] = 'url_path' if scraping_failed else 'html_content'
            
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
