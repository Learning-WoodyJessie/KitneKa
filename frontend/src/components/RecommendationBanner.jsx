import React from 'react';
import { BadgeCheck, ShieldCheck, TrendingDown, ExternalLink, Star } from 'lucide-react';

const RecommendationBanner = ({ recommendation }) => {
    if (!recommendation) return null;

    const {
        title,
        price,
        image,
        store_name,
        source,
        rating,
        reviews,
        is_official,
        recommendation_reason,
        confidence_score,
        delivery
    } = recommendation;

    return (
        <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden">

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10"></div>

                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">

                    {/* Product Image */}
                    <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 bg-white rounded-xl p-2 shadow-sm border border-white">
                        <img
                            src={image}
                            alt={title}
                            className="w-full h-full object-contain mix-blend-multiply"
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center md:text-left space-y-2">

                        {/* Badge */}
                        <div className="flex justify-center md:justify-start">
                            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                                <BadgeCheck size={14} />
                                Suggested Pick
                            </span>
                        </div>

                        <h2 className="text-lg md:text-xl font-bold text-gray-900 line-clamp-2">
                            {title}
                        </h2>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-600">
                            {is_official ? (
                                <span className="flex items-center gap-1 text-blue-700 font-medium bg-blue-100 px-2 py-0.5 rounded">
                                    <BadgeCheck size={14} />
                                    Official Store
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-gray-700 font-medium bg-gray-100 px-2 py-0.5 rounded">
                                    <ShieldCheck size={14} />
                                    Trusted Seller
                                </span>
                            )}

                            {rating > 0 && (
                                <span className="flex items-center gap-1 text-yellow-600 font-medium bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">
                                    <Star size={12} fill="currentColor" />
                                    {rating} ({reviews})
                                </span>
                            )}
                        </div>

                        {/* Reason & Delivery */}
                        <div className="text-sm text-gray-500">
                            <span className="font-medium text-gray-700">Why?</span> {recommendation_reason}
                            {delivery && delivery !== "Check Site" && (
                                <span className="hidden md:inline"> • {delivery}</span>
                            )}
                        </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex flex-col items-center gap-3 min-w-[140px] border-l border-blue-200/50 pl-0 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0 w-full md:w-auto mt-2 md:mt-0">
                        <div className="text-center">
                            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Best Price</div>
                            <div className="text-2xl font-bold text-gray-900">₹{price?.toLocaleString()}</div>
                            {store_name && <div className="text-xs text-gray-500 mt-0.5">via {store_name || source}</div>}
                        </div>

                        <button
                            onClick={() => window.open(recommendation.url, '_blank')}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                        >
                            View Deal <ExternalLink size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecommendationBanner;
