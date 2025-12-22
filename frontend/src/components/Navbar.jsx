
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Menu, ShoppingBag, User, Bell } from 'lucide-react';

const Navbar = () => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Sync local state with URL param on mount/update
    React.useEffect(() => {
        const q = searchParams.get('q');
        if (q) setQuery(q);
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/?q=${encodeURIComponent(query)}`);
        }
    };

    const categories = [
        { name: 'Clothing', path: '/?q=Women+Clothing' },
        { name: 'Footwear', path: '/?q=Women+Footwear' },
        { name: 'Handbags', path: '/?q=Handbags' },
        { name: 'Watches', path: '/?q=Watches+for+Women' },
        { name: 'Jewellery', path: '/?q=Jewellery+Sets' },
        { name: 'Beauty', path: '/?q=Beauty+Products' },
    ];

    return (
        <header className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] sticky top-0 z-50 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 md:h-20 gap-4">

                    {/* --- MOBILE: LEFT MENU --- */}
                    <div className="md:hidden">
                        <button className="p-2 -ml-2 text-gray-700">
                            <Menu size={24} />
                        </button>
                    </div>

                    {/* --- LOGO (Centers on Mobile, Left on Desktop) --- */}
                    <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
                        <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:shadow-blue-200 transition-all">
                            K
                        </div>
                        <span className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
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

                    {/* --- DESKTOP: SEARCH BAR --- */}
                    <div className="flex-1 max-w-2xl hidden md:block px-8">
                        <form onSubmit={handleSearch} className="relative group">
                            <input
                                type="text"
                                className="w-full pl-5 pr-14 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-full focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm group-hover:shadow-md"
                                placeholder="Search for products, brands, or categories..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="absolute right-1 top-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Search size={18} />
                            </button>
                        </form>
                    </div>

                    {/* --- DESKTOP: ACTIONS --- */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/login" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm">
                            <User size={20} />
                            <span className="hidden lg:inline">Sign In</span>
                        </Link>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium relative text-sm">
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
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mr-4 cursor-pointer hover:text-blue-600">
                            <Menu size={16} />
                            <span>All Categories</span>
                        </div>
                        {categories.map((cat) => (
                            <Link
                                key={cat.name}
                                to={cat.path}
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-600 h-full flex items-center transition-colors px-1 whitespace-nowrap"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
