from openai import OpenAI
import json
import logging
import os
import base64
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ImageAnalyzerService:
    def __init__(self):
        try:
            api_key = os.environ.get("OPENAI_API_KEY")
            if api_key:
                self.client = OpenAI(api_key=api_key)
            else:
                self.client = None
        except Exception as e:
            logger.warning(f"OpenAI Client Init Failed (Image Analysis disabled): {e}")
            self.client = None

    def analyze_product_image(self, base64_image: str) -> Dict[str, Any]:
        if not self.client:
            return {
                "error": "Image analysis unavailable (No API Key)",
                "search_query": "",
                "confidence": "low"
            }
        """
        Uses GPT-4 Vision to analyze a product image and extract searchable details.
        
        Args:
            base64_image: Base64 encoded image string
            
        Returns:
            Dictionary with extracted product details and search query
        """
        try:
            logger.info("Analyzing product image with GPT-4 Vision")
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Using gpt-4o-mini for vision (cost-effective)
                messages=[
                    {
                        "role": "system",
                        "content": """You are a product identification expert. Analyze the image and extract product details.
                        Return JSON with:
                        - 'product_type': Category (e.g., Watch, Handbag, Shoes, Phone)
                        - 'brand': Brand name if visible (e.g., Michael Kors, Gucci, Apple)
                        - 'model': Model name/number if visible
                        - 'color': Primary color(s)
                        - 'distinctive_features': Key visual features (e.g., "chronograph dial", "pave crystals")
                        - 'search_query': Optimized search term for finding this product in India
                        - 'confidence': Your confidence level (high/medium/low)
                        
                        If you cannot identify the product clearly, set confidence to 'low' and provide best guess."""
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            },
                            {
                                "type": "text",
                                "text": "What product is this? Extract all visible details."
                            }
                        ]
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            logger.info(f"Image analysis complete: {result.get('search_query', 'N/A')}")
            return result
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            return {
                "error": str(e),
                "search_query": "",
                "confidence": "low"
            }
