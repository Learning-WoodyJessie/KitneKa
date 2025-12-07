import React, { useState } from 'react';
import { Search, MapPin, ShoppingBag, Loader2, ArrowRight, ExternalLink, Globe, Check, Plus, ChevronDown } from 'lucide-react';
import axios from 'axios';

const SearchInterface = () => {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [searchData, setSearchData] = useState(null); // Stores full response: { analysis, insight, results }
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(null); // New error state
    const [visibleCount, setVisibleCount] = useState(5);
    const [activeTab, setActiveTab] = useState('online');
    const [localSort, setLocalSort] = useState('distance');
    const [selectedStores, setSelectedStores] = useState([]);

    // API Base URL for production
    const API_BASE = import.meta.env.VITE_API_URL || '';

    // Major Indian cities for dropdown
    const INDIAN_CITIES = [
        "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
        "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat"
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
            await axios.post(`${API_BASE}/discovery/track`, {
                name: product.title,
                price: product.price,
                image: product.image,
                competitors: competitors
            });
            // Show success state briefly (could be improved with a toast)
            setTimeout(() => setTrackingId(null), 2000);
            alert(`Started tracking "${product.title}"`);
        } catch (error) {
            console.error("Tracking failed:", error);
            setTrackingId(null);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        setError(null); // Clear previous errors
        setSearchData(null);
        setActiveTab('online');

        try {
            // Call Backend API with location
            const locationParam = location ? `&location=${encodeURIComponent(location)}` : '';
            const response = await axios.get(`${API_BASE}/discovery/search?q=${encodeURIComponent(query)}${locationParam}`);

            if (!response.data || (!response.data.results?.online?.length && !response.data.results?.local?.length)) {
                setError("No results found. Try a different query or location.");
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

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-black text-white p-2 rounded-md">
                            <ShoppingBag size={20} strokeWidth={1.5} />
                        </div>
                        <span className="text-xl font-medium tracking-tight text-black">
                            KitneKa
                        </span>
                    </div>
                </div>
            </nav>

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

                    <form onSubmit={handleSearch} className="group relative">
                        <div className={`flex flex-col md:flex-row gap-4 ${searched ? '' : 'p-2'}`}>
                            {/* Search Input */}
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-300 rounded-lg text-lg text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-0 transition-all"
                                    placeholder="Search for a product..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
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
