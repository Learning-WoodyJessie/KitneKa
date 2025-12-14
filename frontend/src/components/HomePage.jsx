import React, { useState } from 'react';
import { Search } from 'lucide-react';
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
                        <span>Popular Searches:</span>
                        <button className="hover:text-white underline decoration-blue-500 decoration-2 underline-offset-4">iPhone 15</button>
                        <button className="hover:text-white underline decoration-pink-500 decoration-2 underline-offset-4">Sony WH-1000XM5</button>
                        <button className="hover:text-white underline decoration-green-500 decoration-2 underline-offset-4">Air Jordans</button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <SeasonalityWidget />
            </div>
        </div>
    );
};

export default HomePage;
