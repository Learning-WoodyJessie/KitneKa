import React from 'react';

const CATEGORIES = [
    "Women's Wear",
    "Men's Wear",
    "Kids Wear",
    "Beauty",
    "Footwear",
    "Sportswear",
    "Jewellery",
    "Accessories"
];

const CategoryLabels = ({ onCategoryClick }) => {
    return (
        <div className="py-2 px-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Browse Categories</h2>
            <div className="flex flex-wrap gap-3">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onCategoryClick(cat)}
                        className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:text-black hover:border-gray-300 transition-all active:scale-95"
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategoryLabels;
