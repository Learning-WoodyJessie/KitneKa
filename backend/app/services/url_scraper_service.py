import requests
from bs4 import BeautifulSoup
from openai import OpenAI
import json
import logging
import os
from typing import Dict, Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class URLScraperService:
    def __init__(self):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def extract_product_from_url(self, url: str) -> Dict[str, Any]:
        """
        Scrapes a product URL and extracts product details.
        
        Args:
            url: Product URL (e.g., Amazon, Michael Kors, etc.)
            
        Returns:
            Dictionary with extracted product details and search query
        """
        try:
            logger.info(f"Scraping product URL: {url}")
            
            # Fetch the page
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract various metadata
            title = soup.find('title').text if soup.find('title') else ""
            
            # Try to get product name from meta tags
            og_title = soup.find('meta', property='og:title')
            og_title_content = og_title.get('content', '') if og_title else ""
            
            # Try to get description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            description = meta_desc.get('content', '') if meta_desc else ""
            
            # Try to get JSON-LD structured data
            json_ld = soup.find('script', type='application/ld+json')
            structured_data = ""
            if json_ld:
                try:
                    structured_data = json_ld.string
                except:
                    pass
            
            # Combine all extracted text
            extracted_text = f"""
            Title: {title}
            OG Title: {og_title_content}
            Description: {description}
            Structured Data: {structured_data[:500]}
            URL: {url}
            """
            
            # Use OpenAI to parse and clean the product info
            logger.info("Using AI to extract product details from scraped content")
            ai_response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a product data extraction expert. Extract product details from webpage content.
                        Return JSON with:
                        - 'brand': Brand name
                        - 'product_name': Full product name
                        - 'model': Model number/code if present
                        - 'category': Product category
                        - 'search_query': Optimized search term for finding this product in India (add "India" to query)
                        - 'confidence': Your confidence level (high/medium/low)"""
                    },
                    {
                        "role": "user",
                        "content": f"Extract product details from this webpage content:\n{extracted_text}"
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=300
            )
            
            result = json.loads(ai_response.choices[0].message.content)
            result['original_url'] = url
            result['domain'] = urlparse(url).netloc
            
            logger.info(f"URL scraping complete: {result.get('search_query', 'N/A')}")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch URL: {e}")
            return {
                "error": f"Could not access the URL: {str(e)}",
                "search_query": "",
                "confidence": "low"
            }
        except Exception as e:
            logger.error(f"URL scraping failed: {e}")
            return {
                "error": str(e),
                "search_query": "",
                "confidence": "low"
            }
