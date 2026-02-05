import React from 'react';
import { BadgeCheck, ShieldCheck, Sparkles, ExternalLink, Star, BrainCircuit, Leaf } from 'lucide-react';

const RecommendationBanner = ({ recommendation, insight, cleanBrands, onBrandClick }) => {
    // If no data at all, return null
    if (!recommendation && !insight && (!cleanBrands || cleanBrands.length === 0)) return null;

    // AI Insight Data
    // FIX: Read 'recommendation_text' which is what backend sends for text summary
    const insightText = insight?.recommendation_text || insight?.content || insight?.summary;
    const priceRange = insight?.price_range || null;

    // Mode: Clean Brands List (Overrides single recommendation)
    const showCleanBrands = cleanBrands && cleanBrands.length > 0;

    return (
        <div className="mb-8 font-sans">
            {/* LOOPHIA THEME: Light Warm Gray Background, Black Text, Sharp Borders */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 relative overflow-hidden flex flex-col gap-6">

                {/* 1. TOP SECTION: AI INSIGHT (If available) */}
                {insightText && (
                    <div className="relative z-10 space-y-3">
                        <div className="flex items-center gap-2 text-black font-bold text-xs tracking-widest uppercase">
                            <Sparkles size={14} className="text-black" />
                            AI Insight
                        </div>
                        <p className="text-gray-900 text-lg md:text-xl font-medium leading-relaxed max-w-3xl">
                            {insightText}
                        </p>
                        {priceRange && (
                            <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-full">
                                <span className="text-black">Price Range:</span> {priceRange}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. CONTENT SECTION: Either Clean Brands List OR Single Recommendation */}

                {showCleanBrands ? (
                    <div className="relative z-10 mt-2">
                        <div className="flex overflow-x-auto gap-4 py-2 pb-4 snap-x hide-scrollbar">
                            {cleanBrands.map((brand, idx) => (
                                <div key={idx} className="flex-shrink-0 w-64 bg-white rounded-lg p-4 border border-gray-200 relative flex flex-col gap-3 snap-center hover:border-black transition-colors">

                                    {/* Badges */}
                                    <div className="flex gap-2 mb-1">
                                        {brand.is_official && (
                                            <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit uppercase tracking-wider">
                                                Official
                                            </span>
                                        )}
                                        {brand.is_clean_beauty && (
                                            <span className="bg-stone-200 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit uppercase tracking-wider">
                                                Clean
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-gray-50 rounded p-1 border border-gray-100 flex-shrink-0">
                                            <img src={brand.thumbnail || brand.image} alt={brand.title} className="w-full h-full object-contain grayscale hover:grayscale-0 transition-all duration-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-black line-clamp-2 leading-tight">{brand.title}</h3>
                                            <div className="text-xs text-gray-500 mt-1">{brand.source}</div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (onBrandClick) {
                                                // Extract Brand Name from Title logic: "Visit Old School Rituals Official Store"
                                                // We can try to just pass the 'title' cleanly or let the parent handle it.
                                                // Let's pass the raw title and let parent parse, OR try to clean it here.
                                                // Best approach: If brand object has a clean name field use it, else parse title.
                                                // The backend constructs title as f"Visit {display_name} Official Store"
                                                // We can reverse this or better, rely on the search.
                                                let query = brand.title.replace('Visit ', '').replace(' Official Store', '');
                                                onBrandClick(query);
                                            } else {
                                                window.open(brand.link, '_blank');
                                            }
                                        }}
                                        className="mt-auto w-full bg-black hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
                                    >
                                        Visit Store <ArrowRightIcon size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : recommendation ? (
                    /* ORIGINAL SINGLE CARD LAYOUT - REDESIGNED */
                    <div className="bg-white rounded-xl p-0 md:p-1 border border-gray-200 relative z-10 flex flex-col md:flex-row shadow-sm overflow-hidden">

                        {/* Image Section */}
                        <div className="w-full md:w-32 h-32 md:h-28 bg-white flex-shrink-0 p-4 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
                            <img
                                src={recommendation.image}
                                alt={recommendation.title}
                                className="w-full h-full object-contain mix-blend-multiply"
                            />
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 p-4 md:py-2 md:px-5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    Top Pick
                                </span>
                                {recommendation.rating > 0 && (
                                    <span className="text-xs text-gray-500 flex items-center gap-0.5">
                                        <Star size={10} fill="currentColor" className="text-black" /> {recommendation.rating}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-sm font-bold text-black line-clamp-1 mb-1">
                                {recommendation.title}
                            </h3>

                            <div className="text-xs text-gray-500 line-clamp-1 mb-2">
                                {recommendation.recommendation_reason}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-black">₹{recommendation.price?.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Action Section */}
                        <div className="p-4 md:border-l border-gray-100 flex items-center">
                            <button
                                onClick={() => window.open(recommendation.url, '_blank')}
                                className="w-full md:w-auto bg-black hover:bg-gray-800 text-white font-medium py-2 px-6 rounded-lg text-xs uppercase tracking-wide transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                                Get Deal <ExternalLink size={12} />
                            </button>
                        </div>
                    </div>
                ) : null}

            </div>
        </div>
    );
};

// Helper Icon for this component
const ArrowRightIcon = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);

export default RecommendationBanner;
