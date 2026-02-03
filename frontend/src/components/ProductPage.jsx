import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ExternalLink, ShoppingCart, Loader2, Star, Share2 } from 'lucide-react';

const ProductPage = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Try to get detailed product data from LocalStorage (Demo/Mock Support)
                const cachedData = localStorage.getItem(`product_shared_${id}`);
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    setProduct(parsed);
                    setLoading(false);
                    return;
                }

                // 2. Fallback: Fetch from API
                const productRes = await axios.get(`${API_BASE}/products/${id}`);
                setProduct(productRes.data);
            } catch (err) {
                console.error("Failed to load product", err);
                setError("Product not found or failed to load. Please try searching again.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
                <p className="text-gray-500 mb-6">{error || "Product not found"}</p>
                <Link to="/search" className="text-blue-600 hover:underline flex items-center gap-2">
                    <ChevronLeft size={16} /> Back to Search
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Breadcrumb / Back */}
                <Link to="/search" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-black mb-6 transition-colors">
                    <ChevronLeft size={16} className="mr-1" /> Back to Search Results
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
                    {/* LEFT: IMAGE */}
                    <div className="bg-gray-50 rounded-2xl p-8 flex items-center justify-center border border-gray-100">
                        <img
                            src={product.image || product.image_url || "https://placehold.co/600x600?text=No+Image"}
                            alt={product.title || product.name}
                            className="max-h-[500px] w-full object-contain mix-blend-multiply"
                        />
                    </div>

                    {/* RIGHT: INFO */}
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                {product.source || "KitneKa Select"}
                            </span>
                            <button className="text-gray-400 hover:text-black transition-colors">
                                <Share2 size={20} />
                            </button>
                        </div>

                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                            {product.title || product.name}
                        </h1>

                        <div className="flex items-center gap-2 mb-8">
                            <div className="flex text-yellow-500">
                                {[...Array(4)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                                <Star size={16} className="text-gray-300" />
                            </div>
                            <span className="text-sm text-gray-500">(24 Reviews)</span>
                        </div>

                        {/* Best Price Request */}
                        <div className="flex items-end gap-3 mb-8">
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Best Price</p>
                                <div className="text-5xl font-bold text-black">₹{product.price?.toLocaleString()}</div>
                            </div>
                            <div className="flex flex-col gap-2 mb-1">
                                <span className="text-green-600 text-sm font-bold bg-green-50 px-2 py-1 rounded">Save 15%</span>
                            </div>
                        </div>

                        {/* Primary Buy Button */}
                        <a
                            href={product.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block w-full text-center bg-black text-white font-bold py-4 rounded-xl mb-8 hover:bg-gray-800 transition-colors"
                        >
                            Visit {product.source || "Store"} &rarr;
                        </a>

                        {/* COMPARISON LINKS */}
                        <div className="border-t border-gray-100 pt-8">
                            <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
                                <ShoppingCart size={20} /> Available Stores
                            </h3>
                            <div className="space-y-4">
                                {(product.competitors || product.competitor_prices || [
                                    // Fallbacks with smart search links
                                    { name: 'Amazon', price: (product.price || 0) * 1.1, url: `https://www.amazon.in/s?k=${encodeURIComponent(product.title || product.name)}` },
                                    { name: 'Flipkart', price: (product.price || 0) * 1.05, url: `https://www.flipkart.com/search?q=${encodeURIComponent(product.title || product.name)}` },
                                    { name: 'Myntra', price: (product.price || 0) * 1.02, url: `https://www.myntra.com/${encodeURIComponent(product.title || product.name)}` },
                                ]).slice(0, 5).map((comp, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-600 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 text-xs">
                                                {comp.name ? comp.name[0] : 'S'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{comp.name || comp.source}</p>
                                                <p className="text-xs text-gray-500">In Stock</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="font-bold text-lg text-gray-900">₹{(comp.price || product.price).toLocaleString()}</span>
                                            <a
                                                href={comp.url || "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                                            >
                                                Buy Now
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SIMILAR ITEMS */}
                <div className="border-t border-gray-100 pt-16">
                    <h2 className="text-2xl font-bold text-black mb-8">Similar Products</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="group cursor-pointer">
                                <div className="aspect-[3/4] bg-gray-100 rounded-xl mb-4 overflow-hidden">
                                    <img
                                        src={`https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400&text=Similar+${i}`}
                                        alt="Similar"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 truncate">Similar Premium Product {i + 1}</h3>
                                <p className="text-gray-500 text-sm font-bold mt-1">₹{((product.price || 1500) + (i * 100)).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductPage;
