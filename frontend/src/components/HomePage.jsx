import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, ArrowRight, Check, Plus, ChevronDown, Camera, X, Image, UploadCloud, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SeasonalityWidget from '../components/SeasonalityWidget';

const HomePage = () => {
    // --- SEARCH STATE ---
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [searchData, setSearchData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(null);
    const [visibleCount, setVisibleCount] = useState(6);
    const [activeTab, setActiveTab] = useState('online');
    const [localSort, setLocalSort] = useState('distance');
    const [selectedStores, setSelectedStores] = useState([]);
    const [trackingId, setTrackingId] = useState(null);
    const [popularSearches, setPopularSearches] = useState([]);
    const [landingFeed, setLandingFeed] = useState([]);
    const [showImageSearch, setShowImageSearch] = useState(false);

    // --- UTILS & CONSTANTS ---
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const INDIAN_CITIES = [
        "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
        "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat"
    ];

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // --- EFFECT: SYNC WITH URL ---
    useEffect(() => {
        const urlQuery = searchParams.get('q');
        const urlLocation = searchParams.get('location');

        if (urlQuery) {
            setQuery(urlQuery);
            if (urlLocation) setLocation(urlLocation);

            // Trigger search with the URL params
            handleSearch(null, 'text', null, '', urlQuery, urlLocation);
        } else {
            // Reset to landing state if no query
            setSearched(false);
            setSearchData(null);
            setQuery('');
        }
    }, [searchParams]); // Re-run when URL changes

    useEffect(() => {
        // Fetch popular searches on load
        axios.get(`${API_BASE}/graph/popular`)
            .then(res => setPopularSearches(res.data))
            .catch(err => console.error("Failed to fetch popular searches", err));

        // Fetch curated landing feed
        axios.get(`${API_BASE}/discovery/landing`)
            .then(res => setLandingFeed(res.data.feed))
            .catch(err => console.error("Failed to fetch landing feed", err));
    }, []);

    // --- HANDLERS ---
    const getSortedLocalResults = () => {
        if (!searchData?.results?.local) return [];
        return [...searchData.results.local].sort((a, b) => {
            if (localSort === 'distance') {
                const distA = parseFloat(a.distance) || 0;
                const distB = parseFloat(b.distance) || 0;
                return distA - distB;
            } else {
                return a.price - b.price;
            }
        });
    };

    const handleTrack = async (product) => {
        setTrackingId(product.id);
        const competitors = [{
            name: product.source,
            url: product.url,
            price: product.price
        }];

        try {
            const response = await axios.post(`${API_BASE}/discovery/track`, {
                name: product.title,
                price: product.price,
                image: product.image,
                competitors: competitors
            });
            navigate(`/product/${response.data.id}`);
        } catch (error) {
            console.error("Tracking failed:", error);
            setTrackingId(null);
            alert("Failed to track product");
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleSearch(e, 'image', file);
            setShowImageSearch(false);
        }
    };

    const handleSearch = async (e, mode = 'text', file = null, url = '', overrideQuery = null, overrideLocation = null) => {
        if (e) e.preventDefault();

        const q = overrideQuery || query;
        const loc = overrideLocation || location;

        if (mode === 'text' && !q.trim()) return;

        // If triggered from local input (not URL sync), push to URL
        if (!overrideQuery && mode === 'text') {
            navigate(`/?q=${encodeURIComponent(q)}${loc ? `&location=${encodeURIComponent(loc)}` : ''}`);
            return; // The useEffect will catch the URL change and trigger the actual API call
        }

        setLoading(true);
        setError(null);
        setSearched(true);
        setSearchData(null);
        setActiveTab('online');

        try {
            let response;
            const locationParam = loc ? `&location=${encodeURIComponent(loc)}` : '';

            if (mode === 'image' && file) {
                const formData = new FormData();
                formData.append('file', file);
                if (loc) formData.append('location', loc);

                response = await axios.post(`${API_BASE}/discovery/search-by-image`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // Text Search
                response = await axios.get(
                    `${API_BASE}/discovery/search?q=${encodeURIComponent(q)}${locationParam}`
                );
            }

            if (!response.data || (!response.data.results?.online?.length && !response.data.results?.local?.length && !response.data.results?.instagram?.length)) {
                setError("No results found. Try a different query.");
            } else {
                setSearchData(response.data);
                if (response.data.query && !query) setQuery(response.data.query);
            }
        } catch (err) {
            console.error("Search failed:", err);
            setError(`Search failed: ${err.message || "Unknown Error"}.`);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        navigate('/'); // This will trigger the reset via useEffect
    };

    // --- CATEGORY DATA ---
    const categories = [
        { id: 'women', title: 'Women', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800', query: 'Women Fashion' },
        { id: 'fashion', title: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-05328324f377?auto=format&fit=crop&q=80&w=800', query: 'Latest Fashion Trends' },
        { id: 'beauty', title: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?auto=format&fit=crop&q=80&w=800', query: 'Beauty Products' },
        { id: 'health', title: 'Health', image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=800', query: 'Health & Wellness' },
    ];

    return (
        <div className="bg-gray-50 min-h-screen pb-20 font-sans">

            {/* LANDING PAGE CONTENT (When NOT searched) */}
            {!searched && (
                <div className="animate-fade-in space-y-8 pb-12">

                    {/* --- MOBILE: SEARCH INPUT --- */}
                    <div className="md:hidden px-4 pt-4">
                        <form onSubmit={(e) => handleSearch(e)} className="relative drop-shadow-sm">
                            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-gray-900 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 font-medium"
                                placeholder="Search products & brands"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </form>
                    </div>

                    {/* --- SECTION 1: POPULAR IN INDIA (Chips) --- */}
                    <div className="px-4 md:px-8 max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Popular in India</h3>
                        </div>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
                            {popularSearches.length > 0 ? popularSearches.map((term, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(`/?q=${encodeURIComponent(term.term)}`)}
                                    className="flex-shrink-0 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap hover:border-blue-500 hover:text-blue-600 shadow-sm transition-all"
                                >
                                    {term.term}
                                </button>
                            )) : (
                                // Fallback if no popular searches loaded
                                ["Kurti Set", "Saree", "Tops for Women", "Handbags", "Earrings", "Heels"].map(term => (
                                    <button
                                        key={term}
                                        onClick={() => navigate(`/?q=${encodeURIComponent(term)}`)}
                                        className="flex-shrink-0 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap hover:border-blue-500 hover:text-blue-600 shadow-sm transition-all"
                                    >
                                        {term}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* --- SECTION 2: TRENDING DEALS (Horizontal Cards) --- */}
                    <div className="px-4 md:px-8 max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Trending Deals</h3>
                            <span className="text-xs font-medium text-blue-600">View all</span>
                        </div>
                        {/* Using SeasonalityWidget content but styled as horizontal scroll if possible, or just keeping the widget logic if it fits. 
                             For MVP, let's mock a "Trending" scroll to match wireframe exactly. */}
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 snap-x md:grid md:grid-cols-5 md:mx-0 md:px-0 md:gap-6">
                            {(landingFeed.length > 0 ? landingFeed : [
                                { title: 'Loading Deals...', price: '---', source: '---', image: '' }
                            ]).map((item, i) => (
                                <div key={i} className="snap-start flex-shrink-0 w-48 md:w-60 bg-white border border-gray-200 overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow duration-200 rounded-sm" onClick={() => item.title !== 'Loading Deals...' && navigate(`/?q=${encodeURIComponent(item.title)}`)}>
                                    <div className="relative aspect-[3/4] bg-white p-4 pb-0 flex items-center justify-center">
                                        {item.badges && item.badges.length > 0 && (
                                            <div className="absolute top-0 left-0 z-10 flex flex-col items-start gap-1 p-2">
                                                {item.badges.map((badge, bIdx) => {
                                                    const isBestValue = badge.includes("Value");
                                                    return (
                                                        <span key={bIdx} className={`text-[11px] font-bold px-2 py-1 shadow-sm ${isBestValue ? "bg-[#C7511F] text-white skew-x-[-10deg]" : "bg-[#B12704] text-white"}`}>
                                                            {isBestValue ? "Best Seller" : badge}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <img src={item.image || item.thumbnail} alt={item.title} className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                                    </div>
                                    <div className="p-3 flex flex-col h-auto">
                                        <h4 className="text-[15px] font-medium text-[#0F1111] leading-snug line-clamp-3 group-hover:text-[#C7511F] mb-1 min-h-[4.5em] tracking-tight">
                                            {item.title}
                                        </h4>
                                        <div className="mt-auto">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-[10px] relative top-[-0.3em]">₹</span>
                                                <span className="text-2xl font-medium text-[#0F1111]">{typeof item.price === 'number' ? item.price.toLocaleString() : item.price}</span>
                                                <span className="text-[10px] text-gray-500">M.R.P.</span>
                                                <span className="text-xs text-gray-500 line-through">₹{typeof item.price === 'number' ? (item.price * 1.25).toFixed(0) : '---'}</span>
                                            </div>

                                            {item.rating > 0 && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <div className="flex text-[#FFA41C]">
                                                        {[...Array(5)].map((_, i) => (
                                                            <svg key={i} className={`w-4 h-4 ${i < Math.round(item.rating) ? 'fill-current' : 'text-gray-200 stroke-gray-400 stroke-1'}`} viewBox="0 0 24 24">
                                                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-[#007185] hover:text-[#C7511F] cursor-pointer hover:underline font-medium">
                                                        {item.reviews ? item.reviews.toLocaleString() : 0}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="mt-2 text-xs text-gray-500">
                                                FREE Delivery by <span className="font-bold text-[#0F1111]">{item.source || "Amazon"}</span>
                                            </div>

                                            <button className="mt-3 w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] hover:border-[#F2C200] text-[#0F1111] text-[13px] py-1.5 rounded-full shadow-sm hover:shadow transition-all font-normal">
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- SECTION 3: TOP CATEGORIES (Horizontal Cards) --- */}
                    <div className="px-4 md:px-8 max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Explore Categories</h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 snap-x md:grid md:grid-cols-4 md:mx-0 md:px-0 md:gap-6">
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    onClick={() => navigate(`/?q=${encodeURIComponent(cat.query)}`)}
                                    className="snap-center flex-shrink-0 w-64 h-36 md:h-64 md:w-auto relative rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all"
                                >
                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors z-10" />
                                    <img
                                        src={cat.image}
                                        alt={cat.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute bottom-0 left-0 p-4 z-20">
                                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{cat.title}</h3>
                                        <p className="text-xs text-gray-200 font-medium">View Collection</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- SECTION 4: SEASONAL WIDGET --- */}
                    <div className="px-4 md:px-8 max-w-7xl mx-auto">
                        <SeasonalityWidget />
                    </div>

                </div>
            )}

            {/* 2. ERROR STATE */}
            {searched && error && (
                <div className="text-center py-12">
                    <div className="inline-block bg-red-50 text-red-600 px-6 py-4 rounded-lg border border-red-100">
                        <p className="font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* 3. RESULTS STATE */}
            {searched && !error && searchData && (
                <div className="space-y-12 animate-fade-in">

                    {/* AI INSIGHT CARD */}
                    {searchData?.insight && (
                        <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col lg:flex-row gap-8 lg:gap-10 items-start justify-between border border-gray-800">
                            <div className="flex-1 space-y-6 w-full min-w-0">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-widest uppercase">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                        AI Recommendation
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-light leading-tight">
                                        {searchData.insight.best_value?.title || "Top Pick"}
                                    </h2>
                                </div>
                                <p className="text-gray-300 text-base md:text-lg font-light leading-relaxed max-w-2xl">
                                    {searchData.insight.recommendation_text}
                                </p>
                                <div className="inline-block border border-white/10 bg-white/5 px-4 py-3 rounded-lg w-full md:w-auto">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Authenticity Tip</p>
                                    <p className="text-white text-sm">{searchData.insight.authenticity_note}</p>
                                </div>
                            </div>

                            <div className="w-full lg:w-96 lg:flex-shrink-0 mt-6 lg:mt-0 lg:text-right border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-10">
                                <p className="text-gray-400 text-sm mb-2">Best Market Price</p>
                                <p className="text-4xl md:text-5xl font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                                    ₹{searchData.results?.online?.[0]?.price?.toLocaleString() || "---"}
                                </p>
                                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                                    Available on {searchData.insight.best_value?.reason || "Online Stores"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TABS */}
                    <div className="flex items-center gap-8 border-b border-gray-100 pb-1 overflow-x-auto">
                        {[
                            { id: 'online', label: 'ONLINE RETAIL', count: searchData?.results?.online?.length },
                            { id: 'instagram', label: 'INSTAGRAM', count: searchData?.results?.instagram?.length },
                            { id: 'local', label: 'LOCAL STORES', count: searchData?.results?.local?.length }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 text-sm font-medium tracking-wide transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-400 hover:text-gray-800'
                                    }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ONLINE RESULTS */}
                    {activeTab === 'online' && searchData?.results?.online && (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            {/* Filters Sidebar */}
                            <div className="hidden lg:block space-y-8">
                                <div>
                                    <h3 className="font-bold text-sm tracking-wide text-gray-900 mb-4 uppercase">Stores</h3>
                                    <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                        {Array.from(new Set(searchData.results.online.map(p => p.source))).sort().map(store => (
                                            <label key={store} className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer h-4 w-4 border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 transition-all appearance-none"
                                                        checked={selectedStores.includes(store)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedStores([...selectedStores, store]);
                                                            else setSelectedStores(selectedStores.filter(s => s !== store));
                                                        }}
                                                    />
                                                    <Check size={10} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                                </div>
                                                <span className={`text-sm transition-colors ${selectedStores.includes(store) ? 'text-gray-900 font-medium' : 'text-gray-500 group-hover:text-gray-900'}`}>
                                                    {store}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Product Grid */}
                            <div className="lg:col-span-3">
                                <div className="space-y-12">
                                    {(() => {
                                        const filteredProducts = searchData.results.online
                                            .filter(p => selectedStores.length === 0 || selectedStores.includes(p.source));

                                        const directMatches = filteredProducts.filter(p => p.match_quality === 'exact');
                                        const relatedMatches = filteredProducts.filter(p => p.match_quality !== 'exact');

                                        // Calculate global min price for badge logic
                                        const prices = filteredProducts.map(p => p.price).filter(p => p > 0);
                                        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

                                        const renderProductCard = (product) => (
                                            <div
                                                key={product.id}
                                                className="group cursor-pointer"
                                                onClick={() => window.open(product.url, '_blank')}
                                            >
                                                <div className="relative aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden mb-4 border border-gray-100 group-hover:shadow-lg transition-all">
                                                    {product.price === minPrice && minPrice > 0 && (
                                                        <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10 pointer-events-none">LOWEST PRICE</div>
                                                    )}
                                                    {product.match_quality === 'exact' && (
                                                        <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10 pointer-events-none">TOP MATCH</div>
                                                    )}
                                                    <a href={product.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                        <img src={product.image} alt={product.title} className="w-full h-full object-contain p-6 mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                                                    </a>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{product.source}</span>
                                                        <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                                                    </div>
                                                    <h3 className="text-sm text-gray-700 font-medium leading-snug line-clamp-2 transition-colors">
                                                        <a href={product.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                                                            {product.title}
                                                        </a>
                                                    </h3>

                                                    <div className="mt-2 flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleTrack(product); }}
                                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${trackingId === product.id
                                                                ? 'bg-blue-50 text-blue-600'
                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            {trackingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                                            {trackingId === product.id ? 'Loading...' : 'History'}
                                                        </button>
                                                        <a
                                                            href={product.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex-1 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            Visit <ArrowUpRight size={14} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        );

                                        return (
                                            <>
                                                {directMatches.length > 0 && (
                                                    <div className="mb-10">
                                                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                                            <Check size={20} className="text-green-500" />
                                                            Found this product
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
                                                            {directMatches.map(renderProductCard)}
                                                        </div>
                                                    </div>
                                                )}

                                                {relatedMatches.length > 0 && (
                                                    <div>
                                                        {directMatches.length > 0 && (
                                                            <h3 className="text-lg font-bold text-gray-500 mb-6 border-t border-gray-100 pt-10">
                                                                Related Results
                                                            </h3>
                                                        )}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
                                                            {relatedMatches.slice(0, visibleCount).map(renderProductCard)}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Pagination Button (Logic simplified to just check total vs visible of related) */}
                                {(() => {
                                    const filteredCount = searchData.results.online
                                        .filter(p => selectedStores.length === 0 || selectedStores.includes(p.source)).length;
                                    // This simple check might be slightly off if direct matches take up space, but it's acceptable UX for "Show More"
                                    return visibleCount < filteredCount && (
                                        <div className="text-center pt-12">
                                            <button
                                                onClick={() => setVisibleCount(prev => prev + 6)}
                                                className="text-sm font-bold text-blue-600 hover:text-blue-800 border-b-2 border-transparent hover:border-blue-600 transition-all pb-1 uppercase tracking-wide"
                                            >
                                                Show More Results
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* INSTAGRAM RESULTS */}
                    {activeTab === 'instagram' && searchData?.results?.instagram && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {searchData.results.instagram.map(item => (
                                <div key={item.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-shadow flex flex-col group">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {item.username[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <a href={item.profile_url} target="_blank" className="font-bold text-gray-900 hover:text-purple-600">@{item.username}</a>
                                            <div className="text-xs text-gray-500">{item.followers.toLocaleString()} followers</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">{item.caption}</p>
                                    <div className="text-xl font-bold text-gray-900 mb-4">{item.price ? `₹${item.price.toLocaleString()}` : 'Price on Request'}</div>
                                    <a href={item.post_url} target="_blank" className="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg hover:opacity-90 transition-all">
                                        View on Instagram
                                    </a>
                                </div>
                            ))}
                            {searchData.results.instagram.length === 0 && (
                                <div className="col-span-full py-12 text-center text-gray-500">
                                    No Instagram sellers found for this product.
                                </div>
                            )}
                        </div>
                    )}

                    {/* LOCAL RESULTS */}
                    {activeTab === 'local' && searchData?.results?.local && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {getSortedLocalResults().map(place => (
                                <div key={place.id} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-gray-900">{place.source}</h3>
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded flex items-center gap-1">
                                            <MapPin size={12} /> {place.distance}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4 flex-grow">{place.address}</p>
                                    <div className="flex gap-2 mt-auto">
                                        <a href={`tel:${place.phone}`} className="flex-1 py-2 text-center border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Call</a>
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.source + " " + place.address)}`} target="_blank" className="flex-1 py-2 text-center bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Directions</a>
                                    </div>
                                </div>
                            ))}
                            {searchData.results.local.length === 0 && (
                                <div className="col-span-full py-12 text-center text-gray-500">
                                    No local stores found. Try changing the location.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HomePage;
