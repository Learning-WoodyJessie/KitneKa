# KitneKa - Implementation Guide

## Project Structure

```
BharatPricing/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application entry point
│   │   ├── database.py             # SQLAlchemy database setup
│   │   ├── models.py               # Database models
│   │   └── services/
│   │       ├── scraper_service.py  # SerpAPI integration
│   │       ├── smart_search_service.py  # AI-powered search logic
│   │       └── pricing_service.py  # Price tracking (future)
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Container configuration
│   └── .env.example                # Environment template
├── frontend/
│   ├── src/
│   │   ├── main.jsx                # React entry point
│   │   ├── App.jsx                 # Root component
│   │   ├── index.css               # Global styles (Tailwind)
│   │   └── components/
│   │       └── SearchInterface.jsx # Main UI component
│   ├── package.json                # Node dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # Tailwind configuration
│   └── .env.production             # Production env vars
├── DEPLOYMENT.md                   # Deployment instructions
├── DESIGN.md                       # System design document
└── README.md                       # Project overview
```

---

## Backend Implementation

### 1. Main Application ([main.py](file:///Users/pavanibayappu/StockAnalysis/BharatPricing/backend/app/main.py))

**Purpose**: FastAPI app initialization, CORS setup, and route definitions.

**Key Routes:**
```python
@app.get("/discovery/search")
def search_products(q: str, location: Optional[str] = "Mumbai"):
    """Smart search endpoint"""
    return smart_searcher.smart_search(q, location)
```

**CORS Configuration:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://kitneka.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### 2. Scraper Service ([scraper_service.py](file:///Users/pavanibayappu/StockAnalysis/BharatPricing/backend/app/services/scraper_service.py))

**Purpose**: Fetch product data from multiple sources using SerpAPI.

**Key Methods:**

#### `search_serpapi(query: str) -> List[Dict]`
Searches Google Shopping for online products.
```python
params = {
    "engine": "google_shopping",
    "q": query,
    "gl": "in",
    "hl": "en",
    "api_key": self.serpapi_key,
    "num": 100  # Fetch up to 100 results
}
```

#### `search_local_stores(query: str, location: str) -> List[Dict]`
Searches Google Maps for local stores.
```python
params = {
    "engine": "google_local",
    "q": query,
    "location": location,
    "google_domain": "google.co.in"
}
```

#### `search_instagram(query: str) -> List[Dict]`
Searches Instagram for product posts.
```python
params = {
    "engine": "instagram",
    "q": query,
    "api_key": self.serpapi_key
}
# Extract price from caption using regex
price_match = re.search(r'[₹Rs\.\s]*(\d+(?:,\d+)*)', caption)
```

---

### 3. Smart Search Service ([smart_search_service.py](file:///Users/pavanibayappu/StockAnalysis/BharatPricing/backend/app/services/smart_search_service.py))

**Purpose**: AI-powered search orchestration using OpenAI.

**Workflow:**

#### Step 1: Query Analysis
```python
def _analyze_query(self, query: str):
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{
            "role": "system",
            "content": "Analyze query. Return JSON with category, optimized_term, needs_local"
        }],
        response_format={"type": "json_object"}
    )
```

#### Step 2: Data Fetching
```python
online_results = self.scraper.search_serpapi(search_term)
local_results = self.scraper.search_local_stores(search_term, location)
instagram_results = self.scraper.search_instagram(search_term)
```

#### Step 3: Result Synthesis
```python
def _synthesize_results(self, query, online, local, instagram):
    # LLM generates best_value, authenticity_note, recommendation
```

---

## Frontend Implementation

### 1. Main Component ([SearchInterface.jsx](file:///Users/pavanibayappu/StockAnalysis/BharatPricing/frontend/src/components/SearchInterface.jsx))

**State Management:**
```javascript
const [query, setQuery] = useState('');
const [location, setLocation] = useState('');
const [searchData, setSearchData] = useState(null);
const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] = useState('online');
const [selectedStores, setSelectedStores] = useState([]);
```

**API Call:**
```javascript
const API_BASE = import.meta.env.VITE_API_URL || '';
const response = await axios.get(
    `${API_BASE}/discovery/search?q=${encodeURIComponent(query)}&location=${location}`
);
```

**Tab Navigation:**
- Online Retail: Grid with store filter sidebar
- Instagram: Instagram-themed cards with gradient UI
- Local Stores: Map-integrated store listings

---

### 2. UI Components

#### Search Form
- Text input for product query
- Dropdown for city selection (10 major Indian cities)
- Submit button with loading state

#### AI Insight Card
- Black background with white text
- Displays LLM-generated recommendation
- Shows best price and authenticity tips

#### Store Filter Sidebar (Online Tab)
- Checkbox list of unique stores
- Custom styled checkboxes
- Real-time filtering

#### Instagram Card Design
```javascript
<div className="bg-gradient-to-r from-purple-500 to-pink-500">
    <img src={post.image} />
    <div>@{post.username}</div>
    <div>₹{post.price}</div>
    <a href={post.post_url}>View on Instagram</a>
</div>
```

---

## Key Algorithms

### 1. Price Extraction (Instagram)
```python
import re

def extract_price(caption: str) -> float:
    # Match patterns: ₹2500, Rs.1000, Rs 500, 1,50,000/-
    pattern = r'[₹Rs\.\s]*(\d+(?:,\d+)*)'
    match = re.search(pattern, caption)
    if match:
        price_str = match.group(1).replace(',', '')
        return float(price_str)
    return 0
```

### 2. Local Store Sorting
```javascript
const getSortedLocalResults = () => {
    return [...searchData.results.local].sort((a, b) => {
        if (localSort === 'distance') {
            return parseFloat(a.distance) - parseFloat(b.distance);
        } else {
            return a.price - b.price;
        }
    });
};
```

---

## Deployment

### Backend (Render.com)
1. Connect GitHub repository
2. Set root directory: `BharatPricing/backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
5. Add environment variables (OPENAI_API_KEY, SERPAPI_API_KEY)

### Frontend (Vercel/Render)
1. Connect GitHub repository
2. Set root directory: `BharatPricing/frontend`
3. Build command: `npm install && npm run build`
4. Output directory: `dist`
5. Add VITE_API_URL environment variable

---

## Development Setup

### Backend
```bash
cd BharatPricing/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd BharatPricing/frontend
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API Docs: http://localhost:8000/docs

---

## Testing

### Manual Testing Checklist
- [ ] Search for "iPhone 15" → Online tab shows results
- [ ] Select city → Local tab shows stores
- [ ] Search for "Vintage Bag" → Instagram tab shows posts
- [ ] Filter by store → Results update
- [ ] Click "View on Instagram" → Opens Instagram
- [ ] Click "Get Directions" → Opens Google Maps

### API Testing (curl)
```bash
curl "http://localhost:8000/discovery/search?q=Nike%20Shoes&location=Mumbai"
```

---

## Troubleshooting

### Issue: "No module named 'playwright'"
**Solution**: Removed unused Playwright import from `scraper_service.py`

### Issue: "CORS error"
**Solution**: Added frontend URL to CORS allowed origins in `main.py`

### Issue: "API key exposed"
**Solution**: Moved keys to environment variables, `.gitignore` includes `.env`

---

## Performance Optimization

1. **SerpAPI Results Limit**: Set to 100 for comprehensive coverage
2. **LLM Token Limit**: Only send top 5 results to GPT for synthesis
3. **Caption Truncation**: Instagram captions limited to 150 characters
4. **Lazy Loading**: "Load More" button for online results

---

## Credits

**APIs Used:**
- OpenAI GPT-3.5-turbo
- SerpAPI (Google Shopping, Local, Instagram)

**UI Inspiration:**
- Minimalist black/white design
- Instagram gradient branding
- Indian pricing format (₹)
