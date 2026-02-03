import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, ArrowRight, Check, Plus, ChevronDown, Camera } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SearchInterface = ({ initialQuery }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState(initialQuery || searchParams.get('q') || '');
    const [location, setLocation] = useState('');
    const [searchData, setSearchData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(null);
    const [visibleCount, setVisibleCount] = useState(5);
    const [activeTab, setActiveTab] = useState('online');
    const [localSort, setLocalSort] = useState('distance');
    const [selectedStores, setSelectedStores] = useState([]);

    // Image/URL search states
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageFile, setImageFile] = useState(null);

    // API Base URL for production
    const API_BASE = import.meta.env.VITE_API_URL || '';

    // Trigger search if initialQuery or URL param exists
    useEffect(() => {
        const targetQuery = initialQuery || searchParams.get('q');
        if (targetQuery) {
            setQuery(targetQuery);
            handleSearch(null, 'text', null, '', targetQuery);
        }
    }, [initialQuery, searchParams]);

    // Major Indian cities for dropdown
    const INDIAN_CITIES = [
        "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
        "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat"
    ];

    // Categories
    const categories = [
        { id: 'clothing', title: 'Clothing', image: 'https://images.unsplash.com/photo-1549570186-6e6b0d99042b?auto=format&fit=crop&q=80&w=800', query: 'Women Clothing' },
        { id: 'footwear', title: 'Footwear', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=800', query: 'Women Footwear' },
        { id: 'handbags', title: 'Handbags', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800', query: 'Handbags for Women' },
        { id: 'jewellery', title: 'Jewellery', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800', query: 'Fashion Jewellery' },
        { id: 'watches', title: 'Watches', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=800', query: 'Women Watches' },
        { id: 'beauty', title: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?auto=format&fit=crop&q=80&w=800', query: 'Beauty Products' },
    ];

    // Helper to get sorted local results
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

    const [trackingId, setTrackingId] = useState(null);

    const handleTrack = async (product) => {
        setTrackingId(product.id);

        // Treat other online results as competitors
        const competitors = searchData.results.online
            .filter(p => p.id !== product.id)
            .map(p => ({
                name: p.source,
                url: p.url,
                price: p.price
            }));

        try {
            const response = await axios.post(`${API_BASE}/discovery/track`, {
                name: product.title,
                price: product.price,
                image: product.image,
                competitors: competitors
            });

            // Redirect to product page
            navigate(`/product/${response.data.id}`);

        } catch (error) {
            console.error("Tracking failed:", error);
            setTrackingId(null);
            alert("Failed to track product");
        }
    };

    const handleSearch = async (e, mode = 'text', file = null, url = '', overrideQuery = null) => {
        if (e) e.preventDefault();

        const q = overrideQuery || query;

        // Validation
        if (mode === 'text' && !q.trim()) return;
        if (mode === 'image' && !file) return;
        if (mode === 'url' && !url.trim()) return;

        setLoading(true);
        setError(null);
        setSearched(true);
        setSearchData(null);
        setActiveTab('online');
        setShowImageModal(false);

        // Update URL if text search
        if (mode === 'text' && !overrideQuery) {
            // navigate(`?q=${encodeURIComponent(q)}`); // Optional: keep URL in sync
        }

        try {
            let response;
            const locationParam = location ? `&location=${encodeURIComponent(location)}` : '';

            if (mode === 'text') {
                response = await axios.get(
                    `${API_BASE}/discovery/search?q=${encodeURIComponent(q)}${locationParam}`
                );
            } else if (mode === 'image') {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('location', location || 'Mumbai');

                response = await axios.post(
                    `${API_BASE}/discovery/search-by-image`,
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    }
                );
            } else if (mode === 'url') {
                response = await axios.post(
                    `${API_BASE}/discovery/search-by-url`,
                    null,
                    {
                        params: {
                            url: url,
                            location: location || 'Mumbai'
                        }
                    }
                );
            }

            if (!response.data || (!response.data.results?.online?.length && !response.data.results?.local?.length && !response.data.results?.instagram?.length)) {
                setError("No results found. Try a different query, image, or URL.");
                setSearchData(null);
            } else {
                setSearchData(response.data);
            }
        } catch (err) {
            console.error("Search failed:", err);
            setError(`Search failed: ${err.message || "Unknown Error"}. Check console.`);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (catQuery) => {
        setQuery(catQuery);
        handleSearch(null, 'text', null, '', catQuery);
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20">
            {/* Removed internal Navbar */}

            {/* Hero / Search Section */}
            <div className={`transition-all duration-700 ease-out ${searched ? 'py-10 border-b border-gray-100' : 'py-32'}`}>
                <div className="max-w-3xl mx-auto px-6">
                    {!searched && (
                        <div className="text-center mb-12">
                            <h1 className="text-5xl font-light tracking-tight text-black mb-4">
                                <span className="font-semibold">KitneKa?</span> Sahi Daam, Sahi Dukaan.
                            </h1>
                            <p className="text-gray-400 text-lg font-light">
                                Compare prices across online & local stores instantly.
                            </p>
                        </div>
                    )}

                    <form onSubmit={(e) => handleSearch(e, 'text')} className="group relative">
                        <div className={`flex flex-col md:flex-row gap-4 ${searched ? '' : 'p-2'}`}>
                            {/* Search Input with Camera Icon */}
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-12 pr-14 py-4 bg-white border-2 border-gray-300 rounded-lg text-lg text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-all"
                                    placeholder="Search for a product..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                {/* Camera Icon (Google Lens style) */}
                                <button
                                    type="button"
                                    onClick={() => setShowImageModal(true)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                                    title="Search by image"
                                >
                                    <Camera className="h-5 w-5 text-gray-600 hover:text-black transition-colors" />
                                </button>
                            </div>


                            {/* Location Dropdown */}
                            <div className="relative md:w-1/3">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                </div>
                                <select
                                    className="block w-full pl-12 pr-10 py-4 bg-white border-2 border-gray-300 rounded-lg text-lg text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-all appearance-none cursor-pointer"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                >
                                    <option value="">Select City</option>
                                    {INDIAN_CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Button */}
                            <button
                                type="submit"
                                className="bg-black text-white px-10 py-4 rounded-lg font-medium hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-2 border-black"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Search'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* CATEGORIES GRID (Only when NOT searched) */}
            {!searched && (
                <div className="px-4 md:px-8 max-w-7xl mx-auto pb-20">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-900 border-l-4 border-black pl-3 rounded-l-sm">Explore Categories</h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 snap-x md:grid md:grid-cols-3 lg:grid-cols-6 md:mx-0 md:px-0 md:gap-6">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.query)}
                                className="snap-center flex-shrink-0 w-40 h-48 relative rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                <img
                                    src={cat.image}
                                    alt={cat.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute bottom-0 left-0 p-4 z-20">
                                    <h3 className="text-base font-bold text-white leading-tight">{cat.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Section */}
            {searched && (
                <div className="max-w-7xl mx-auto px-6 pb-24 space-y-12">
                    {/* Error Message */}
                    {error && (
                        <div className="text-center py-12">
                            <div className="inline-block bg-red-50 text-red-600 px-6 py-4 rounded-lg border border-red-100">
                                <p className="font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* AI INSIGHT CARD (Minimalist Black) */}
                    {!error && searchData?.insight && (
                        <div className="bg-black text-white p-8 rounded-xl shadow-2xl flex flex-col md:flex-row gap-10 items-start justify-between">
                            <div className="flex-1 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold tracking-widest uppercase">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                        AI Recommendation
                                    </div>
                                    <h2 className="text-3xl font-light">
                                        {searchData.insight.best_value?.title || "Top Pick"}
                                    </h2>
                                </div>
                                <p className="text-gray-300 text-lg font-light leading-relaxed max-w-2xl">
                                    {searchData.insight.recommendation_text}
                                </p>
                                <div className="inline-block border border-white/20 px-4 py-3 rounded-lg">
                                    <p className="text-sm text-gray-400 uppercase tracking-wider text-xs mb-1">Authenticity Tip</p>
                                    <p className="text-white text-sm">{searchData.insight.authenticity_note}</p>
                                </div>
                            </div>

                            <div className="text-right border-l border-white/10 pl-10 hidden md:block">
                                <p className="text-gray-400 text-sm mb-2">Best Market Price</p>
                                <p className="text-6xl font-medium tracking-tighter">
                                    ₹{searchData.results?.online?.[0]?.price?.toLocaleString() || "---"}
                                </p>
                                <p className="text-gray-500 mt-2 text-sm">
                                    Available on {searchData.insight.best_value?.reason || "Online Stores"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TABS (Subtle Underline) */}
                    {!error && searchData && (
                        <div className="flex items-center gap-8 border-b border-gray-100 pb-1">
                            <button
                                onClick={() => setActiveTab('online')}
                                className={`pb-4 text-sm font-medium tracking-wide transition-all ${activeTab === 'online' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}
                            >
                                ONLINE RETAIL
                                {searchData?.results?.online?.length > 0 && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{searchData.results.online.length}</span>}
                            </button>
                            <button
                                onClick={() => setActiveTab('instagram')}
                                className={`pb-4 text-sm font-medium tracking-wide transition-all ${activeTab === 'instagram' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}
                            >
                                INSTAGRAM
                                {searchData?.results?.instagram?.length > 0 && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{searchData.results.instagram.length}</span>}
                            </button>
                            <button
                                onClick={() => setActiveTab('local')}
                                className={`pb-4 text-sm font-medium tracking-wide transition-all ${activeTab === 'local' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}
                            >
                                LOCAL STORES
                                {searchData?.results?.local?.length > 0 && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{searchData.results.local.length}</span>}
                            </button>
                        </div>
                    )}

                    {/* ONLINE RESULTS GRID + SIDEBAR */}
                    {!error && activeTab === 'online' && searchData?.results?.online && searchData.results.online.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            {/* SIDEBAR FILTERS */}
                            <div className="hidden lg:block space-y-8">
                                <div>
                                    <h3 className="font-bold text-sm tracking-wide text-black mb-4 uppercase">Stores</h3>
                                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {Array.from(new Set(searchData.results.online.map(p => p.source))).sort().map(store => (
                                            <label key={store} className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer h-4 w-4 border-2 border-gray-300 rounded-sm checked:bg-black checked:border-black transition-all appearance-none"
                                                        checked={selectedStores.includes(store)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedStores([...selectedStores, store]);
                                                            } else {
                                                                setSelectedStores(selectedStores.filter(s => s !== store));
                                                            }
                                                        }}
                                                    />
                                                    <Check size={10} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                                </div>
                                                <span className={`text-sm transition-colors ${selectedStores.includes(store) ? 'text-black font-medium' : 'text-gray-500 group-hover:text-black'}`}>
                                                    {store}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RESULTS GRID */}
                            <div className="lg:col-span-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
                                    {searchData.results.online
                                        .filter(p => selectedStores.length === 0 || selectedStores.includes(p.source))
                                        .slice(0, visibleCount)
                                        .map((product, idx) => (
                                            <div key={product.id} className="group cursor-pointer">
                                                <div className="relative aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden mb-5 border border-gray-100">
                                                    {idx === 0 && selectedStores.length === 0 && <div className="absolute top-4 left-4 bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 tracking-wider">BEST PRICE</div>}
                                                    <img src={product.image} alt={product.title} className="w-full h-full object-contain p-8 mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{product.source}</span>
                                                        <span className="text-lg font-bold text-black">₹{product.price.toLocaleString()}</span>
                                                    </div>
                                                    <h3 className="text-base text-black font-medium leading-snug group-hover:underline decoration-1 underline-offset-4 line-clamp-2">
                                                        {product.title}
                                                    </h3>

                                                    <div className="flex items-center justify-between mt-4">
                                                        <a href={product.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors">
                                                            View Details <ArrowRight size={14} />
                                                        </a>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTrack(product);
                                                            }}
                                                            disabled={trackingId === product.id}
                                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${trackingId === product.id
                                                                ? 'bg-gray-100 text-gray-700'
                                                                : 'bg-black text-white hover:bg-neutral-800'
                                                                }`}
                                                        >
                                                            {trackingId === product.id ? <Check size={12} /> : <Plus size={12} />}
                                                            {trackingId === product.id ? 'Tracking' : 'Track'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                {visibleCount < searchData.results.online.length && (
                                    <div className="text-center pt-12">
                                        <button
                                            onClick={() => setVisibleCount(prev => prev + 6)}
                                            className="text-sm font-medium text-gray-500 hover:text-black border-b border-gray-300 hover:border-black transition-all pb-1"
                                        >
                                            LOAD MORE RESULTS
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Empty State
                        (!error && activeTab === 'online' && searchData?.results?.online && searchData.results.online.length === 0 && (
                            <div className="text-center py-20 text-slate-500">No online results found.</div>
                        ))
                    )}

                    {/* LOCAL RESULTS TAB */}
                    {
                        !error && activeTab === 'local' && (
                            searchData?.results?.local && searchData.results.local.length > 0 ? (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-slate-800">
                                            Stores in {location}
                                        </h2>
                                        <div className="flex items-center gap-2 text-sm bg-white border border-slate-200 rounded-lg p-1">
                                            <button
                                                onClick={() => setLocalSort('distance')}
                                                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${localSort === 'distance' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
                                            >
                                                Sort by Distance
                                            </button>
                                            <button
                                                onClick={() => setLocalSort('price')}
                                                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${localSort === 'price' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
                                            >
                                                Sort by Price
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {getSortedLocalResults().map((place) => (
                                            <div key={place.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-amber-400 transition-colors flex flex-col group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">{place.source}</h3>
                                                        <p className="text-slate-500 text-sm">{place.address}</p>
                                                    </div>
                                                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                                        <MapPin size={12} /> {place.distance}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 mb-6">
                                                    <span className="text-sm font-medium text-slate-700">Rating: <span className="text-amber-500 font-bold">{place.rating} ★</span></span>
                                                </div>

                                                <div className="mt-auto grid grid-cols-2 gap-3">
                                                    <a href={`tel:${place.phone}`} className="flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm">
                                                        Call Store
                                                    </a>
                                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.source + " " + place.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition-colors font-medium text-sm">
                                                        Get Directions
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-xl p-8 text-center border-2 border-dashed border-slate-200">
                                    <div className="max-w-md mx-auto">
                                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📍</div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-2">No nearby stores found</h3>
                                        <p className="text-slate-500 mb-4">We couldn't find any stores in "{location}" matching this product.</p>
                                        <button
                                            onClick={() => {
                                                console.log("Switching to online tab");
                                                setActiveTab('online');
                                            }}
                                            className="text-white bg-black px-6 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                                        >
                                            Check Online Options &rarr;
                                        </button>
                                    </div>
                                </div>
                            )
                        )
                    }

                    {/* INSTAGRAM RESULTS TAB */}
                    {!error && activeTab === 'instagram' && (
                        searchData?.results?.instagram && searchData.results.instagram.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {searchData.results.instagram.map((item) => (
                                    <div key={item.id} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow flex flex-col">
                                        {/* Profile Avatar at Top */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {item.username.charAt(0).toUpperCase()}
                                                </div>
                                                {item.type === 'account' && (
                                                    <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                                                        ✓
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <a
                                                    href={item.profile_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold text-gray-900 hover:text-purple-600 transition-colors block"
                                                >
                                                    @{item.username}
                                                </a>
                                                {item.followers > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        {item.followers.toLocaleString()} followers
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">{item.caption}</p>

                                        {/* Price if available */}
                                        {item.price > 0 && (
                                            <div className="mb-4 text-2xl font-bold text-gray-900">
                                                ₹{item.price.toLocaleString()}
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <div className="mt-auto">
                                            <a
                                                href={item.post_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-lg font-medium text-sm text-center hover:from-purple-600 hover:to-pink-600 transition-all block"
                                            >
                                                View Profile
                                            </a>
                                            {!item.price && (
                                                <div className="text-center text-xs text-gray-500 mt-2">
                                                    DM for Price
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 text-center border-2 border-dashed border-purple-200">
                                <div className="max-w-md mx-auto">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📸</div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Instagram sellers found</h3>
                                    <p className="text-gray-600 mb-4">Try searching for fashion or handmade products popular on Instagram.</p>
                                </div>
                            </div>
                        )
                    )}

                    {
                        searchData && (!searchData.results?.online?.length && !searchData.results?.local?.length) && !loading && searched && (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="text-slate-300" size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">No results found</h3>
                                <p className="text-slate-500">Try searching for a simpler term</p>
                            </div>
                        )
                    }
                </div >
            )}
        </div >
    );
};

export default SearchInterface;
