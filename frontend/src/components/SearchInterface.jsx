
import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, ArrowRight, Check, Plus, ChevronDown, Camera, X, Menu, ShoppingBag, User, Heart, ChevronRight, ShieldCheck, BadgeCheck, Leaf } from 'lucide-react';
import FeaturedBrands from './FeaturedBrands';
import CategoryLabels from './CategoryLabels';
import ResultsGrouped from './ResultsGrouped';
import RecommendationBanner from './RecommendationBanner';
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
    const drawerRef = useRef(null); // New ref for the side drawer

    // Image/URL search states
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageFile, setImageFile] = useState(null);

    // Trust & Categories State
    const [filterType, setFilterType] = useState('popular'); // 'popular' | 'all'
    const [cleanBeautyOnly, setCleanBeautyOnly] = useState(false); // Controlled by "Clean Beauty" Category Tile
    const [sortBy, setSortBy] = useState('relevance'); // 'relevance' | 'price_asc' | 'price_desc'

    // API Base URL for production
    const API_BASE = import.meta.env.VITE_API_URL || '';

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
            setQuery(targetQuery);
            handleSearch(null, 'text', null, '', targetQuery);
        }
    }, [initialQuery, searchParams]);

    // Categories list for the dropdown
    const CATEGORIES = [
        'Clothing', 'Footwear', 'Handbags', 'Watches', 'Jewellery', 'Beauty',
        'Electronics', 'Home Decor', 'Kitchen', 'Sports', 'Toys', 'Books'
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
            }
        } catch (err) {
            console.error("Search failed:", err);
            setError(`Search failed: ${err.message || "Unknown Error"}.`);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (cat) => {
        setShowCategories(false);
        navigate(`/search?category=${encodeURIComponent(cat)}`);
    };

    const handleBrandClick = (brandName, brandUrl) => {
        setBrandContext(brandName);
        setActiveTab('official'); // Default to Official Store tab
        setSearched(true);
        setSearchData(null);
        setError(null);

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
        // BRAND VIEW FILTERING
        if (brandContext) {
            if (activeTab === 'official') {
                return item.is_official;
            }
            if (activeTab === 'trusted') {
                // Show items that are NOT official but are trusted/popular
                // Or just show all non-official items
                return !item.is_official;
            }
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
    if (sortBy === 'price_asc') {
        sortedItems.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_desc') {
        sortedItems.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    // For 'relevance', we do NOT sort, preserving the server's sophisticated ranking (which acts like Popularity)

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
            <div
                ref={drawerRef}
                className={`fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${showCategories ? 'translate-x-0' : '-translate-x-full'}`}
            >
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

                            {/* RECOMMENDATION BANNER (New) */}
                            {/* RECOMMENDATION & INSIGHT BANNER */}
                            {/* Show if we have EITHER a specific pick OR an AI insight */}
                            {(searchData?.recommendation || searchData?.insight) && filterType === 'popular' && sortBy === 'relevance' && (
                                <RecommendationBanner
                                    recommendation={searchData.recommendation}
                                    insight={searchData.insight}
                                />
                            )}

                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Search Results {searchData?.query ? `for "${searchData.query.replace(/^https?:\/\/(www\.)?/, '').substring(0, 40)}${searchData.query.length > 40 ? '...' : ''}"` : query && `for "${query.replace(/^https?:\/\/(www\.)?/, '').substring(0, 40)}${query.length > 40 ? '...' : ''}"`}
                                </h2>
                                <span className="text-sm text-gray-500">
                                    {/* Counting Logic: If Brand Grid, count brands. Else items */}
                                    {searchData?.clean_brands?.length > 0 && !brandContext ?
                                        `${searchData.clean_brands.length} brands found` :
                                        `${filteredItems.length} items found`
                                    }
                                </span>
                            </div>

                            {/* Trust Filters: Popular / All / Clean Beauty - OR Brand View Tabs */}
                            {brandContext ? (
                                /* BRAND VIEW TABS */
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => setActiveTab('official')}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'official' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                        >
                                            Official Store
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('trusted')}
                                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'trusted' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                        >
                                            Trusted Partners
                                        </button>
                                    </div>

                                    {/* Sort (Optional in Brand View, keeping simple) */}
                                </div>
                            ) : (
                                /* STANDARD TABS */
                                (!searchData?.clean_brands || searchData.clean_brands.length === 0) && (
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                                        {/* Tabs */}
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

                                        {/* Sort By Control - High/Low removed as per request */}
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

                            {/* RESULTS GRID OR BRAND GRID */}
                            {(searchData?.clean_brands?.length > 0 && !brandContext) ? (
                                /* BRAND SELECTION GRID (Clean Beauty Category View) */
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {searchData.clean_brands.map((brand, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                // Extract simple name or use title
                                                // Logic: "Visit Old School Rituals Official Store" -> "Old School Rituals"
                                                let query = brand.title.replace('Visit ', '').replace(' Official Store', '');
                                                // Pass Brand Name AND Brand URL (brand.link or brand.url from registry)
                                                handleBrandClick(query, brand.link || brand.url);
                                            }}
                                            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-black hover:shadow-md transition-all cursor-pointer group flex flex-col gap-4"
                                        >
                                            <div className="aspect-[3/2] bg-gray-50 rounded-lg p-2 flex items-center justify-center">
                                                <img
                                                    src={brand.thumbnail || brand.image}
                                                    alt={brand.title}
                                                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-2">
                                                    {brand.is_official && (
                                                        <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                            Official
                                                        </span>
                                                    )}
                                                    {brand.is_clean_beauty && (
                                                        <span className="bg-stone-200 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                            Clean
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-black text-sm line-clamp-2">{brand.title}</h3>
                                                <div className="text-xs text-gray-500">{brand.source}</div>

                                                <button className="mt-2 w-full bg-gray-100 hover:bg-black hover:text-white text-black font-medium py-2 rounded-lg text-xs transition-colors">
                                                    View Products
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : sortedItems.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {sortedItems.map((product) => (
                                        <div
                                            key={product.id || Math.random()}
                                            onClick={() => {
                                                // INJECTED CARD LOGIC: Trigger Site Search
                                                if (product.is_injected_card) {
                                                    try {
                                                        const domain = new URL(product.url).hostname.replace(/^www\./, '');
                                                        const siteQuery = `site:${domain}`;
                                                        setQuery(siteQuery);
                                                        handleSearch(null, 'text', null, '', siteQuery);
                                                    } catch (e) {
                                                        console.error("Invalid URL in injected card", product.url);
                                                        window.open(product.url, '_blank');
                                                    }
                                                    return;
                                                }

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
                                            className={`bg-white rounded-xl border p-4 hover:shadow-lg transition-all cursor-pointer group relative ${product.is_injected_card ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'}`}
                                        >
                                            {/* Trust Badges on Card */}
                                            {/* Trust Badges on Card */}
                                            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                                                {product.is_official && (
                                                    <div className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 w-fit">
                                                        <BadgeCheck size={10} /> Official
                                                    </div>
                                                )}
                                                {product.is_clean_beauty && (
                                                    <div className="bg-green-100 text-green-700 border border-green-200 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 w-fit">
                                                        <Leaf size={10} /> Clean
                                                    </div>
                                                )}
                                            </div>

                                            {/* Wishlist Button */}
                                            <button
                                                className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-colors shadow-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Placeholder for wishlist logic
                                                    console.log("Add to wishlist:", product.title);
                                                }}
                                            >
                                                <Heart size={16} />
                                            </button>

                                            <div className="aspect-[3/4] bg-gray-50 rounded-lg mb-4 overflow-hidden relative">
                                                <img
                                                    src={product.image}
                                                    alt={product.title}
                                                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
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
                                    <h3 className="text-lg font-medium text-gray-900">No matching results</h3>
                                    <p className="text-gray-500">Try switching to "All Results" or turning off filters.</p>
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
