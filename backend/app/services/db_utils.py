from sqlalchemy.orm import Session
from app.models import Product, CompetitorProduct, PriceHistory
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def save_product_snapshot(db: Session, product_data: dict, source: str = "SerpApi"):
    """
    Saves or updates a product and its price history from search results.
    
    Args:
        db: Database session
        product_data: Dictionary containing 'title', 'price', 'url', 'image', 'source' (optional)
        source: Source of the data (default: SerpApi)
    """
    try:
        title = product_data.get("title")
        price = product_data.get("price")
        url = product_data.get("url")
        image = product_data.get("image") or product_data.get("thumbnail")
        product_source = product_data.get("source", source)

        if not title or not price:
            return

        # Ensure price is a float
        try:
            if isinstance(price, str):
                price = float(price.replace('₹', '').replace(',', '').strip())
        except ValueError:
            return # Skip if price is effectively invalid

        # 1. Find or Create Product (by exact Name for now, could use better matching later)
        # Check if we have this product tracked by SKU or similar name
        # For Smart Search "Passive" tracking, we might flood the DB if we are not careful.
        # Strategy: Search by Name. If found, use it. If not, create new.
        
        # Simple exact match for MVP to avoid complexity
        product = db.query(Product).filter(Product.name == title).first()
        
        if not product:
            # Generate a pseudo-SKU if one doesn't exist
            sku_suffix = datetime.now().strftime("%Y%m%d%H%M%S")
            # To avoid duplicates in same second, append truncated hash of title
            sku_hash = str(abs(hash(title)))[:4]
            sku = f"AUTO-{sku_suffix}-{sku_hash}"
            
            product = Product(
                name=title,
                sku=sku,
                category="Uncategorized", # We could use the search query category
                cost_price=0,
                selling_price=0, # This is our "internal" price, which is 0 for tracked items
                image_url=image
            )
            db.add(product)
            db.commit()
            db.refresh(product)

        # 2. Find or Create CompetitorProduct (The link to external store)
        competitor = db.query(CompetitorProduct).filter(
            CompetitorProduct.product_id == product.id,
            CompetitorProduct.url == url
        ).first()

        if not competitor:
            competitor = CompetitorProduct(
                product_id=product.id,
                competitor_name=product_source,
                url=url,
                last_price=price,
                last_updated=datetime.utcnow()
            )
            db.add(competitor)
            db.commit()
            db.refresh(competitor)
        else:
            # Update last known price
            competitor.last_price = price
            competitor.last_updated = datetime.utcnow()
            db.commit()

        # 3. Add Price History Record
        # Only add if price changed or it's been > 24 hours? 
        # For now, let's just record every distinct check to build data points. 
        # But to prevent spam, check if the latest history entry is same price and very recent.
        
        latest_history = db.query(PriceHistory).filter(
            PriceHistory.competitor_product_id == competitor.id
        ).order_by(PriceHistory.timestamp.desc()).first()

        should_add = True
        if latest_history:
            # If price is same and < 1 hour ago, skip
            time_diff = (datetime.utcnow() - latest_history.timestamp).total_seconds()
            if latest_history.price == price and time_diff < 3600:
                should_add = False

        if should_add:
            history = PriceHistory(
                competitor_product_id=competitor.id,
                price=price,
                timestamp=datetime.utcnow()
            )
            db.add(history)
            db.commit()

    except Exception as e:
        logger.error(f"Failed to save product snapshot: {e}")
        db.rollback()
