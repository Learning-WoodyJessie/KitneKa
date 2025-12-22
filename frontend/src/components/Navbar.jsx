
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Menu, ShoppingBag, User, Heart, ChevronDown } from 'lucide-react';

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
        { name: 'Women', path: '/?q=Women+Fashion' },
        { name: 'Men', path: '/?q=Men+Fashion' },
        { name: 'Fashion', path: '/?q=Fashion' },
        { name: 'Health', path: '/?q=Health+Products' },
        { name: 'Beauty', path: '/?q=Beauty+Products' },
        { name: 'Electronics', path: '/?q=Electronics' },
        { name: 'Home', path: '/?q=Home+Decor' },
    ];

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50 font-sans">
            {/* TOP ROW: Logo, Search, Actions */}
            <div className="border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center gap-8 justify-between">

                    {/* LOGO */}
                    <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:shadow-blue-200 transition-all">
                            K
                        </div>
                        <span className="text-2xl font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors">
                            KitneKa
                        </span>
                    </Link>

                    {/* SEARCH BAR (CENTER) */}
                    <div className="flex-1 max-w-2xl hidden md:block">
                        <form onSubmit={handleSearch} className="relative group">
                            <input
                                type="text"
                                className="w-full pl-5 pr-14 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-base rounded-full focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm group-hover:shadow-md"
                                placeholder="Search for products, brands, or categories..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1.5 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Search size={20} />
                            </button>
                        </form>
                    </div>

                    {/* RIGHT ACTIONS */}
                    <div className="flex items-center gap-6">
                        <Link to="/login" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium">
                            <User size={20} />
                            <span className="hidden lg:inline">Sign In</span>
                        </Link>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium relative">
                            <Heart size={20} />
                            <span className="hidden lg:inline">Wishlist</span>
                        </button>
                    </div>

                    {/* MOBILE MENU */}
                    <div className="md:hidden">
                        <button className="p-2 text-gray-600">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW: Categories */}
            <div className="bg-white hidden md:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center gap-8 h-12 overflow-x-auto">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mr-4 cursor-pointer hover:text-blue-600">
                            <Menu size={16} />
                            <span>All Categories</span>
                        </div>
                        {categories.map((cat) => (
                            <Link
                                key={cat.name}
                                to={cat.path}
                                className="text-sm font-medium text-gray-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-600 h-full flex items-center transition-colors px-1"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            {/* MOBILE SEARCH (Visible only on mobile below header) */}
            <div className="md:hidden p-4 bg-white border-b border-gray-100">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                        placeholder="Search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </form>
            </div>
        </header>
    );
};

export default Navbar;
