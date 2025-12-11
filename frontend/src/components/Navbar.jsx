import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Menu } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            B
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            BharatPricing
                        </span>
                    </Link>

                    {/* Desktop Search (Hidden on mobile, visible on inner pages if needed, but for now we keep it simple) */}
                    <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
                        {/* Placeholder for global search if not on home */}
                    </div>

                    {/* Right Links */}
                    <div className="flex items-center gap-6">
                        <Link to="/categories" className="text-gray-600 hover:text-blue-600 font-medium text-sm">Target</Link>
                        <Link to="/deals" className="text-gray-600 hover:text-blue-600 font-medium text-sm">Deals</Link>
                        <Link to="/login" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                            Sign In
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button className="text-gray-600 hover:text-gray-900">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
