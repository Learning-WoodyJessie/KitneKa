import React from 'react';
import { Package, ChevronRight } from 'lucide-react';

const BrandGrid = ({ brands, onBrandClick }) => {
    if (!brands || brands.length === 0) return null;

    const displayName = (brand) =>
        brand.title ? String(brand.title).replace(/Visit\s+/i, '').replace(/\s*Official Store/i, '').trim() : 'Brand';

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 py-8 animate-fadeIn">
            {brands.map((brand, index) => (
                <div
                    key={index}
                    onClick={() => onBrandClick(brand)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onBrandClick(brand);
                        }
                    }}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-black/5 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
                >
                    {/* Larger card: Bigger Image + Name */}
                    <div className="p-8 flex flex-col items-center text-center flex-1 justify-center">
                        <div className="w-24 h-24 rounded-full border-4 border-gray-50 overflow-hidden bg-white shadow-sm flex-shrink-0 mb-5 group-hover:scale-110 group-hover:border-gray-200 transition-all duration-500">
                            <img
                                src={brand.image || ''}
                                alt={displayName(brand)}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-black transition-colors">
                            {displayName(brand)}
                        </h3>
                        {/* Optional: Add a subtle subtitle or count if available, for now keeping it clean */}
                    </div>

                    {/* View Products Button - Full Width Style */}
                    <div className="p-4 pt-0 mt-auto">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onBrandClick(brand);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 text-gray-900 text-base font-medium border border-transparent group-hover:bg-black group-hover:text-white group-hover:shadow-md transition-all duration-300"
                        >
                            <Package size={18} className="opacity-70 group-hover:opacity-100" />
                            View products
                            <ChevronRight size={16} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BrandGrid;
