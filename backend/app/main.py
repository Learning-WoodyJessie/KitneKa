from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()
import os
print(f"DEBUG: STARTUP ENV CHECK")
print(f"DEBUG: OPENAI_API_KEY Present: {bool(os.environ.get('OPENAI_API_KEY'))}")
print(f"DEBUG: SERPAPI_API_KEY Present: {bool(os.environ.get('SERPAPI_API_KEY'))}")
print(f"DEBUG: PYTHON_VERSION: {os.environ.get('PYTHON_VERSION', 'Unknown')}")

from app.services.pricing_service import PricingService, MockScraperService
from app.services.seasonality_service import SeasonalityService
from app.services.scraper_service import RealScraperService
from app.services.smart_search_service import SmartSearchService
from app.services.image_analyzer_service import ImageAnalyzerService
from app.services.url_scraper_service import URLScraperService
from app.services.graph_service import GraphService
from app.database import engine, Base, get_db
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import datetime
import base64

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
seasonality_service = SeasonalityService()

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

@app.get("/products/{product_id}")
def get_product(product_id: int):
    product = pricing_service.get_product_by_id(product_id)
    if not product:
        return {"error": "Product not found"}
    return product

@app.get("/products/{product_id}/history")
def get_price_history(product_id: int, days: int = 30, db: Session = Depends(get_db)):
    """
    Get price history for a specific product (default last 30 days)
    """
    history = graph_service.get_price_history(db, product_id, days)
    if not history:
        return {"error": "Product not found"}
    return history

@app.get("/seasonality/tips")
def get_seasonality_tips():
    """
    Get buying tips based on current date
    """
    return seasonality_service.get_seasonal_tips()

@app.post("/refresh-prices")
def refresh_prices():
    """Trigger a manual price refresh (mock scraper)"""
    return mock_scraper.refresh_all_prices()

real_scraper = RealScraperService()
smart_searcher = SmartSearchService()
image_analyzer = ImageAnalyzerService()
url_scraper = URLScraperService()
graph_service = GraphService()

# ...

@app.get("/discovery/search")
def search_products(q: str, location: Optional[str] = "Mumbai", anonymous_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Smart Search: Uses LLM to analyze query + SerpApi to fetch results
    """
    search_term = q.strip()
    
    # If query is a URL, extract product name first
    if search_term.startswith(('http://', 'https://')):
        try:
            extraction = url_scraper.extract_product_from_url(search_term)
            if extraction.get("search_query"):
                search_term = extraction["search_query"]
        except Exception as e:
            print(f"URL extraction failed in search: {e}")

    # Record search in graph (using clean term)
    if search_term:
        try:
            graph_service.record_search(db, search_term, anonymous_id)
        except Exception as e:
            print(f"Failed to record search: {e}")

    return smart_searcher.smart_search(search_term, location)

@app.get("/graph/popular")
def get_popular_searches(limit: int = 5, db: Session = Depends(get_db)):
    """Get most popular search terms"""
    return graph_service.get_popular_searches(db, limit)

@app.get("/graph/history/user")
def get_user_history(anonymous_id: str, db: Session = Depends(get_db)):
    """Get search history for a user"""
    user = graph_service.get_or_create_user(db, anonymous_id)
    return user.searches


@app.post("/discovery/search-by-image")
async def search_by_image(file: UploadFile = File(...), location: Optional[str] = "Mumbai", anonymous_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Search by uploading a product image. Uses GPT-4 Vision to analyze the image
    and extract product details, then performs a smart search.
    """
    try:
        # Read and encode image
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        # Analyze image
        analysis = image_analyzer.analyze_product_image(image_base64)
        
        if "error" in analysis or not analysis.get("search_query"):
            return {"error": analysis.get("error", "Could not analyze image"), "analysis": analysis}
        
        # Record extracted query
        try:
            graph_service.record_search(db, analysis["search_query"], anonymous_id)
        except Exception as e:
            print(f"Failed to record image search: {e}")

        # Perform search with extracted query
        search_results = smart_searcher.smart_search(analysis["search_query"], location)
        
        # Include image analysis in response
        search_results["image_analysis"] = analysis
        
        return search_results
        
    except Exception as e:
        return {"error": f"Image upload failed: {str(e)}"}


@app.post("/discovery/search-by-url")
def search_by_url(url: str, location: Optional[str] = "Mumbai", anonymous_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Search by pasting a product URL. Scrapes the page to extract product details,
    then performs a smart search for Indian alternatives.
    """
    try:
        # Extract product info from URL
        extraction = url_scraper.extract_product_from_url(url)
        
        if "error" in extraction or not extraction.get("search_query"):
            return {"error": extraction.get("error", "Could not extract product from URL"), "extraction": extraction}
        
        # Record extracted query
        try:
            graph_service.record_search(db, extraction["search_query"], anonymous_id)
        except Exception as e:
            print(f"Failed to record url search: {e}")

        # Perform search with extracted query
        search_results = smart_searcher.smart_search(extraction["search_query"], location)
        
        # Include URL extraction in response
        search_results["url_extraction"] = extraction
        
        return search_results
        
    except Exception as e:
        return {"error": f"URL search failed: {str(e)}"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "BharatPricing API"}

@app.get("/test")
def test():
    return {
        "message": "BharatPricing API is running!",
        "env_check": {
            "openai_api_key_detected": bool(os.environ.get("OPENAI_API_KEY")),
            "serpapi_api_key_detected": bool(os.environ.get("SERPAPI_API_KEY")),
            "python_version": os.environ.get("PYTHON_VERSION", "Unknown")
        },
        "endpoints": [
            "/products - View all tracked products",
            "/products (POST) - Add a new product",
            "/competitors (POST) - Add competitor link",
            "/refresh-prices (POST) - Manually refresh prices",
            "/discovery/search?q=iphone - Smart product search",
            "/discovery/search-by-image (POST) - Search by uploading image",
            "/discovery/search-by-url (POST) - Search by pasting product URL"
        ]
    }

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
