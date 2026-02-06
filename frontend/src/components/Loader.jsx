import React from 'react';
import { Search, Tag, ShoppingBag } from 'lucide-react';

const Loader = ({ message = "Finding the best prices..." }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fadeIn">
            <div className="relative">
                {/* Brand Logo Animation */}
                <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-gray-800 to-black animate-pulse" />

                    {/* Icon Stack */}
                    <div className="relative z-10 text-white flex items-center justify-center">
                        {/* We animate the Search icon scanning */}
                        <Search size={40} className="animate-bounce" strokeWidth={2.5} />
                    </div>
                </div>

                {/* Orbiting Tag */}
                <div className="absolute top-0 right-0 -mt-2 -mr-2 animate-spin-slow">
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-lg text-white">
                        <Tag size={14} />
                    </div>
                </div>
            </div>

            {/* Brand Text */}
            <h1 className="text-3xl font-bold tracking-tight mb-2">
                Kitne<span className="text-gray-900 font-bold">Ka</span>
            </h1>

            {/* Loading Message */}
            <p className="text-gray-500 font-medium animate-pulse">{message}</p>

            {/* Progress Bar (Decorative) */}
            <div className="w-48 h-1 bg-gray-100 rounded-full mt-6 overflow-hidden">
                <div className="w-full h-full bg-black animate-progress origin-left" />
            </div>

            <style>{`
                @keyframes progress {
                    0% { transform: scaleX(0); }
                    50% { transform: scaleX(0.7); }
                    100% { transform: scaleX(1); }
                }
                .animate-progress {
                    animation: progress 1.5s infinite ease-in-out;
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg) translateX(40px) rotate(0deg); }
                    to { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
                }
            `}</style>
        </div>
    );
};

export default Loader;
