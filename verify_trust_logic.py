
import sys
import os
sys.path.append('backend')
import unittest
from app.services.trust_service import TrustService

class TestTrustLogic(unittest.TestCase):
    def setUp(self):
        self.service = TrustService()

    def test_official_tagging(self):
        # Nike Official
        item = {"title": "Nike Air Max", "merchant_url": "https://www.nike.com/in/t/air-max-90-shoes-kRsBnD"}
        enriched = self.service.enrich_result(item)
        self.assertTrue(enriched.get("is_official"), "Nike Official should be tagged")

        # MAC Official
        item2 = {"title": "MAC Lipstick", "merchant_url": "https://www.maccosmetics.in/product/shade"}
        enriched2 = self.service.enrich_result(item2)
        self.assertTrue(enriched2.get("is_official"), "MAC Official should be tagged")

    def test_popular_tagging(self):
        # Myntra
        item = {"title": "Roadster Shirt", "merchant_url": "https://www.myntra.com/shirt/roadster/123"}
        enriched = self.service.enrich_result(item)
        self.assertTrue(enriched.get("is_popular"), "Myntra should be popular")
        self.assertEqual(enriched.get("store_tier"), "popular_marketplace")

    def test_clean_beauty(self):
        # Old School Rituals
        item = {"title": "Old School Rituals Face Oil", "merchant_url": "https://oldschoolrituals.in/products/oil"}
        enriched = self.service.enrich_result(item)
        self.assertTrue(enriched.get("is_clean_beauty"), "Old School Rituals should be Clean Beauty")
        self.assertTrue(enriched.get("is_official"), "Old School Rituals domain should be official")

    def test_exclusion_logic(self):
        # Netmeds Tester (User Example)
        item = {
            "title": "MAC Strobe Cream Pinklite Tester",
            "merchant_url": "https://www.netmeds.com/product/tstr-tester-mac-strobe-cream-pinklite-50-ml-magke2-10493427"
        }
        enriched = self.service.enrich_result(item)
        self.assertTrue(enriched.get("is_excluded"), "Tester URL should be excluded")
        self.assertEqual(enriched.get("exclusion_reason"), "tester_or_sample")

if __name__ == '__main__':
    unittest.main()
