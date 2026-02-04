import React from 'react';

const FEATURED_BRANDS = [
    { id: 'fav_1', name: 'FabIndia', logo: 'https://logo.clearbit.com/fabindia.com', tag: 'Ethnic' },
    { id: 'fav_2', name: 'Manyavar', logo: 'https://logo.clearbit.com/manyavar.com', tag: 'Celebrations' },
    { id: 'fav_3', name: 'Biba', logo: 'https://logo.clearbit.com/biba.in', tag: 'Trending' },
    { id: 'fav_4', name: 'Raymond', logo: 'https://logo.clearbit.com/raymond.in', tag: 'Premium' },
    { id: 'fav_5', name: 'Titan', logo: 'https://logo.clearbit.com/titan.co.in', tag: 'Timeless' },
    { id: 'fav_6', name: 'Nike', logo: 'https://logo.clearbit.com/nike.com', tag: 'Sport' },
    { id: 'fav_7', name: 'Adidas', logo: 'https://logo.clearbit.com/adidas.co.in', tag: 'Active' },
    { id: 'fav_8', name: 'H&M', logo: 'https://logo.clearbit.com/hm.com', tag: 'Fashion' },
    { id: 'fav_9', name: 'Zara', logo: 'https://logo.clearbit.com/zara.com', tag: 'Chic' },
    { id: 'fav_10', name: 'Puma', logo: 'https://logo.clearbit.com/puma.com', tag: 'Fast' },
];

const FeaturedBrands = ({ onBrandClick }) => {
    return (
        <div className="py-6 space-y-4">
            <div className="flex items-center justify-between px-6">
                <h2 className="text-xl font-bold text-gray-900">Featured Brands</h2>
            </div>

            <div className="flex overflow-x-auto pb-4 px-6 gap-4 no-scrollbar snap-x">
                {FEATURED_BRANDS.map((brand) => (
                    <div
                        key={brand.id}
                        onClick={() => window.open(`/search?brand=${encodeURIComponent(brand.name)}`, '_blank')}
                        className="flex-shrink-0 cursor-pointer group snap-start"
                    >
                        <div className="w-24 h-24 rounded-full border border-gray-200 bg-white flex items-center justify-center p-4 shadow-sm group-hover:shadow-md group-hover:border-blue-500 transition-all overflow-hidden relative">
                            <img
                                src={brand.logo}
                                alt={brand.name}
                                className="w-full h-full object-contain mix-blend-multiply filter group-hover:brightness-110 transition-all"
                                onError={(e) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${brand.name}&background=random`
                                }}
                            />
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-sm font-medium text-gray-900 truncate w-24 group-hover:text-blue-600">
                                {brand.name}
                            </p>
                            {brand.tag && (
                                <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    {brand.tag}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeaturedBrands;
