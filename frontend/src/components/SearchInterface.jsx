
import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, ArrowRight, Check, Plus, ChevronDown, Camera, X, Menu, ShoppingBag, User, Heart, ChevronRight, ShieldCheck, BadgeCheck, Leaf, ExternalLink, ThumbsUp, ThumbsDown, Layers, Eye } from 'lucide-react';
import FeaturedBrands from './FeaturedBrands';

import CategoryLabels from './CategoryLabels';
import RecommendationBanner from './RecommendationBanner';
import Loader from './Loader';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../config';

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
    const [activeBrandData, setActiveBrandData] = useState(null);

    // Categories Menu State
    const [showCategories, setShowCategories] = useState(false);
    const categoryMenuRef = useRef(null);
    const drawerRef = useRef(null); // New ref for the side drawer
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [priceRange, setPriceRange] = useState([0, 50000]);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [selectedStores, setSelectedStores] = useState([]);

    // Image/URL search states
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageFile, setImageFile] = useState(null);

    // Trust & Categories State
    const [filterType, setFilterType] = useState('popular'); // 'popular' | 'all'
    const [cleanBeautyOnly, setCleanBeautyOnly] = useState(false); // Controlled by "Clean Beauty" Category Tile
    const [sortBy, setSortBy] = useState('relevance'); // 'relevance' | 'price_asc' | 'price_desc'

    // Close categories menu when clicking outside

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside BOTH the trigger button and the drawer itself
            if (
                categoryMenuRef.current &&
                !categoryMenuRef.current.contains(event.target) &&
                drawerRef.current &&
                !drawerRef.current.contains(event.target)
            ) {
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
            setQuery(brandParam); // Ensure query state matches
            handleSearch(null, 'text', null, '', brandParam);
            return;
        }

        if (categoryParam) {
            setQuery(categoryParam);
            setBrandContext(null);
            setSearched(true);

            // Auto-enable Clean Beauty filter if selected
            if (categoryParam === 'Clean Beauty') {
                setCleanBeautyOnly(true);
            } else {
                setCleanBeautyOnly(false);
            }

            handleSearch(null, 'text', null, '', categoryParam);
            return;
        }

        const targetQuery = initialQuery || searchParams.get('q');
        if (targetQuery) {
            // User Feedback: Only show text in search bar if it looks like a URL
            // Otherwise, keep it clean for brand/category searches
            const isUrl = /^(http|www\.)/i.test(targetQuery);
            if (isUrl) {
                setQuery(targetQuery);
            } else {
                setQuery(''); // Clean aesthetics
            }
            handleSearch(null, 'text', null, '', targetQuery);
        }
    }, [initialQuery, searchParams]);

    // Categories list for the dropdown
    const CATEGORIES = [
        { name: "Women's Wear", path: '/search?q=Women+Clothing' },
        { name: "Men's Wear", path: '/search?q=Men+Clothing' },
        { name: 'Kidswear', path: '/search?q=Kids+Clothing' },
        { name: 'Sportswear', path: '/search?q=Sportswear' },
        { name: 'Footwear', path: '/search?q=Women+Footwear' },
        { name: 'Handbags', path: '/search?q=Handbags' },
        { name: 'Watches', path: '/search?q=Watches+for+Women' },
        { name: 'Jewellery', path: '/search?q=Jewellery+Sets' },
        { name: 'Beauty', path: '/search?q=Beauty+Products' },
        { name: 'Clean Beauty', path: '/search?category=Clean+Beauty' },
    ];

    const FEATURED_BRANDS = [
        { id: 'fav_1', name: 'FabIndia', logo: 'https://logo.clearbit.com/fabindia.com', tag: 'Ethnic' },
        { id: 'fav_2', name: 'Manyavar', logo: 'https://logo.clearbit.com/manyavar.com', tag: 'Celebrations' },
        { id: 'fav_3', name: 'Biba', logo: 'https://logo.clearbit.com/biba.in', tag: 'Trending' },
        { id: 'fav_4', name: 'Raymond', logo: 'https://logo.clearbit.com/raymond.in', tag: 'Premium' },
        { id: 'fav_5', name: 'Titan', logo: 'https://logo.clearbit.com/titan.co.in', tag: 'Timeless' },
        { id: 'fav_6', name: 'Nike', logo: 'https://logo.clearbit.com/nike.com', tag: 'Sport' },
        { id: 'fav_7', name: 'Adidas', logo: 'https://logo.clearbit.com/adidas.co.in', tag: 'Active' },
        { id: 'fav_8', name: 'H&M', logo: 'https://logo.clearbit.com/hm.com', tag: 'Fashion' },
        { id: 'fav_9', name: 'Zara', logo: 'https://logo.clearbit.com/zara.com', tag: 'Chic' },
        { id: 'fav_10', name: 'Puma', logo: 'https://logo.clearbit.com/puma.com', tag: 'Fast' },
        { id: 'fav_11', name: 'Lakme', logo: 'https://logo.clearbit.com/lakmeindia.com', tag: 'Beauty' },
        { id: 'fav_12', name: 'Sephora', logo: 'https://logo.clearbit.com/sephora.com', tag: 'Luxury' },
    ];

    const handleSearch = async (e, mode = 'text', file = null, url = '', overrideQuery = null, preserveContext = false) => {
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
        if (!preserveContext) {
            setBrandContext(null); // Reset brand context ONLY if not explicitly preserving it (e.g. drilling down)
        }
        setShowCategories(false); // Close menu if open

        if (mode === 'text' && !overrideQuery) {
            setActiveTab('online');
            // Reset filters on new search
            setFilterType('popular');
            setCleanBeautyOnly(false);
            // Update URL to match search if not overridden (optional, but good for history)
            navigate(`/search?q=${encodeURIComponent(q)}`, { replace: true });
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

                // RESTORE BRAND DATA ON DIRECT NAV (Hero Banner Fix)
                if (response.data.clean_brands && response.data.clean_brands.length > 0) {
                    const searchedBrand = overrideQuery || q;
                    if (searchedBrand) {
                        const match = response.data.clean_brands.find(b =>
                            b.title.toLowerCase().includes(searchedBrand.toLowerCase()) ||
                            b.source.toLowerCase().includes(searchedBrand.toLowerCase())
                        );
                        if (match) {
                            setActiveBrandData(match);
                            // If we found a match, ensure context is locked
                            if (!brandContext) setBrandContext(match.title.replace('Visit ', '').replace(' Official Store', ''));
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Search failed:", err);
            setError(`Search failed: ${err.message || "Unknown Error"}.`);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (input) => {
        setShowCategories(false);
        if (input.startsWith('/')) {
            navigate(input);
        } else {
            navigate(`/search?category=${encodeURIComponent(input)}`);
        }
    };

    const handleBrandClick = (brand) => {
        // Support both direct object or (name, url) for legacy calls
        const brandName = brand.title ? brand.title.replace('Visit ', '').replace(' Official Store', '') : brand;
        const brandUrl = brand.link || brand.url;

        setBrandContext(brandName);
        setActiveBrandData(brand.title ? brand : null); // Store full metadata if available
        setActiveTab('all'); // MERGED VIEW: Default to showing everything
        setSearched(true);
        setSearchData(null);
        setError(null);
        setQuery(''); // CLEAR SEARCH BOX: As per user request, don't show search text

        if (brandUrl) {
            // User Request: Use same logic as "Search be URL"
            handleSearch(null, 'url', null, brandUrl, null, true);
        } else {
            // Fallback to text search if no URL (unlikely for registry brands)
            handleSearch(null, 'text', null, '', brandName, true);
        }
    };

    // Filter Logic
    const allItems = searchData?.results?.online || [];
    const filteredItems = allItems.filter(item => {
        // ... (rest of filtering logic) ...
        // BRAND VIEW FILTERING
        if (brandContext) {
            // MERGED VIEW: Show ALL items (Official + Trusted)
            // We trust the backend/search to be relevant to the brandContext
            return true;
        }

        // STANDARD FILTERING
        // 1. Clean Beauty Filter
        if (cleanBeautyOnly) {
            if (!item.is_clean_beauty) return false;
            // STRICT REQUIREMENT: Must be Official Site OR Trusted Store
            if (!item.is_official && !item.is_popular) return false;
        }

        // 2. Tab Filter
        if (filterType === 'popular') {
            // Show if Popular OR Official (Clean Beauty alone is no longer enough to be "Popular" if the store is untrusted)
            return item.is_popular || item.is_official;
        }
        return true; // 'all' shows everything
    });

    // Sorting Logic
    let sortedItems = [...filteredItems];

    // BRAND VIEW DEFAULT SORT: Price Low to High (as requested)
    if (brandContext) {
        sortedItems.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_asc') {
        sortedItems.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_desc') {
        sortedItems.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    // For 'relevance', we do NOT sort, preserving the server's sophisticated ranking (which acts like Popularity)

    const handleProductClick = (product) => {
        // Save to history/context to avoid 404 on next page for scraped items
        if (product && product.id) {
            localStorage.setItem(`product_shared_${product.id}`, JSON.stringify(product));
            navigate(`/product/${product.id}`);
        }
    };

    // Helper to render Product Grid
    const renderGrid = (items) => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, idx) => (
                <div
                    key={`${item.id}-${idx}`}
                    onClick={() => handleProductClick(item)}
                    className="group relative bg-white rounded-2xl border border-gray-100 hover:border-black/10 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                    {/* Image */}
                    <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                        />

                        {/* BADGES - Top Left */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {/* Official Store Badge */}
                            {/* Official Store Badge */}
                            {(item.is_official || item.source === 'Official Site') && (
                                <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                                    <BadgeCheck size={12} className="text-white" />
                                    <span>Official</span>
                                </div>
                            )}

                            {/* Exact Match Badge (Model Match) */}
                            {item.match_classification === 'EXACT_MATCH' && !item.is_official && (
                                <div className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                                    <Check size={12} className="text-white" />
                                    <span>Top Match</span>
                                </div>
                            )}

                            {/* Variant Badge */}
                            {item.match_classification === 'VARIANT_MATCH' && (
                                <div className="bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                                    <Layers size={12} className="text-white" />
                                    <span>Variant</span>
                                </div>
                            )}


                        </div>

                        {/* Action Buttons - Top Right */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                            {/* Favorite */}
                            <button
                                className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Add to wishlist logic here
                                }}
                            >
                                <Heart size={16} />
                            </button>

                            {/* Like */}
                            <button
                                className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-green-500 hover:bg-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Like logic here
                                }}
                            >
                                <ThumbsUp size={16} />
                            </button>

                            {/* Dislike */}
                            <button
                                className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-gray-900 hover:bg-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Dislike logic here
                                }}
                            >
                                <ThumbsDown size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.source}</span>

                        </div>

                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5em] mb-2 group-hover:text-black">
                            {item.title}
                        </h3>

                        <div className="flex items-baseline gap-2">
                            <span className="text-base font-bold text-gray-900">₹{item.price?.toLocaleString()}</span>
                            {item.original_price && item.original_price > item.price && (
                                <span className="text-xs text-gray-400 line-through">₹{item.original_price?.toLocaleString()}</span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20">
            {/* GLOBAL LOADER */}
            {loading && <Loader message={brandContext ? `Finding best prices for ${brandContext}...` : "Searching across verified stores..."} />}

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
            <div
                ref={drawerRef}
                className={`fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${showCategories ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Drawer Header */}
                    <div className="p-5 bg-black text-white flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-lg">
                            <div className="bg-white/20 p-1.5 rounded-lg">K</div>
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
                                key={cat.name}
                                onClick={() => handleCategoryClick(cat.path)}
                                className="w-full text-left px-5 py-3 text-gray-700 hover:bg-gray-50 hover:text-black font-medium transition-colors flex items-center justify-between group"
                            >
                                {cat.name}
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-black" />
                            </button>
                        ))}

                        {/* Featured Brands Section (Synced with Navbar) */}
                        <div className="px-5 py-6 mb-20">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Featured Brands</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {FEATURED_BRANDS.map((brand) => (
                                    <div
                                        key={brand.id}
                                        onClick={() => {
                                            handleBrandClick({ title: brand.name, link: null }); // Use handleBrandClick for consistency
                                            setShowCategories(false);
                                        }}
                                        className="flex flex-col items-center gap-2 cursor-pointer group"
                                    >
                                        <div className="w-16 h-16 rounded-full border border-gray-100 bg-white flex items-center justify-center p-2 shadow-sm group-hover:border-black transition-all overflow-hidden">
                                            <img
                                                src={brand.logo}
                                                alt={brand.name}
                                                className="w-full h-full object-contain mix-blend-multiply"
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${brand.name}&background=random`
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-center text-gray-600 group-hover:text-black truncate w-full">
                                            {brand.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
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
                        /* LOADING STATE */
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                            {/* DESKTOP SIDEBAR */}
                            <div className="hidden lg:block lg:col-span-3 space-y-8 sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto pr-4 scrollbar-hide">
                                {/* Price Range */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Price Range</h3>
                                    <div className="px-2">
                                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                            <span>₹{priceRange[0]}</span>
                                            <span>₹{priceRange[1]}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50000"
                                            step="100"
                                            value={priceRange[1]}
                                            onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                                        />
                                    </div>
                                </div>

                                {/* Availability Toggle */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">In Stock Only</span>
                                    <button
                                        onClick={() => setInStockOnly(!inStockOnly)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${inStockOnly ? 'bg-black' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${inStockOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {/* Marketplaces */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Stores</h3>
                                    <div className="space-y-2">
                                        {['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Nykaa', 'Tata Cliq'].map(store => (
                                            <label key={store} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedStores.includes(store) ? 'bg-black border-black text-white' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                                    {selectedStores.includes(store) && <Check size={12} />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={selectedStores.includes(store)}
                                                    onChange={() => {
                                                        setSelectedStores(prev =>
                                                            prev.includes(store)
                                                                ? prev.filter(s => s !== store)
                                                                : [...prev, store]
                                                        );
                                                    }}
                                                />
                                                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{store}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RESULTS AREA */}
                            <div className="col-span-12 lg:col-span-9">
                                {/* Top Bar: Count & Sort */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {brandContext ? brandContext : (searched ? 'Search Results' : 'Top Picks')}
                                        </h2>
                                        <span className="text-sm text-gray-500 font-medium">({filteredItems.length} items)</span>
                                    </div>

                                    {/* Trust Filters: Popular / All / Clean Beauty - OR Brand View Tabs */}
                                    {brandContext ? (
                                        /* BRAND RESULTS header */
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                                                    <img
                                                        src={activeBrandData?.image || ''}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="font-semibold text-gray-900 truncate">{brandContext}</span>
                                                    {(activeBrandData?.link || activeBrandData?.url) && (
                                                        <a
                                                            href={activeBrandData.link || activeBrandData.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 shrink-0"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            Official site <ExternalLink size={12} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* STANDARD TABS */
                                        (!searchData?.clean_brands || searchData.clean_brands.length === 0) && (
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                                    <button
                                                        onClick={() => {
                                                            setFilterType('popular');
                                                            setSortBy('relevance');
                                                        }}
                                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'popular' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                                    >
                                                        Popular & Trusted
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setFilterType('all');
                                                            setSortBy('price_asc');
                                                        }}
                                                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterType === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                                    >
                                                        All Results
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">Sort by:</span>
                                                    <select
                                                        value={sortBy}
                                                        onChange={(e) => setSortBy(e.target.value)}
                                                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                                                    >
                                                        <option value="relevance">Popularity</option>
                                                        <option value="price_asc">Price: Low to High</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* BRAND SELECTION GRID REMOVED PER USER REQUEST */}

                                {/* RESULTS GRID */}
                                {(() => {
                                    // HYBRID MATCHING UI LOGIC
                                    const results = searchData?.results || {};
                                    const hasHybridData = results.exact_matches || results.variant_matches;

                                    let exactMatches = results.exact_matches || [];
                                    let variantMatches = results.variant_matches || [];
                                    const similarMatches = results.similar_matches || sortedItems;

                                    // If no hybrid data (e.g. brand search), render everything as before
                                    if (!hasHybridData && !searched) {
                                        if (sortedItems.length === 0) return emptyState();
                                        return renderGrid(sortedItems);
                                    }

                                    // Empty State Check
                                    if (exactMatches.length === 0 && variantMatches.length === 0 && similarMatches.length === 0) {
                                        return emptyState();
                                    }

                                    return (
                                        <div className="space-y-12">
                                            {/* 1. EXACT MATCHES */}
                                            {exactMatches.length > 0 && (
                                                <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100">
                                                    <h3 className="text-sm font-bold text-green-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <BadgeCheck size={18} className="text-green-600" />
                                                        Top Match (Verified)
                                                    </h3>
                                                    {renderGrid(exactMatches)}
                                                </div>
                                            )}

                                            {/* 2. VARIANTS */}
                                            {variantMatches.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <Layers size={18} className="text-blue-500" />
                                                        Other Sizes & Variants
                                                    </h3>
                                                    {renderGrid(variantMatches)}
                                                </div>
                                            )}

                                            {/* 3. SIMILAR PRODUCTS */}
                                            {similarMatches.length > 0 && (
                                                <div>
                                                    {(exactMatches.length > 0 || variantMatches.length > 0) && (
                                                        <div className="flex items-center gap-4 my-8">
                                                            <div className="h-px bg-gray-200 flex-1"></div>
                                                            <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Similar Products</span>
                                                            <div className="h-px bg-gray-200 flex-1"></div>
                                                        </div>
                                                    )}
                                                    {renderGrid(similarMatches)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
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

            {/* Mobile Drawer */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
                    <div className="absolute top-0 right-0 w-[80%] max-w-sm h-full bg-white shadow-2xl overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>
                            {/* Re-use Sidebar Content for Mobile */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for Empty State
const emptyState = () => (
    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No matching results</h3>
        <p className="text-gray-500">Try switching to "All Results" or turning off filters.</p>
    </div>
);

export default SearchInterface;
