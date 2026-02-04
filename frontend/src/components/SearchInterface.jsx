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

                        {/* All Categories Menu */}
                        <div className="relative" ref={categoryMenuRef}>
                            <button
                                onClick={() => setShowCategories(!showCategories)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${showCategories ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <Menu size={18} />
                                <span className="hidden md:inline">All Categories</span>
                                <ChevronDown size={16} className={`transition-transform duration-200 ${showCategories ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown */}
                            {showCategories && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 gap-1">
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => handleCategoryClick(cat)}
                                                className="text-left px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium transition-colors"
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                placeholder="Search for products, brands, or categories..."
                                className="block w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder-gray-400 font-medium"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* User Actions */}
                        <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors">
                                <User size={20} />
                                <span className="hidden lg:inline">Sign In</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors relative">
                                <Heart size={20} />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                <span className="hidden lg:inline">Wishlist</span>
                            </button>
                        </div>
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
                    ) : (
                        <ResultsGrouped
                            data={searchData}
                            brandContext={brandContext}
                            onBrandChange={setBrandContext}
                        />
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
