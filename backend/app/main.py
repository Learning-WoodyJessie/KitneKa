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
from app.services.url_scraper_service import URLScraperService
from app.services.graph_service import GraphService
from app.services.curated_feed_service import CuratedFeedService
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
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "https://kitneka-7o3d.onrender.com",
        "https://kitneka.onrender.com",
        "*"
    ], # Allow dev ports & production
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
    Get price history with 'Buy/Wait' recommendation.
    """
    history = graph_service.get_price_history(db, product_id, days)
    if not history:
        # Check if product exists at all
        product = pricing_service.get_product_by_id(product_id)
        if not product:
            return {"error": "Product not found"}
        return {"history": [], "recommendation": "Neutral", "reason": "No history data available yet."}
    
    # Calculate Analytics from ALL competitors combined (simplified for MVP)
    all_prices = []
    current_price = 0
    latest_date = None
    
    for comp in history:
        for point in comp['data']:
            all_prices.append(point['price'])
            # Track latest price
            p_date = datetime.datetime.fromisoformat(point['date'])
            if latest_date is None or p_date > latest_date:
                latest_date = p_date
                current_price = point['price']

    if not all_prices:
        return {"history": history, "recommendation": "Neutral", "reason": "Insufficient data."}

    avg_price = sum(all_prices) / len(all_prices)
    min_price = min(all_prices)
    
    recommendation = "Neutral"
    reason = "Price is stable."
    
    if current_price <= min_price:
        recommendation = "Great Buy"
        reason = "Lowest price in last 30 days!"
    elif current_price < avg_price * 0.95:
        recommendation = "Buy Now"
        reason = f"Price is {int((1 - current_price/avg_price)*100)}% below average."
    elif current_price > avg_price * 1.05:
        recommendation = "Wait"
        reason = f"Price is {int((current_price/avg_price - 1)*100)}% above average."

    return {
        "history": history,
        "recommendation": recommendation,
        "reason": reason,
        "stats": {
            "current_price": current_price,
            "average_price": round(avg_price, 2),
            "lowest_price": min_price
        }
    }

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
url_scraper = URLScraperService()
graph_service = GraphService()
feed_service = CuratedFeedService()

# ...

@app.get("/discovery/search")
def search_products(
    q: Optional[str] = None, 
    brand: Optional[str] = None,
    location: Optional[str] = "Mumbai", 
    anonymous_id: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    """
    Smart Search: Uses LLM to analyze query + SerpApi to fetch results
    """
    # Robustness: Allow brand to substitute for q
    if not q and brand:
        q = brand
        
    if not q:
        return {"error": "Query parameter 'q' or 'brand' is required."}

    search_term = q.strip()
    
    # Pass raw query to smart_searcher which handles URL extraction internally
    # This ensures we keep the original URL context for ranking
    search_term = q.strip()

    # Record search in graph (using clean term)
    if search_term:
        try:
            graph_service.record_search(db, search_term, anonymous_id)
        except Exception as e:
            print(f"Failed to record search: {e}")

    return smart_searcher.smart_search(search_term, location, db=db)

@app.get("/graph/popular")
def get_popular_searches(limit: int = 5, db: Session = Depends(get_db)):
    """Get most popular search terms"""
    return graph_service.get_popular_searches(db, limit)

@app.get("/graph/history/user")
def get_user_history(anonymous_id: str, db: Session = Depends(get_db)):
    """Get search history for a user"""
    user = graph_service.get_or_create_user(db, anonymous_id)
    return user.searches


@app.get("/discovery/landing")
def get_landing_feed():
    """
    Get the curated 10-item default feed for the homepage.
    """
    return {"feed": feed_service.get_landing_feed()}


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
        search_results = smart_searcher.smart_search(analysis["search_query"], location, db=db)
        
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
        search_results = smart_searcher.smart_search(extraction["search_query"], location, db=db)
        
        # Include URL extraction in response
        search_results["url_extraction"] = extraction
        
        return search_results
        
    except Exception as e:
        return {"error": f"URL search failed: {str(e)}"}


@app.get("/discovery/resolve-link")
def resolve_link(url: str):
    """
    Resolve a Google Shopping Viewer link (ibp=oshop) to the actual retailer URL.
    Scrapes the viewer page for the 'Visit site' link.
    """
    try:
        resolved_url = real_scraper.resolve_viewer_link(url)
        return {"url": resolved_url}
    except Exception as e:
        print(f"Error resolving link: {e}")
        return {"url": url} # Fallback to original

@app.get("/product/compare")
def compare_prices(title: str, location: str = "Mumbai", image_url: str = None):
    """
    Given a product title, search across all marketplaces
    and return prices sorted lowest-first for price comparison.
    Uses the existing smart_search service with multi-marketplace queries.
    """
    try:
        # Use smart search which already queries multiple marketplaces
        results = smart_searcher.smart_search(title, location=location, image_url=image_url)
        online_results = results.get("results", {}).get("online", [])
        
        # Sort by price (lowest first) for comparison view
        sorted_results = sorted(
            [r for r in online_results if r.get("price", 0) > 0],
            key=lambda x: x.get("price", float("inf"))
        )
        
        # Group by source for easy comparison
        sources_seen = set()
        unique_by_source = []
        for r in sorted_results:
            source = r.get("source", "Unknown")
            if source not in sources_seen:
                sources_seen.add(source)
                unique_by_source.append({
                    "source": source,
                    "title": r.get("title"),
                    "price": r.get("price"),
                    "old_price": r.get("extracted_old_price") or r.get("old_price"),
                    "discount": r.get("discount_pct"),
                    # Direct product URL: prefer `link` (SerpAPI direct), fall back to `url`
                    "url": r.get("link") or r.get("url"),
                    "image": r.get("image") or r.get("thumbnail"),
                    "rating": r.get("rating"),
                    "reviews": r.get("reviews"),
                    # Match quality fields from LLM pipeline
                    "match_classification": r.get("match_classification", "SIMILAR"),
                    "match_score": r.get("match_score", 0),
                    "llm_reason": r.get("llm_reason", ""),
                    "image_match_score": r.get("image_match_score"),
                })

        
        return {
            "query": title,
            "total_results": len(online_results),
            "unique_stores": len(unique_by_source),
            "prices": unique_by_source,
            "lowest_price": unique_by_source[0] if unique_by_source else None,
            "highest_price": unique_by_source[-1] if unique_by_source else None
        }
    except Exception as e:
        print(f"Error comparing prices: {e}")
        return {"error": str(e), "prices": []}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "BharatPricing API"}

@app.get("/cache/stats")
def cache_stats():
    """Get cache statistics."""
    from app.services.cache_service import get_cache
    return get_cache().stats()

@app.post("/cache/clear")
def cache_clear():
    """Clear all cached data. Use when you want to force refresh."""
    from app.services.cache_service import clear_all_cache
    count = clear_all_cache()
    return {"message": f"Cache cleared", "items_removed": count}

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
