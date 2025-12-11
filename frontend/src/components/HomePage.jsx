import React, { useState } from 'react';
import { Search, ChevronRight, Smartphone, Laptop, Tv, Shirt } from 'lucide-react';
import SeasonalityWidget from '../components/SeasonalityWidget';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-slate-900 py-16 sm:py-24">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-8">
                        Shop Smart. <span className="text-blue-400">Save More.</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-gray-300 mb-10">
                        Compare prices across Amazon, Flipkart, & local stores instantly.
                        Track price price history and get seasonal buying advice.
                    </p>

                    <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative group">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-16 pr-6 py-5 rounded-full text-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all shadow-xl"
                            placeholder="Search for 'iPhone 15', 'Sony TV', or paste a product URL..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-full font-semibold transition-colors shadow-lg"
                        >
                            Search
                        </button>
                    </form>

                    {/* Quick chips */}
                    <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-gray-400">
                        <span>Trending:</span>
                        <button className="hover:text-white underline decoration-blue-500 decoration-2 underline-offset-4">iPhone 15</button>
                        <button className="hover:text-white underline decoration-pink-500 decoration-2 underline-offset-4">Sony WH-1000XM5</button>
                        <button className="hover:text-white underline decoration-green-500 decoration-2 underline-offset-4">Air Jordans</button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-16 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Seasonality Widget */}
                <div className="lg:col-span-1">
                    <SeasonalityWidget />
                </div>

                {/* Categories */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Explore Categories</h2>
                        <a href="#" className="text-blue-600 text-sm font-medium flex items-center hover:underline">
                            View All <ChevronRight size={16} />
                        </a>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        {[
                            { name: 'Mobiles', icon: Smartphone, color: 'bg-blue-100 text-blue-600' },
                            { name: 'Laptops', icon: Laptop, color: 'bg-purple-100 text-purple-600' },
                            { name: 'TV & Appliances', icon: Tv, color: 'bg-green-100 text-green-600' },
                            { name: 'Fashion', icon: Shirt, color: 'bg-pink-100 text-pink-600' },
                        ].map((cat) => (
                            <div key={cat.name} className="flex flex-col items-center group cursor-pointer">
                                <div className={`w-16 h-16 ${cat.color} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                    <cat.icon size={28} />
                                </div>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{cat.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Just Launched Section (Placeholder for now) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Just Launched</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Mock Items */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group">
                            <div className="h-48 bg-gray-100 relative">
                                {/* Placeholder Image */}
                                <img src={`https://placehold.co/400x300?text=Product+${i}`} className="w-full h-full object-cover mix-blend-multiply" alt="Product" />
                            </div>
                            <div className="p-4">
                                <div className="text-xs font-semibold text-blue-600 mb-1">New Arrival</div>
                                <h3 className="font-bold text-gray-900 mb-2 truncate">Premium Product Name {i}</h3>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-lg">₹{(10000 * i).toLocaleString()}</span>
                                    <button className="text-sm border border-gray-200 px-3 py-1 rounded-full group-hover:bg-gray-900 group-hover:text-white transition-colors">View</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
