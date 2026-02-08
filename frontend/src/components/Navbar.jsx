
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Search, Menu, ShoppingBag, User, Bell, ArrowRight } from 'lucide-react';

const Navbar = () => {
    const [query, setQuery] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();

    // Sync local state with URL param on mount/update
    React.useEffect(() => {
        const q = searchParams.get('q');
        if (q) setQuery(q);
        setIsMenuOpen(false); // Close menu on route change
    }, [searchParams, location.pathname]);

    const isSearchPage = location.pathname === '/search';

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
            setIsMenuOpen(false);
        }
    };

    const categories = [
        { name: 'Clothing', path: '/search?q=Women+Clothing' },
        { name: 'Footwear', path: '/search?q=Women+Footwear' },
        { name: 'Handbags', path: '/search?q=Handbags' },
        { name: 'Watches', path: '/search?q=Watches+for+Women' },
        { name: 'Jewellery', path: '/search?q=Jewellery+Sets' },
        { name: 'Beauty', path: '/search?q=Beauty+Products' },
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

    return (
        <header className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] sticky top-0 z-50 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 md:h-20 gap-4">

                    {/* --- MOBILE: LEFT MENU --- */}
                    <div className="md:hidden">
                        <button
                            className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                    </div>

                    {/* --- LOGO (Centers on Mobile, Left on Desktop) --- */}
                    <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
                        <div className="hidden md:flex w-10 h-10 bg-black rounded-xl items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-105 transition-all">
                            K
                        </div>
                        <span className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight group-hover:text-black transition-colors">
                            KitneKa
                        </span>
                    </Link>

                    {/* --- MOBILE: RIGHT BELL --- */}
                    <div className="md:hidden">
                        <button className="p-2 -mr-2 text-gray-700 relative">
                            <Bell size={24} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        </button>
                    </div>

                    {/* --- DESKTOP: SEARCH BAR (Hidden on Search Page) --- */}
                    {!isSearchPage && (
                        <div className="flex-1 max-w-2xl hidden md:block px-8">
                            <form onSubmit={handleSearch} className="relative group">
                                <input
                                    type="text"
                                    className="w-full pl-5 pr-14 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-full focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm group-hover:shadow-md"
                                    placeholder="Search for products, brands, or categories..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="absolute right-1 top-1 p-1.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-sm"
                                >
                                    <Search size={18} />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* --- DESKTOP: ACTIONS --- */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/login" className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors font-medium text-sm">
                            <User size={20} />
                            <span className="hidden lg:inline">Sign In</span>
                        </Link>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors font-medium relative text-sm">
                            <ShoppingBag size={20} />
                            <span className="hidden lg:inline">Wishlist</span>
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">0</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- DESKTOP: CATEGORIES ROW --- */}
            <div className="hidden md:block border-t border-gray-100 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center gap-8 h-12 overflow-x-auto no-scrollbar">
                        <div
                            className="flex items-center gap-2 text-sm font-bold text-gray-900 mr-4 cursor-pointer hover:text-black"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            <Menu size={16} />
                            <span>All Categories</span>
                        </div>
                        {categories.map((cat) => (
                            <Link
                                key={cat.name}
                                to={cat.path}
                                className="text-sm font-medium text-gray-600 hover:text-black hover:border-b-2 hover:border-black h-full flex items-center transition-colors px-1 whitespace-nowrap"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            {/* --- SIDE DRAWER --- */}
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-[70] shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out">
                        {/* Header */}
                        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Browse</h2>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Search (Mobile Only in Drawer) */}
                        <div className="p-6 pb-2 md:hidden">
                            <form onSubmit={handleSearch} className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    placeholder="Search products..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </form>
                        </div>

                        {/* Categories Section */}
                        <div className="px-6 py-6 border-b border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Categories</h3>
                            <div className="space-y-4">
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.name}
                                        to={cat.path}
                                        className="flex items-center justify-between text-gray-700 hover:text-black font-medium transition-colors group"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {cat.name}
                                        <ArrowRight className="text-gray-300 group-hover:text-black transition-colors" size={16} />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Featured Brands Section */}
                        <div className="px-6 py-6 mb-20">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Featured Brands</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {FEATURED_BRANDS.map((brand) => (
                                    <div
                                        key={brand.id}
                                        onClick={() => {
                                            // Using window.location.href or navigate depending on desired behavior
                                            // SearchPage usually handles URL params, so navigate is better for SPA
                                            navigate(`/search?brand=${encodeURIComponent(brand.name)}`);
                                            setIsMenuOpen(false);
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

                        {/* Footer Links */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gray-50 p-6 border-t border-gray-100 flex justify-between text-xs font-medium text-gray-500">
                            <Link to="/login">Sign In</Link>
                            <Link to="/help">Help/Support</Link>
                        </div>
                    </div>
                </>
            )}
        </header>
    );
};

export default Navbar;
