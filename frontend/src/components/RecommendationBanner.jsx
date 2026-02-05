
import React from 'react';
import { BadgeCheck, ShieldCheck, Sparkles, ExternalLink, Star, BrainCircuit } from 'lucide-react';

const RecommendationBanner = ({ recommendation, insight }) => {
    if (!recommendation && !insight) return null;

    // AI Insight Data
    const insightText = insight?.content || insight?.summary || "Analyzing market prices...";
    const priceRange = insight?.price_range || null;

    return (
        <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-8">

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-40 -mr-20 -mt-20 pointer-events-none"></div>

                {/* LEFT: AI ANALYSIS (Always visible if present) */}
                <div className="flex-1 space-y-3 z-10">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-sm uppercase tracking-wide">
                        <BrainCircuit size={18} />
                        AI Market Insight
                    </div>

                    <p className="text-gray-800 text-lg leading-relaxed font-medium">
                        {insightText}
                    </p>

                    {priceRange && (
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600 bg-white/60 w-fit px-3 py-1.5 rounded-lg border border-blue-100">
                            <span className="font-semibold text-gray-900">Typical Price:</span> {priceRange}
                        </div>
                    )}
                </div>

                {/* RIGHT: SUGGESTED PICK (Conditional) */}
                {recommendation && (
                    <div className="flex-shrink-0 md:w-80 bg-white rounded-xl p-4 shadow-sm border border-blue-100 relative z-10 flex flex-col gap-3">
                        {/* Badge Overlapping Top */}
                        <div className="absolute -top-3 left-4">
                            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                                <BadgeCheck size={12} />
                                Suggested Pick
                            </span>
                        </div>

                        <div className="flex gap-4 pt-2">
                            {/* Tiny Image */}
                            <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-lg p-1 border border-gray-100">
                                <img
                                    src={recommendation.image}
                                    alt={recommendation.title}
                                    className="w-full h-full object-contain mix-blend-multiply"
                                />
                            </div>

                            {/* Title & Price */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">
                                    {recommendation.title}
                                </h3>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-lg font-bold text-gray-900">₹{recommendation.price?.toLocaleString()}</span>
                                    {recommendation.rating > 0 && (
                                        <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                                            <Star size={10} fill="currentColor" /> {recommendation.rating}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="text-xs text-gray-500 line-clamp-2">
                            {recommendation.recommendation_reason}
                        </div>

                        {/* Action */}
                        <button
                            onClick={() => window.open(recommendation.url, '_blank')}
                            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            View Deal <ExternalLink size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecommendationBanner;
