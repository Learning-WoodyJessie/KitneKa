from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import User, SearchQuery, ProductView, Product, PriceHistory
from datetime import datetime, timedelta

class GraphService:
    def get_or_create_user(self, db: Session, anonymous_id: str):
        user = db.query(User).filter(User.anonymous_id == anonymous_id).first()
        if not user:
            user = User(anonymous_id=anonymous_id)
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    def record_search(self, db: Session, query: str, anonymous_id: str = None):
        user_id = None
        if anonymous_id:
            user = self.get_or_create_user(db, anonymous_id)
            user_id = user.id
            
        search = SearchQuery(user_id=user_id, query_text=query)
        db.add(search)
        db.commit()
        return search

    def get_popular_searches(self, db: Session, limit: int = 5):
        # Fetch more candidates to allow for filtering
        candidates = db.query(
            SearchQuery.query_text, 
            func.count(SearchQuery.query_text).label('count')
        ).group_by(SearchQuery.query_text).order_by(desc('count')).limit(limit * 4).all()
        
        results = []
        for r in candidates:
            term = r[0]
            # Filter out URLs and long strings
            if term and len(term) <= 40 and not term.lower().startswith(('http://', 'https://', 'www.')):
                results.append({"term": term, "count": r[1]})
                
            if len(results) >= limit:
                break
                
        return results

    def record_view(self, db: Session, product_id: int, anonymous_id: str = None):
        user_id = None
        if anonymous_id:
            user = self.get_or_create_user(db, anonymous_id)
            user_id = user.id
            
        view = ProductView(user_id=user_id, product_id=product_id)
        db.add(view)
        db.commit()
        return view

    def get_price_history(self, db: Session, product_id: int, days: int = 30):
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # This assumes Product is linked to CompetitorProduct which links to PriceHistory.
        # We need to fetch history for all competitors of this product.
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return None
            
        history_data = []
        for comp in product.competitors:
            histories = db.query(PriceHistory).filter(
                PriceHistory.competitor_product_id == comp.id,
                PriceHistory.timestamp >= cutoff_date
            ).order_by(PriceHistory.timestamp).all()
            
            history_data.append({
                "competitor": comp.competitor_name,
                "url": comp.url,
                "data": [{"price": h.price, "date": h.timestamp.isoformat()} for h in histories]
            })
            
        return history_data
