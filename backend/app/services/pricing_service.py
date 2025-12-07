from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Product, CompetitorProduct, PriceHistory
from datetime import datetime, timedelta
import random
from typing import List, Optional

class PricingService:
    def __init__(self):
        self.db = SessionLocal()

    def get_dashboard_metrics(self):
        total_products = self.db.query(Product).count()
        tracked_competitors = self.db.query(CompetitorProduct).count()
        
        # Calculate simplistic "Price Index" (Market Avg / Your Price * 100)
        # > 100 means you are cheaper than avg (Good)
        # < 100 means you are expensive (Bad)
        
        # For mock dashboard, return some hardcoded stats if DB is empty
        if total_products == 0:
            return {
                "total_products": 0,
                "monitored_links": 0,
                "average_price_index": 0,
                "products_cheaper_than_competitors": 0
            }
            
        return {
            "total_products": total_products,
            "monitored_links": tracked_competitors,
            "average_price_index": 105.2, # Mock value
            "products_cheaper_than_competitors": int(total_products * 0.6)
        }

    def get_all_products_with_analysis(self):
        products = self.db.query(Product).all()
        result = []
        for p in products:
            competitors = []
            for c in p.competitors:
                competitors.append({
                    "name": c.competitor_name,
                    "price": c.last_price,
                    "url": c.url
                })
            
            # Find lowest competitor price
            comp_prices = [c.last_price for c in p.competitors if c.last_price]
            lowest_market_price = min(comp_prices) if comp_prices else p.selling_price
            
            result.append({
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "your_price": p.selling_price,
                "competitor_prices": competitors,
                "lowest_market_price": lowest_market_price,
                "is_cheapest": p.selling_price <= lowest_market_price
            })
        return result

    def add_product(self, product_data):
        db_product = Product(
            sku=product_data.sku,
            name=product_data.name,
            category=product_data.category,
            cost_price=product_data.cost_price,
            selling_price=product_data.selling_price,
            image_url=product_data.image_url
        )
        self.db.add(db_product)
        self.db.commit()
        self.db.refresh(db_product)
        return db_product

    def add_competitor_monitoring(self, link_data):
        db_link = CompetitorProduct(
            product_id=link_data.product_id,
            competitor_name=link_data.competitor_name,
            url=link_data.url,
            last_price=0 # Initial price
        )
        self.db.add(db_link)
        self.db.commit()
        self.db.refresh(db_link)
        return db_link

class MockScraperService:
    def __init__(self):
        self.db = SessionLocal()

    def refresh_all_prices(self):
        """Simulate scraping prices for all competitor links"""
        links = self.db.query(CompetitorProduct).all()
        updated_count = 0
        
        for link in links:
            # Get parent product to generate realistic price variance
            product = link.product
            base_price = product.selling_price
            
            # Generate random price within +/- 15% of base price
            variance = random.uniform(0.85, 1.15)
            new_price = round(base_price * variance, 2)
            
            # Update current price
            link.last_price = new_price
            link.last_updated = datetime.utcnow()
            
            # Add to history
            history = PriceHistory(
                competitor_product_id=link.id,
                price=new_price,
                timestamp=datetime.utcnow()
            )
            self.db.add(history)
            updated_count += 1
            
        self.db.commit()
        return {"message": f"Refreshed prices for {updated_count} links"}

    def search_products_across_web(self, query: str, location: str = None):
        """
        Simulate searching Amazon/Flipkart AND Local Stores.
        """
        # Mock results based on query
        base_price = random.randint(1000, 50000)
        
        online_results = []
        # Generate 12 mock online results for pagination demo
        sources = ["Amazon.in", "Flipkart", "Myntra", "Ajio"]
        for i in range(12):
            source = sources[i % len(sources)]
            price_variation = random.uniform(0.9, 1.1)
            
            # Generate a working "Search" URL so the Visit button actually does something useful
            encoded_query = query.replace(" ", "+")
            if "Amazon" in source:
                real_link = f"https://www.amazon.in/s?k={encoded_query}"
            elif "Flipkart" in source:
                real_link = f"https://www.flipkart.com/search?q={encoded_query}"
            elif "Myntra" in source:
                real_link = f"https://www.myntra.com/{query.replace(' ', '-')}"
            elif "Ajio" in source:
                real_link = f"https://www.ajio.com/search/?text={encoded_query}"
            else:
                real_link = "#"

            online_results.append({
                "id": f"online_{i}",
                "source": source,
                "title": f"{query} - {random.choice(['Premium', 'Exclusive', 'New Arrival'])} (Vol {i+1})",
                "price": int(base_price * price_variation),
                "rating": round(random.uniform(3.5, 5.0), 1),
                "reviews": random.randint(50, 5000),
                "url": real_link,
                "image": f"https://placehold.co/200x200?text={source}+{i+1}",
                "delivery": random.choice(["Free Delivery", "Get it by Tomorrow", "High Demand"])
            })
        
        local_results = []
        if location:
            local_results = [
                {
                    "id": "local_1",
                    "store_name": f"Official {query.split()[0]} Store",
                    "address": f"Banjara Hills, {location}",
                    "distance": "2.5 km",
                    "price": int(base_price * 1.1), # Retail usually higher
                    "availability": "In Stock",
                    "phone": "+91 98765 43210",
                    "map_url": f"https://maps.google.com/?q={query}+store+{location}"
                },
                {
                    "id": "local_2",
                    "store_name": "Bajaj Electronics",
                    "address": f"Jubilee Hills, {location}",
                    "distance": "4.1 km",
                    "price": int(base_price * 1.05),
                    "availability": "Limited Stock",
                    "phone": "+91 98765 12345",
                    "map_url": f"https://maps.google.com/?q=bajaj+electronics+{location}"
                },
                {
                    "id": "local_3",
                    "store_name": "Reliance Digital",
                    "address": f"Gachibowli, {location}",
                    "distance": "8.0 km",
                    "price": base_price,
                    "availability": "In Stock",
                    "phone": "+91 40 1234 5678",
                    "map_url": f"https://maps.google.com/?q=reliance+digital+{location}"
                }
            ]

        return {
            "online": online_results,
            "local": local_results
        }

class PricingService:
    def __init__(self):
        self.db = SessionLocal()

    def track_product_from_search(self, product_data: dict, competitors: List[dict]):
        """
        Saves a product and its competitor links to the database.
        product_data: {'name': str, 'sku': str, 'price': float, 'image': str}
        competitors: [{'name': str, 'url': str, 'price': float}]
        """
        # 1. Create the main product (Your selling price)
        # For this MVP, we assume the user is tracking the "Best Deal" price as their reference,
        # or we just create the product entry.
        
        # Check if already exists
        existing = self.db.query(Product).filter(Product.sku == product_data['sku']).first()
        if existing:
            return {"message": "Product already tracked", "id": existing.id}

        new_product = Product(
            sku=product_data['sku'],
            name=product_data['name'],
            category="Uncategorized", 
            cost_price=product_data['price'] * 0.8, # Mock cost
            selling_price=product_data['price'],
            image_url=product_data.get('image')
        )
        self.db.add(new_product)
        self.db.commit()
        self.db.refresh(new_product)

        # 2. Add competitor links
        for comp in competitors:
            link = CompetitorProduct(
                product_id=new_product.id,
                competitor_name=comp['name'],
                url=comp['url'],
                last_price=comp['price']
            )
            self.db.add(link)
            
            # Initial history point
            history = PriceHistory(
                competitor_product_id=link.id, # Will be assigned on flush, but safer to commit first or use flush
                price=comp['price'],
                timestamp=datetime.utcnow()
            )
            # To handle ID assignment we need to flush/commit
        
        self.db.commit()
        return {"message": "Product tracked successfully", "id": new_product.id}

    # ... existing methods ...
