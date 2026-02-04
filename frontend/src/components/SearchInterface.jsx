import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, ArrowRight, Check, Plus, ChevronDown, Camera, X, Menu, ShoppingBag, User, Heart } from 'lucide-react';
import FeaturedBrands from './FeaturedBrands';
import CategoryLabels from './CategoryLabels';
import ResultsGrouped from './ResultsGrouped';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SearchInterface = ({ initialQuery }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState(initialQuery || searchParams.get('q') || '');
    // Location removed as per request
    const [searchData, setSearchData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('online');

    // New State for Brand View
    const [brandContext, setBrandContext] = useState(null);

    // Categories Menu State
    const [showCategories, setShowCategories] = useState(false);
    const categoryMenuRef = useRef(null);

    // Image/URL search states
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageFile, setImageFile] = useState(null);

    // API Base URL for production
    const API_BASE = import.meta.env.VITE_API_URL || '';

    // Close categories menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
                setShowCategories(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            setBrandContext(null);
            setSearched(true);
            handleSearch(null, 'text', null, '', categoryParam);
            return;
        }

        const targetQuery = initialQuery || searchParams.get('q');
        if (targetQuery) {
            setQuery(targetQuery);
            handleSearch(null, 'text', null, '', targetQuery);
        }
    }, [initialQuery, searchParams]);

    // Categories list for the dropdown
    const CATEGORIES = [
        'Clothing', 'Footwear', 'Handbags', 'Watches', 'Jewellery', 'Beauty',
        'Electronics', 'Home Decor', 'Kitchen', 'Sports', 'Toys', 'Books'
    ];

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
        setShowCategories(false); // Close menu if open

        if (mode === 'text' && !overrideQuery) {
            setActiveTab('online');
        }

        try {
            let response;
            // Removed location parameter from API call

            if (mode === 'text') {
                response = await axios.get(
                    `${API_BASE}/discovery/search?q=${encodeURIComponent(q)}`
                );
            } else if (mode === 'image') {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('location', 'Mumbai'); // Default if needed by backend, or remove if backend allows

                response = await axios.post(
                    `${API_BASE}/discovery/search-by-image`,
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
            } else if (mode === 'url') {
                response = await axios.post(
                    `${API_BASE}/discovery/search-by-url`,
                    null,
                    { params: { url: url, location: 'Mumbai' } }
                );
            }

            if (!response.data || (!response.data.results?.online?.length && !response.data.results?.local?.length)) {
                setError("No results found. Try a different query.");
                setSearchData(null);
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

    const handleCategoryClick = (cat) => {
        setQuery(cat);
        handleSearch(null, 'text', null, '', cat);
        setShowCategories(false);
    };

    const handleBrandClick = (brandName) => {
        setBrandContext(brandName);
        setSearched(true);
        setSearchData(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-4 md:gap-8">
                        {/* Logo */}
                        <div
                            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
                            onClick={() => {
                                setQuery('');
                                setSearched(false);
                                setBrandContext(null);
                                navigate('/search');
                            }}
                        >
                            <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                                K
                            </div>
                            <span className="text-xl font-bold text-gray-900 tracking-tight hidden md:block">KitneKa</span>
                        </div>

                        {/* All Categories Menu Trigger */}
                        <div className="relative" ref={categoryMenuRef}>
                            <button
                                onClick={() => setShowCategories(!showCategories)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Menu size={20} />
                                <span className="hidden md:block">All Categories</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${showCategories ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl relative group">
                            <form onSubmit={(e) => handleSearch(e, 'text')} className="relative z-10">
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search for products, brands and more"
                                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:bg-white"
                                    />
                                    <Search className="absolute left-4 text-gray-400" size={20} />

                                    {/* Image Search Trigger */}
                                    <label className="absolute right-3 p-1.5 text-gray-400 hover:text-blue-600 cursor-pointer hover:bg-blue-50 rounded-lg transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) handleSearch(null, 'image', e.target.files[0]);
                                            }}
                                        />
                                        <Camera size={20} />
                                    </label>
                                </div>
                            </form>
                        </div>

                        {/* User Actions */}
                        <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                            <button className="hidden md:flex flex-col items-center gap-0.5 group">
                                <User size={20} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-600">Sign In</span>
                            </button>
                            <button className="flex flex-col items-center gap-0.5 group relative">
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                                <Heart size={20} className="text-gray-600 group-hover:text-red-500 transition-colors" />
                                <span className="text-[10px] font-medium text-gray-500 hidden md:block group-hover:text-red-500">Wishlist</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SIDE DRAWER: All Categories */}
            {/* Backdrop */}
            {showCategories && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
                    onClick={() => setShowCategories(false)}
                />
            )}

            {/* Drawer Panel */}
            <div className={`fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${showCategories ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Drawer Header */}
                    <div className="p-5 bg-blue-600 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-lg">
                            <div className="bg-white/20 p-1.5 rounded">K</div>
                            KitneKa
                        </div>
                        <button
                            onClick={() => setShowCategories(false)}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Categories List */}
                    <div className="flex-1 overflow-y-auto py-2">
                        <div className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            Shop By Category
                        </div>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryClick(cat)}
                                className="w-full text-left px-5 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors flex items-center justify-between group"
                            >
                                {cat}
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400" />
                            </button>
                        ))}
                    </div>

                    {/* Drawer Footer */}
                    <div className="p-5 border-t border-gray-100 bg-gray-50">
                        <button className="flex items-center gap-2 text-gray-600 hover:text-black font-medium text-sm">
                            <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">?</span>
                            Help & Support
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="max-w-4xl mx-auto mt-6 px-4">
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3">
                        <X size={20} />
                        {error}
                    </div>
                </div>
            )}

            {/* MAIN CONTENT Area */}
            {searched ? (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-500 font-medium animate-pulse">Searching best prices for you...</p>
                        </div>
                    ) : brandContext ? (
                        <ResultsGrouped
                            context={brandContext}
                            type="BRAND"
                        />
                    ) : (
                        /* General Search Results Grid */
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Search Results {query && `for "${query}"`}
                                </h2>
                                <span className="text-sm text-gray-500">
                                    {searchData?.results?.online?.length || 0} items found
                                </span>
                            </div>

                            {searchData?.results?.online?.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {searchData.results.online.map((product) => (
                                        <div
                                            key={product.id || Math.random()}
                                            onClick={() => {
                                                const productId = product.id || `mock-${Date.now()}`;
                                                // Ensure standard data structure
                                                const productToSave = {
                                                    ...product,
                                                    id: productId,
                                                    competitors: product.competitors || []
                                                };
                                                localStorage.setItem(`product_shared_${productId}`, JSON.stringify(productToSave));
                                                // Navigate in same tab
                                                navigate(`/product/${productId}`);
                                            }}
                                            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all cursor-pointer group"
                                        >
                                            <div className="aspect-[3/4] bg-gray-50 rounded-lg mb-4 overflow-hidden relative">
                                                <img
                                                    src={product.image}
                                                    alt={product.title}
                                                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                                {product.rating > 4 && (
                                                    <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                                        ★ {product.rating}
                                                    </div>
                                                )}
                                                {product.source && (
                                                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        {product.source}
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                                                {product.title}
                                            </h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-lg font-bold text-gray-900">₹{product.price?.toLocaleString()}</span>
                                                {product.original_price && product.original_price > product.price && (
                                                    <span className="text-xs text-gray-400 line-through">₹{product.original_price.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                                    <p className="text-gray-500">Try checking your spelling or using different keywords.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                /* LANDING STATE: Featured Brands + Categories Cards */
                <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
                    <FeaturedBrands onBrandClick={handleBrandClick} />
                    <CategoryLabels onCategoryClick={handleCategoryClick} />
                </div>
            )}
        </div>
    );
};

export default SearchInterface;
