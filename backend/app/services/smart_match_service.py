
import os
import json
import logging
import numpy as np
from openai import OpenAI
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class SmartMatchService:
    def __init__(self):
        try:
            api_key = os.environ.get("OPENAI_API_KEY")
            if api_key:
                self.client = OpenAI(api_key=api_key)
            else:
                self.client = None
                logger.warning("OPENAI_API_KEY not found. SmartMatchService disabled.")
        except Exception as e:
            logger.error(f"SmartMatchService Init Failed: {e}")
            self.client = None

    def _get_client(self):
        if self.client:
            return self.client
        api_key = os.environ.get("OPENAI_API_KEY")
        if api_key:
            self.client = OpenAI(api_key=api_key)
            return self.client
        return None

    def extract_attributes(self, title: str) -> Dict[str, Any]:
        """
        Uses GPT-4o-mini to extract standardized attributes from product title.
        Cost: ~$0.00015 per call.
        """
        client = self._get_client()
        if not client or not title:
            return {}

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Extract product attributes from the title and return only valid JSON. No explanations."
                    },
                    {
                        "role": "user",
                        "content": f"""Title: {title}\n\nExtract:\n{{\n  "brand": "brand name",\n  "product_type": "hair oil, t-shirt, etc",\n  "model": "onion, dri-fit, etc",\n  "size": "250ml, medium, size 9, etc",\n  "color": "black, white, etc or null",\n  "pack": "2, 3, etc or 1 for single",\n  "normalized_title": "brand + model + type + size, lowercase"\n}}"""
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0,
                max_tokens=150
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Attribute Extraction Failed for '{title}': {e}")
            return {}

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates embedding using text-embedding-3-small.
        Cost: ~$0.00002 per call.
        """
        client = self._get_client()
        if not client or not text:
            return []

        try:
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding Generation Failed: {e}")
            return []

    def calculate_similarity(self, emb1: List[float], emb2: List[float]) -> float:
        """
        Calculates Cosine Similarity between two embeddings.
        """
        if not emb1 or not emb2:
            return 0.0
        
        # Manual Cosine Similarity implementation to avoid heavy dependency like sklearn if not needed
        # (Though numpy is likely available)
        vec1 = np.array(emb1)
        vec2 = np.array(emb2)
        
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        return float(dot_product / (norm1 * norm2))

    def classify_match(self, user_attrs: Dict, result_attrs: Dict, similarity: float) -> str:
        """
        Classifies the match based on user-defined rules.
        Returns: 'EXACT_MATCH', 'SIZE_VARIANT', 'COLOR_VARIANT', 'PACK_VARIANT', 'SIMILAR_PRODUCT', or 'DIFFERENT_PRODUCT'
        """
        # Thresholds from Plan (Adjusted for Real World Noise)
        EXACT_THRESHOLD = 0.90
        VARIANT_THRESHOLD = 0.75
        SIMILAR_THRESHOLD = 0.60

        # Attribute Comparisons
        def normalize(val): 
            return str(val).lower().strip() if val else None

        # Size Match
        u_size = normalize(user_attrs.get("size"))
        r_size = normalize(result_attrs.get("size"))
        same_size = (u_size == r_size)
        
        # Color Match
        u_color = normalize(user_attrs.get("color"))
        r_color = normalize(result_attrs.get("color"))
        # If both are null/none, consider it a match
        same_color = (u_color == r_color) or (not u_color and not r_color)
        
        # Pack Match
        u_pack = normalize(user_attrs.get("pack"))
        r_pack = normalize(result_attrs.get("pack"))
        same_pack = (u_pack == r_pack) or (not u_pack and not r_pack) or (u_pack == '1' and not r_pack) or (not u_pack and r_pack == '1')

        # Logic Flow
        if similarity >= EXACT_THRESHOLD and same_size and same_color and same_pack:
            return "EXACT_MATCH"
        
        if similarity >= VARIANT_THRESHOLD:
            if not same_size:
                return "SIZE_VARIANT"
            if not same_color:
                return "COLOR_VARIANT"
            if not same_pack:
                return "PACK_VARIANT"
            # If attributes match but similarity is between 0.88-0.95, still treat as exact/highly relevant
            return "EXACT_MATCH"
            
        if similarity >= SIMILAR_THRESHOLD:
            return "SIMILAR_PRODUCT"
            
        return "DIFFERENT_PRODUCT"

    def compare_images(self, target_url: str, candidate_url: str) -> Dict[str, Any]:
        """
        Uses GPT-4o-mini Vision to visually compare two product images.
        Returns visual_score (0-100) and reasoning.
        """
        client = self._get_client()
        if not client or not target_url or not candidate_url:
            return {"score": 0, "reason": "Missing inputs or client"}

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an Expert Product Authenticator. Compare Image A and Image B.
                        Assess if they are the EXACT SAME PRODUCT model (ignore lighting/angle).
                        
                        Return JSON:
                        {
                            "visual_score": 0-100 (100 = Identical, 80 = Same Model different Color, 10 = Distinctly Different),
                            "match_type": "IDENTICAL" | "COLOR_VARIANT" | "DIFFERENT_ITEM" | "UNCERTAIN",
                            "key_differences": "strap texture, dial markers, etc"
                        }
                        """
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Image A (Target):"},
                            {"type": "image_url", "image_url": {"url": target_url}},
                            {"type": "text", "text": "Image B (Candidate):"},
                            {"type": "image_url", "image_url": {"url": candidate_url}}
                        ]
                    }
                ],
                response_format={"type": "json_object"},
                max_tokens=150
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Visual Verification Failed: {e}")
            return {"score": 0, "reason": str(e)}
