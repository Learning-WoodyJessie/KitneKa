from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    cost_price = Column(Float)
    selling_price = Column(Float) # Your price
    image_url = Column(String, nullable=True)
    
    competitors = relationship("CompetitorProduct", back_populates="product")

class CompetitorProduct(Base):
    __tablename__ = "competitor_products"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    competitor_name = Column(String) # e.g. "Amazon.in", "Flipkart"
    url = Column(String)
    last_price = Column(Float, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product", back_populates="competitors")
    price_history = relationship("PriceHistory", back_populates="competitor_product")

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    competitor_product_id = Column(Integer, ForeignKey("competitor_products.id"))
    price = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    competitor_product = relationship("CompetitorProduct", back_populates="price_history")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    anonymous_id = Column(String, unique=True, index=True) # For tracking non-logged in users
    created_at = Column(DateTime, default=datetime.utcnow)
    
    searches = relationship("SearchQuery", back_populates="user")
    views = relationship("ProductView", back_populates="user")

class SearchQuery(Base):
    __tablename__ = "search_queries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    query_text = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="searches")

class ProductView(Base):
    __tablename__ = "product_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="views")
    product = relationship("Product", back_populates="views")

# Update Product to include views relationship
Product.views = relationship("ProductView", back_populates="product")
