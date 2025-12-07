from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.pricing_service import PricingService, MockScraperService
from app.database import engine, Base
from pydantic import BaseModel
from typing import List, Optional
import datetime

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="BharatPricing API", description="B2B Pricing Intelligence Dashboard")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"], # Allow dev ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
pricing_service = PricingService()
mock_scraper = MockScraperService()

# Pydantic Models for Requests
class ProductCreate(BaseModel):
    sku: str
    name: str
    category: Optional[str] = None
    cost_price: float
    selling_price: float
    image_url: Optional[str] = None

class CompetitorLink(BaseModel):
    product_id: int
    competitor_name: str # Amazon, Flipkart
    url: str

# Routes
@app.get("/")
def read_root():
    return {"message": "Welcome to BharatPricing API"}

@app.get("/dashboard/summary")
def get_dashboard_summary():
    """Get high level metrics for the dashboard"""
    return pricing_service.get_dashboard_metrics()

@app.get("/products")
def get_products():
    """Get all tracked products with their latest competitive analysis"""
    return pricing_service.get_all_products_with_analysis()

@app.post("/products")
def create_product(product: ProductCreate):
    return pricing_service.add_product(product)

@app.post("/competitors")
def add_competitor_link(link: CompetitorLink):
    return pricing_service.add_competitor_monitoring(link)

@app.post("/refresh-prices")
def refresh_prices():
    """Trigger a manual price refresh (mock scraper)"""
    return mock_scraper.refresh_all_prices()

from app.services.scraper_service import RealScraperService
from app.services.smart_search_service import SmartSearchService

real_scraper = RealScraperService()
smart_searcher = SmartSearchService()

# ...

@app.get("/discovery/search")
def search_products(q: str, location: Optional[str] = "Mumbai"):
    """
    Smart Search: Uses LLM to analyze query + SerpApi to fetch results
    """
    return smart_searcher.smart_search(q, location)

class TrackRequest(BaseModel):
    name: str
    price: float
    image: str
    competitors: List[dict] # List of {name, url, price}

@app.post("/discovery/track")
def track_product(request: TrackRequest):
    """Track a product found via discovery"""
    # Generate a random SKU for now
    sku = f"SKU-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    product_data = {
        "name": request.name,
        "sku": sku,
        "price": request.price,
        "image": request.image
    }
    
    return pricing_service.track_product_from_search(product_data, request.competitors)
