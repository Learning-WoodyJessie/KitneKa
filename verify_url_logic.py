import sys
import os
import unittest
sys.path.append('backend')

from app.services.url_scraper_service import URLScraperService
from app.services.smart_search_service import SmartSearchService

# Mock classes to avoid full instantiation issues
os.environ["OPENAI_API_KEY"] = "sk-fake-key"
os.environ["SERPAPI_API_KEY"] = "fake-key"

class TestURLSearch(unittest.TestCase):
    def setUp(self):
        self.url_service = URLScraperService()
        self.smart_service = SmartSearchService()
        # Inject the real url_service into smart_service
        self.smart_service.url_service = self.url_service

    def test_normalization(self):
        url1 = "https://www.amazon.in/dp/B0F2THXY4T?ref=something&utm_source=xyz"
        url2 = "https://amazon.in/dp/B0F2THXY4T?fbclid=123"
        
        norm1 = self.url_service._normalize_url_for_match(url1)
        norm2 = self.url_service._normalize_url_for_match(url2)
        
        print(f"Norm1: {norm1}")
        print(f"Norm2: {norm2}")
        
        # Check host and path match
        self.assertEqual(norm1[0], norm2[0]) # amazon.in
        self.assertEqual(norm1[1], norm2[1]) # /dp/B0F2THXY4T
        
        # Check that 'ref', 'utm_source', 'fbclid' are stripped (query should be empty)
        self.assertEqual(norm1[2], "")
        self.assertEqual(norm2[2], "")

    def test_ranking_logic(self):
        query = "iPhone 15"
        # Mock results
        results = [
            {"title": "iPhone 15 Black", "url": "https://www.amazon.in/dp/B0XYZ", "id": "1"}, # ID Match
            {"title": "iPhone 15 Case", "url": "https://flipkart.com/iphone-15", "id": "2"}, # Text Match
        ]
        
        # Product ID Match Case
        product_id = {"value": "B0XYZ"}
        ranked = self.smart_service._rank_results(
            results, query, product_id=product_id
        )
        
        print("Ranked Results (ID Match):", ranked[0]['match_quality'], ranked[0]['match_score'])
        self.assertEqual(ranked[0]['match_quality'], 'id_exact')
        self.assertTrue(ranked[0]['match_score'] >= 1500)
        self.assertTrue(ranked[0]['pinned'])

    def test_urls_match_helper(self):
        # Exact Match
        u1 = "https://www.myntra.com/shirt/123"
        u2 = "https://myntra.com/shirt/123?utm_source=google"
        match = self.smart_service._urls_match(u1, u2)
        self.assertEqual(match, "exact")
        
        # Prefix Match
        u3 = "https://www.myntra.com/shirt/123"
        u4 = "https://www.myntra.com/shirt/123/buy"
        match = self.smart_service._urls_match(u3, u4)
        self.assertEqual(match, "path_prefix")
        
        # Mismatch
        u5 = "https://www.myntra.com/shirt/123"
        u6 = "https://www.myntra.com/jeans/456"
        match = self.smart_service._urls_match(u5, u6)
        self.assertEqual(match, None)

if __name__ == '__main__':
    unittest.main()
