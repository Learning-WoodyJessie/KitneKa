import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '';

const CATEGORIES_TO_FETCH = [
    "Women's Wear",
    "Men's Wear",
    "Kids Wear",
    "Footwear",
    "Beauty",
    "Accessories" // Reduced count to avoid rate limits
];

// Ranking Utility
const rankResults = (items) => {
    if (!items || items.length === 0) return [];

    // Deduplicate by ID and Title
    const seen = new Set();
    const uniqueItems = items.filter(item => {
        const key = item.id + item.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Score = (Rating * log(Reviews + 1)) 
    // If no rating, assume score 0
    return uniqueItems.sort((a, b) => {
        const scoreA = (parseFloat(a.rating) || 0) * Math.log((parseInt(a.reviews) || 0) + 1);
        const scoreB = (parseFloat(b.rating) || 0) * Math.log((parseInt(b.reviews) || 0) + 1);
        return scoreB - scoreA;
    });
};

const ResultsGrouped = ({ context, type = 'BRAND' }) => { // type: 'BRAND' or 'CATEGORY'
    const [results, setResults] = useState({}); // { "Women's Wear": [items...] }
    const [loading, setLoading] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        // Reset state on new context
        setResults({});
        setLoading({});

        // If type is BRAND, we fetch for multiple categories
        if (type === 'BRAND') {
            CATEGORIES_TO_FETCH.forEach(cat => {
                fetchCategoryForBrand(context, cat);
            });
        } else {
            // For generic category view, handled by parent usually, but implemented here if needed
            // If this component is reused for single category view
        }
    }, [context, type]);

    const fetchCategoryForBrand = async (brand, category) => {
        setLoading(prev => ({ ...prev, [category]: true }));
        try {
            const query = `${brand} ${category}`;
            const response = await axios.get(`${API_BASE}/discovery/search`, {
                params: { q: query, location: 'Mumbai' } // Default location
            });

            const rawOnline = response.data?.results?.online || [];
            // Apply Client-side Ranking
            const ranked = rankResults(rawOnline).slice(0, 15);

            setResults(prev => ({
                ...prev,
                [category]: ranked
            }));

        } catch (err) {
            console.error(`Failed to fetch ${category} for ${brand}`, err);
        } finally {
            setLoading(prev => ({ ...prev, [category]: false }));
        }
    };

    const handleProductClick = (product) => {
        // Same logic as SearchInterface - simplified here, ideally shared utility
        const productId = product.id;
        localStorage.setItem(`product_shared_${productId}`, JSON.stringify(product));
        window.open(`/product/${productId}`, '_blank');
    };

    const handleViewAll = (category) => {
        // Navigate to full search results for that specific query
        const query = `${context} ${category}`;
        // We can trigger a new search in the parent via URL or callback
        // For now, let's just reload with that query string
        window.location.href = `/?q=${encodeURIComponent(query)}`;
    };

    return (
        <div className="space-y-12 pb-24">
            <div className="px-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    {type === 'BRAND' ? `Top Picks from ${context}` : context}
                </h1>
                <p className="text-gray-500 mt-2">Explore the best rated items across categories.</p>
            </div>

            {CATEGORIES_TO_FETCH.map((category) => {
                const isLoading = loading[category];
                const items = results[category];

                // Don't show empty sections if finished loading
                if (!isLoading && (!items || items.length === 0)) return null;

                return (
                    <div key={category} className="space-y-4">
                        <div className="flex items-center justify-between px-6 border-b border-gray-100 pb-2">
                            <h3 className="text-xl font-bold text-gray-800">{category}</h3>
                            <button
                                onClick={() => handleViewAll(category)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                View All <ArrowRight size={14} />
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="px-6 flex gap-4 overflow-hidden">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-48 h-64 bg-gray-100 animate-pulse rounded-lg flex-shrink-0" />
                                ))}
                            </div>
                        ) : (
                            <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x no-scrollbar">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleProductClick(item)}
                                        className="w-44 md:w-56 flex-shrink-0 snap-start group cursor-pointer"
                                    >
                                        <div className="aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden border border-gray-100 mb-3 relative">
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                                                loading="lazy"
                                            />
                                            {item.rating > 4 && (
                                                <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                    ★ {item.rating}
                                                </div>
                                            )}
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5em] group-hover:text-blue-600 transition-colors">
                                            {item.title}
                                        </h4>
                                        <div className="mt-1 flex items-baseline gap-2">
                                            <span className="text-sm font-bold text-black">₹{item.price.toLocaleString()}</span>
                                            {item.source && (
                                                <span className="text-[10px] text-gray-500 uppercase">{item.source}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ResultsGrouped;
