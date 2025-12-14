import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, ArrowRight, Check, Plus, ChevronDown, Camera, X } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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

    // --- UTILS & CONSTANTS ---
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const INDIAN_CITIES = [
        "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
        "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat"
    ];

    const navigate = useNavigate();

    useEffect(() => {
        // Fetch popular searches on load
        axios.get(`${API_BASE}/graph/popular`)
            .then(res => setPopularSearches(res.data))
            .catch(err => console.error("Failed to fetch popular searches", err));
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
        if (mode === 'text' && !q.trim()) return;

        setLoading(true);
        setError(null);
        setSearched(true);
        setSearchData(null);
        setActiveTab('online');

        try {
            let response;
            const locationParam = location ? `&location=${encodeURIComponent(location)}` : '';

            // Currently only implemented TEXT search in this refactor for simplicity as per requirement
            response = await axios.get(
                `${API_BASE}/discovery/search?q=${encodeURIComponent(q)}${locationParam}`
            );

            if (!response.data || (!response.data.results?.online?.length && !response.data.results?.local?.length && !response.data.results?.instagram?.length)) {
                setError("No results found. Try a different query.");
            } else {
                setSearchData(response.data);
            }
        } catch (err) {
            console.error("Search failed:", err);
            setError(`Search failed: ${err.message || "Unknown Error"}.`);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setSearched(false);
        setSearchData(null);
        setQuery('');
        setError(null);
    };

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Hero Section */}
            <div className={`relative overflow-hidden bg-slate-900 transition-all duration-700 ease-in-out ${searched ? 'py-8' : 'py-16 sm:py-24'}`}>
                {/* Background Pattern - Only visible when not searched or subtle */}
                {!searched && (
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                    </div>
                )}

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Condensed Header when searching */}
                    <div className={`text-center transition-all duration-500 ${searched ? 'mb-6 flex items-center justify-between' : 'mb-8'}`}>
                        {!searched ? (
                            <>
                                <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-8">
                                    Shop Smart. <span className="text-blue-400">Save More.</span>
                                </h1>
                                <p className="max-w-2xl mx-auto text-xl text-gray-300 mb-10">
                                    Compare prices across online & local stores instantly.
                                    Track price history and get seasonal buying advice.
                                </p>
                            </>
                        ) : (
                            // Use a spacer or minimal header if needed, but the Navbar usually handles branding.
                            // We can keep the search bar centralized.
                            <div className="hidden"></div>
                        )}
                    </div>

                    <form onSubmit={(e) => handleSearch(e)} className={`relative group transition-all duration-500 ${searched ? 'max-w-4xl mx-auto' : 'max-w-3xl mx-auto'}`}>
                        <div className="flex flex-col md:flex-row gap-2">
                            {/* Search Input */}
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                    <Search className={`h-6 w-6 transition-colors ${searched ? 'text-gray-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                                </div>
                                <input
                                    type="text"
                                    className={`block w-full pl-16 pr-6 py-4 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-xl ${searched
                                        ? 'bg-white text-gray-900 placeholder-gray-500 border-gray-200'
                                        : 'bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:bg-white/20'
                                        }`}
                                    placeholder="Search by name, product URL, or image..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                {searched && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            {/* Location Dropdown */}
                            <div className="relative md:w-48">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                    <MapPin className={`h-5 w-5 ${searched ? 'text-gray-400' : 'text-gray-300'}`} />
                                </div>
                                <select
                                    className={`block w-full pl-12 pr-8 py-4 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-xl appearance-none cursor-pointer ${searched
                                        ? 'bg-white text-gray-900 border-gray-200'
                                        : 'bg-white/10 backdrop-blur-md border border-white/20 text-white focus:bg-white/20'
                                        }`}
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                >
                                    <option value="" className="text-gray-900">All India</option>
                                    {INDIAN_CITIES.map(city => (
                                        <option key={city} value={city} className="text-gray-900">{city}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                    <ChevronDown className={`h-4 w-4 ${searched ? 'text-gray-400' : 'text-gray-300'}`} />
                                </div>
                            </div>

                            {/* Search Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-8 py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${searched
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Search'}
                            </button>
                        </div>
                    </form>

                    {/* Quick chips (Only show when not searched) */}
                    {!searched && (
                        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-gray-400">
                            {popularSearches.length > 0 && <span>Popular Searches:</span>}
                            {popularSearches.map((term, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setQuery(term.term); handleSearch(null, 'text', null, '', term.term); }}
                                    className="hover:text-white underline decoration-blue-500 decoration-2 underline-offset-4"
                                >
                                    {term.term}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

                {/* 1. INITIAL STATE: Seasonality Widget */}
                {!searched && (
                    <div className="max-w-4xl mx-auto">
                        <SeasonalityWidget />
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
                            <div className="bg-gradient-to-br from-gray-900 to-black text-white p-8 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-10 items-start justify-between border border-gray-800">
                                <div className="flex-1 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold tracking-widest uppercase">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                            AI Recommendation
                                        </div>
                                        <h2 className="text-3xl font-light">
                                            {searchData.insight.best_value?.title || "Top Pick"}
                                        </h2>
                                    </div>
                                    <p className="text-gray-300 text-lg font-light leading-relaxed max-w-2xl">
                                        {searchData.insight.recommendation_text}
                                    </p>
                                    <div className="inline-block border border-white/10 bg-white/5 px-4 py-3 rounded-lg">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Authenticity Tip</p>
                                        <p className="text-white text-sm">{searchData.insight.authenticity_note}</p>
                                    </div>
                                </div>

                                <div className="text-right border-l border-white/10 pl-10 hidden md:block">
                                    <p className="text-gray-400 text-sm mb-2">Best Market Price</p>
                                    <p className="text-5xl font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                                        ₹{searchData.results?.online?.[0]?.price?.toLocaleString() || "---"}
                                    </p>
                                    <p className="text-gray-500 mt-2 text-sm">
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-10">
                                        {searchData.results.online
                                            .filter(p => selectedStores.length === 0 || selectedStores.includes(p.source))
                                            .slice(0, visibleCount)
                                            .map((product, idx) => (
                                                <div key={product.id} className="group">
                                                    <div className="relative aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden mb-4 border border-gray-100 group-hover:shadow-lg transition-all">
                                                        {idx === 0 && selectedStores.length === 0 && (
                                                            <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10 pointer-events-none">BEST PRICE</div>
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

                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleTrack(product); }}
                                                            className={`mt-2 w-full py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${trackingId === product.id
                                                                    ? 'bg-blue-50 text-blue-600'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            {trackingId === product.id ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                                            {trackingId === product.id ? 'Loading History...' : 'View Price History'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                    {visibleCount < searchData.results.online.length && (
                                        <div className="text-center pt-12">
                                            <button
                                                onClick={() => setVisibleCount(prev => prev + 6)}
                                                className="text-sm font-bold text-blue-600 hover:text-blue-800 border-b-2 border-transparent hover:border-blue-600 transition-all pb-1 uppercase tracking-wide"
                                            >
                                                Show More Results
                                            </button>
                                        </div>
                                    )}
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
        </div>
    );
};

export default HomePage;
