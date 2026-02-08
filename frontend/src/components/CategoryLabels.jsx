import React from 'react';
import { Shirt, Footprints, Sparkles, Gem, Watch, Activity, Baby, Glasses, User, Leaf } from 'lucide-react';

const CATEGORIES = [
    { id: 'cat_1', name: "Women's Wear", icon: <User />, color: 'bg-pink-100 text-pink-600' },
    { id: 'cat_2', name: "Men's Wear", icon: <Shirt />, color: 'bg-blue-100 text-blue-600' },
    { id: 'cat_3', name: "Kids Wear", icon: <Baby />, color: 'bg-yellow-100 text-yellow-600' },
    { id: 'cat_8', name: "Sportswear", icon: <Activity />, color: 'bg-green-100 text-green-600' },
    { id: 'cat_4', name: "Footwear", icon: <Footprints />, color: 'bg-orange-100 text-orange-600' },
    { id: 'cat_handbags', name: "Handbags", icon: <ShoppingBag />, color: 'bg-red-100 text-red-600' },
    { id: 'cat_7', name: "Watches", icon: <Watch />, color: 'bg-gray-100 text-gray-600' },
    { id: 'cat_6', name: "Jewellery", icon: <Gem />, color: 'bg-indigo-100 text-indigo-600' },
    { id: 'cat_5', name: "Beauty", icon: <Sparkles />, color: 'bg-purple-100 text-purple-600' },
    { id: 'cat_clean', name: "Clean Beauty", icon: <Leaf />, color: 'bg-green-100 text-green-700' },
];

const CategoryLabels = ({ onCategoryClick }) => {
    return (
        <div className="py-6 space-y-4">
            <div className="flex items-center justify-between px-6">
                <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
            </div>
            <div className="flex overflow-x-auto pb-4 px-6 gap-4 no-scrollbar snap-x">
                {CATEGORIES.map((cat) => (
                    <div
                        key={cat.id}
                        onClick={() => onCategoryClick ? onCategoryClick(cat.name) : window.open(`/#/search?category=${encodeURIComponent(cat.name)}`, '_blank')}
                        className="flex-shrink-0 cursor-pointer group snap-start"
                    >
                        <div className={`w-24 h-24 rounded-full border border-gray-200 flex items-center justify-center p-4 shadow-sm group-hover:shadow-md transition-all relative ${cat.color} group-hover:bg-white`}>
                            {/* Icon Wrapper */}
                            <div className="transform scale-150 group-hover:scale-125 transition-transform duration-300">
                                {cat.icon || <User />}
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-sm font-medium text-gray-900 truncate w-24 group-hover:text-blue-600">
                                {cat.name}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryLabels;
