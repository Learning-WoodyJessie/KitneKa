import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, ArrowRight, Check, Plus, ChevronDown, Camera, X } from 'lucide-react';
import FeaturedBrands from './FeaturedBrands';
import CategoryLabels from './CategoryLabels';
import ResultsGrouped from './ResultsGrouped';
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

    // New State for Brand View
    const [brandContext, setBrandContext] = useState(null);

    // Image/URL search states
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageFile, setImageFile] = useState(null);

    // API Base URL for production
    const API_BASE = import.meta.env.VITE_API_URL || '';

    // Trigger search if initialQuery or URL param exists
    useEffect(() => {
        const brandParam = searchParams.get('brand');
        const categoryParam = searchParams.get('category');

        if (brandParam) {
            setBrandContext(brandParam);
            setSearched(true);
            return;
        }

        if (categoryParam) {
            // "Browsing Mode": Search for category, but keep search box empty
            setBrandContext(null); // Clear brand context
            setSearched(true); // Switch to results view
            // We need to trigger the search fetch manually since we aren't setting 'query' state
            // and thus not triggering any effect dependent on 'query'.
            // However, handleSearch usually uses 'query' state. 
            // We will modify handleSearch or call it with override.
            handleSearch(null, 'text', null, '', categoryParam);
            return;
        }

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
        setBrandContext(null); // Reset brand context on manual search

        if (mode === 'text' && !overrideQuery) {
            setActiveTab('online');
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

    const handleCategoryLabelClick = (catQuery) => {
        setQuery(catQuery);
        handleSearch(null, 'text', null, '', catQuery);
    };

    const handleBrandClick = (brandName) => {
        setBrandContext(brandName);
        setSearched(true); // Switch to results view mode
        setSearchData(null); // Clear previous search data
        setError(null);
    };

    // Navigate to Product Page (New Tab)
    const handleProductClick = (product) => {
        // Generate real competitors from the current search results
        const otherResults = searchData?.results?.online
            ?.filter(p => p.id !== product.id)
            .map(p => ({
                name: p.source,
                price: p.price,
                url: p.url, // Ensure the real URL is passed
                source: p.source
            })) || [];

        const competitors = otherResults.length > 0 ? otherResults : (product.competitors || []);
        const productId = product.id || `mock-${Date.now()}`;

        const productWithId = {
            ...product,
            id: productId,
            url: product.url || product.link || `https://www.google.com/search?q=${encodeURIComponent(product.title || product.source)}`,
            competitors: competitors
        };

        localStorage.setItem(`product_shared_${productId}`, JSON.stringify(productWithId));
        window.open(`/product/${productId}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20">
            {/* Hero / Search Section */}
            <div className={`transition-all duration-700 ease-out py-8 border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm`}>
                <div className="max-w-5xl mx-auto px-6">
                    <form onSubmit={(e) => handleSearch(e, 'text')} className="group relative max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row shadow-sm rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="relative md:w-48 bg-gray-50 border-r border-gray-200">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="h-4 w-4 text-gray-500" />
                                </div>
                                <select
                                    className="block w-full pl-9 pr-8 py-3 bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer appearance-none h-full"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                >
                                    <option value="">Select State</option>
                                    {INDIAN_CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <ChevronDown className="h-3 w-3 text-gray-400" />
                                </div>
                            </div>

                            {/* Search Input */}
                            <div className="relative flex-grow bg-white">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-12 pr-4 py-3 bg-transparent text-base text-gray-900 placeholder-gray-400 focus:outline-none h-full"
                                    placeholder="Search for products, brands, or categories..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>

                            {/* Search Button */}
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-8 py-3 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Search'}
                            </button>
                        </div >
                    </form >
                </div >
            </div >

            {/* LANDING SECTION: Featured Brands + Categories */}
            {
                !searched && (
                    <div className="max-w-7xl mx-auto space-y-6 mt-8">
                        <FeaturedBrands onBrandClick={handleBrandClick} />
                        <CategoryLabels onCategoryClick={handleCategoryLabelClick} />
                    </div>
                )
            }

            {/* RESULTS SECTION */}
            {
                searched && (
                    <div className="max-w-7xl mx-auto pt-8">
                        {/* Error Message */}
                        {error && (
                            <div className="text-center py-12 px-6">
                                <div className="inline-block bg-red-50 text-red-600 px-6 py-4 rounded-lg border border-red-100">
                                    <p className="font-medium">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* CASE 1: Brand Grouped View */}
                        {!error && brandContext && (
                            <ResultsGrouped context={brandContext} type="BRAND" />
                        )}

                        {/* CASE 2: Standard Search Results */}
                        {!error && !brandContext && searchData?.results?.online && (
                            <div className="px-6 pb-24 space-y-12">
                                {/* Category Browse Header */}
                                {searchParams.get('category') && (
                                    <div className="flex items-center gap-2 mb-[-2rem]">
                                        <span className="text-gray-500">Browsing:</span>
                                        <h2 className="text-2xl font-bold text-gray-900">{searchParams.get('category')}</h2>
                                    </div>
                                )}

                                {/* ONLINE RESULTS GRID + SIDEBAR */}
                                {searchData.results.online.length > 0 ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                        {/* SIDEBAR FILTERS (Existing) */}
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
                                                        <div key={product.id} className="group cursor-pointer" onClick={() => handleProductClick(product)}>
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

                                                                {/* Comparison Link */}
                                                                <button className="text-sm text-blue-600 hover:underline mt-1 font-medium">Compare Prices &rarr;</button>
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
                                    <div className="text-center py-20 text-slate-500">No online results found.</div>
                                )}
                            </div>
                        )}
                    </div >
                )
            }
        </div >
    );
};

export default SearchInterface;

