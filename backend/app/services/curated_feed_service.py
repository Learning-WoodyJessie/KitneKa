import json
import os
import time
import random
import logging
from datetime import datetime, timedelta
from app.services.scraper_service import RealScraperService

logger = logging.getLogger(__name__)

CACHE_FILE = "landing_feed_cache.json"
CACHE_DURATION_HOURS = 24

class CuratedFeedService:
    def __init__(self):
        self.scraper = RealScraperService()
        self.verticals = {
            "Cosmetics": {
                "queries": ["best lipstick rating 4+", "kajal eyeliner rating 4+", "face wash rating 4+"],
                "weights": {"rating": 0.50, "reviews": 0.30, "price": 0.15},
                "slots": 3
            },
            "Handbags": {
                "queries": ["women sling bag", "women tote bag"],
                "weights": {"rating": 0.40, "reviews": 0.35, "price": 0.20},
                "slots": 2
            },
            "Jewelry": {
                "queries": ["earrings set", "fashion necklace set"],
                "weights": {"rating": 0.35, "reviews": 0.45, "price": 0.15},
                "slots": 2
            },
            "Watches": {
                "queries": ["women analog watch", "women smart watch"],
                "weights": {"rating": 0.40, "reviews": 0.40, "price": 0.15},
                "slots": 2
            }
        }

    def get_landing_feed(self):
        """
        Returns the curated 10-item feed.
        Checks cache first. If stale/missing, regenerates.
        """
        # 1. Check Cache
        cached_data = self._load_cache()
        if cached_data:
            logger.info("Serving Landing Feed from Cache")
            return cached_data

        # 2. Regenerate
        logger.info("Regenerating Landing Feed...")
        feed = self._generate_feed()
        
        # 3. Save Cache
        self._save_cache(feed)
        return feed

    def _generate_feed(self):
        all_candidates = []
        final_feed = []
        
        # A. Fetch & Rank per Vertical
        vertical_results = {}
        
        for v_name, v_config in self.verticals.items():
            candidates = []
            for q in v_config["queries"]:
                # Fetch only, no analysis to save time
                resp = self.scraper.search_products(q)
                items = resp.get("online", [])
                candidates.extend(items)
            
            # Remove duplicates based on URL or Title
            unique_candidates = {c['title']: c for c in candidates if c.get('title')}.values()
            
            # Rank
            ranked = self._rank_items(list(unique_candidates), v_config["weights"], v_name)
            vertical_results[v_name] = ranked

        # B. Slotting (3-2-2-2)
        # We keep track of used IDs/Titles to avoid dupes across categories if any
        used_titles = set()

        for v_name, v_config in self.verticals.items():
            count = 0
            for item in vertical_results.get(v_name, []):
                if count >= v_config["slots"]:
                    break
                if item['title'] not in used_titles:
                    item['badges'] = self._determine_badges(item, v_name)
                    item['display_category'] = v_name
                    final_feed.append(item)
                    used_titles.add(item['title'])
                    all_candidates.append(item) # Add to pool for wildcard checking
                    count += 1
        
        # C. Wildcard (Best Value from remaining)
        # Collect all remaining items from all verticals
        remaining_pool = []
        for v_name, items in vertical_results.items():
            for item in items:
                if item['title'] not in used_titles:
                    item['display_category'] = v_name
                    remaining_pool.append(item)
        
        if remaining_pool:
            # Sort by absolute score
            remaining_pool.sort(key=lambda x: x.get('score', 0), reverse=True)
            best_val = remaining_pool[0]
            best_val['badges'] = ["Best Value Pick"]
            final_feed.append(best_val)
        
        return final_feed

    def _rank_items(self, items, weights, vertical):
        # 1. Normalize Price/Reviews for this batch
        if not items:
            return []
            
        prices = [self._parse_price(i.get('price')) for i in items]
        prices = [p for p in prices if p > 0]
        if not prices:
            return items 
            
        median_price = sorted(prices)[len(prices)//2]
        
        # Max reviews for normalization
        reviews_counts = [self._parse_reviews(i.get('reviews', 0)) for i in items]
        max_reviews = max(reviews_counts) if reviews_counts else 1

        scored_items = []
        for item in items:
            # Extract Raw Metrics
            rating = float(item.get('rating', 0)) if item.get('rating') else 0
            reviews = self._parse_reviews(item.get('reviews', 0))
            price = self._parse_price(item.get('price'))
            
            # Penalties
            if rating == 0: rating = 3.0 # Penalty defaults (mild)
            if reviews == 0: reviews = 0
            
            # Normalize
            norm_rating = rating / 5.0
            norm_reviews = min(reviews / 1000, 1.0) # Cap at 1000 reviews for max score confidence? 
            # Actually user said: "Reviews heavily weighted"
            # Let's use log scale or simple ratio against max in batch
            norm_reviews = reviews / max_reviews if max_reviews > 0 else 0
            
            # Price Fairness: 1 - |price - median| / median
            if price > 0:
                diff = abs(price - median_price)
                fairness = max(0, 1 - (diff / median_price))
            else:
                fairness = 0
            
            # Score
            score = (norm_rating * weights['rating']) + \
                    (norm_reviews * weights['reviews']) + \
                    (fairness * weights['weights'].get('price', 0.2) if 'weights' in weights else fairness * weights['price']) + \
                    (0.05) # Availability bonus (assumed available if scraped)
            
            item['score'] = score
            item['debug_score'] = f"R:{rating} Rev:{reviews} P:{price} -> {score:.2f}"
            scored_items.append(item)
            
        # Sort desc
        scored_items.sort(key=lambda x: x['score'], reverse=True)
        return scored_items

    def _determine_badges(self, item, category):
        badges = []
        # Top Rated if Rating > 4.5
        rating = float(item.get('rating', 0)) if item.get('rating') else 0
        if rating >= 4.5:
            badges.append("⭐ Top Rated")
        elif item.get('score', 0) > 0.8:
             badges.append("Popular Choice")
        return badges

    def _parse_price(self, price_str):
        if not price_str: return 0
        if isinstance(price_str, (int, float)): return price_str
        try:
            # Remove currency symbol, commas
            clean = str(price_str).replace('₹', '').replace(',', '').strip()
            return float(clean)
        except:
            return 0
            
    def _parse_reviews(self, rev_str):
        if not rev_str: return 0
        if isinstance(rev_str, (int, float)): return rev_str
        try:
            # "1,200 reviews" or "(1.2k)"
            clean = str(rev_str).lower().replace('reviews', '').replace('ratings', '').replace(',','').replace('(','').replace(')','').strip()
            if 'k' in clean:
                return float(clean.replace('k', '')) * 1000
            return float(clean)
        except:
            return 0

    def _load_cache(self):
        if not os.path.exists(CACHE_FILE):
            return None
        try:
            with open(CACHE_FILE, 'r') as f:
                data = json.load(f)
            
            # Check expiry
            ts = data.get('timestamp', 0)
            if time.time() - ts > CACHE_DURATION_HOURS * 3600:
                return None
                
            return data.get('feed')
        except:
            return None

    def _save_cache(self, feed):
        try:
            with open(CACHE_FILE, 'w') as f:
                json.dump({
                    'timestamp': time.time(),
                    'feed': feed
                }, f)
        except Exception as e:
            logger.error(f"Failed to save feed cache: {e}")
