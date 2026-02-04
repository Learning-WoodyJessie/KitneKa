import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Share2, Star, ShoppingBag, Truck, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import PriceHistoryChart from './PriceHistoryChart';

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
                // 1. Try LocalStorage
                const cachedData = localStorage.getItem(`product_shared_${id}`);
                if (cachedData) {
                    setProduct(JSON.parse(cachedData));
                    setLoading(false);
                    return;
                }
                // 2. Fallback: API
                const productRes = await axios.get(`${API_BASE}/products/${id}`);
                setProduct(productRes.data);
            } catch (err) {
                console.error("Failed to load product", err);
                setError("Product not found. It may have expired or changed.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-500 animate-pulse">Finding best prices...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-white">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="text-gray-400" size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
                <p className="text-gray-500 mb-6">{error}</p>
                <Link to="/search" className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                    Back to Search
                </Link>
            </div>
        );
    }

    // Prepare Offer Data
    const offers = (product.competitors || product.competitor_prices || []).map(comp => ({
        seller: comp.name || comp.source,
        price: comp.price || product.price,
        shipping: comp.shipping || 0,
        eta: comp.eta || '3-5 Days',
        url: comp.url || product.url,
        stock: 'In Stock'
    }));

    // Add current product as an offer if not already in list
    if (!offers.find(o => o.seller === product.source)) {
        offers.unshift({
            seller: product.source || "Featured Store",
            price: product.price,
            shipping: 0,
            eta: '2-4 Days',
            url: product.url,
            stock: 'In Stock',
            isBest: true
        });
    }

    // Sort by Total Price
    offers.sort((a, b) => (a.price + a.shipping) - (b.price + b.shipping));
    const bestOffer = offers[0];

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Nav */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/search" className="flex items-center text-gray-500 hover:text-black transition-colors gap-1">
                        <ChevronLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* PRODCUT HEADER GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* LEFT: IMAGE & GALLERY (Col span 5) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 aspect-square flex items-center justify-center relative shadow-sm overflow-hidden group">
                            <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                            />
                            {product.rating > 4.5 && (
                                <div className="absolute top-4 left-4 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                    <Star size={12} fill="black" /> Top Rated
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: DETAILS & CHART (Col span 7) */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Title & Stats */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-blue-600 font-bold text-xs uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                                    {product.brand || "Fashion"}
                                </span>
                                {product.category && (
                                    <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">
                                        • {product.category}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-4">
                                {product.title}
                            </h1>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-1">
                                    <Star className="text-yellow-400 fill-yellow-400" size={16} />
                                    <span className="font-bold text-gray-900">{product.rating || '4.5'}</span>
                                    <span className="text-gray-400 border-b border-dotted border-gray-400">(128 reviews)</span>
                                </div>
                                <div className="flex items-center gap-1 text-green-600 font-medium">
                                    <CheckCircle size={16} />
                                    <span>In Stock</span>
                                </div>
                            </div>
                        </div>

                        {/* Price & CTA */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Best Market Price</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-gray-900">₹{bestOffer.price.toLocaleString()}</span>
                                    {bestOffer.price < (product.original_price || bestOffer.price * 1.2) && (
                                        <span className="text-lg text-gray-400 line-through">₹{Math.round(bestOffer.price * 1.2).toLocaleString()}</span>
                                    )}
                                </div>
                                <p className="text-sm text-green-600 font-medium mt-1">
                                    Lowest at {bestOffer.seller}
                                </p>
                            </div>
                            <a
                                href={bestOffer.url}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full sm:w-auto px-8 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                            >
                                <ShoppingBag size={20} />
                                Go to Store
                            </a>
                        </div>

                        {/* Chart Component */}
                        <PriceHistoryChart currentPrice={bestOffer.price} />

                    </div>
                </div>

                {/* SECTION: OFFERS TABLE */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">Available from {offers.length} Sellers</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                    <th className="px-6 py-4">Seller</th>
                                    <th className="px-6 py-4">Price</th>
                                    <th className="px-6 py-4">Shipping</th>
                                    <th className="px-6 py-4 hidden sm:table-cell">Delivery</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {offers.map((offer, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{offer.seller}</div>
                                            {idx === 0 && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">BEST PRICE</span>}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            ₹{offer.price.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {offer.shipping === 0 ? <span className="text-green-600 font-bold text-xs uppercase">Free</span> : `+₹${offer.shipping}`}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                                            <div className="flex items-center gap-1.5">
                                                <Truck size={14} /> {offer.eta}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={offer.url}
                                                target="_blank"
                                                className="inline-flex items-center gap-1 text-blue-600 font-bold text-sm hover:underline"
                                            >
                                                Buy Now <ExternalLink size={14} />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SECTION: SIMILAR PRODUCTS */}
                <div className="pt-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 px-1">Similar Products</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer group">
                                <div className="aspect-[3/4] bg-gray-50 rounded-lg mb-4 overflow-hidden relative">
                                    <img
                                        src={`https://images.unsplash.com/photo-${152 + i}?auto=format&fit=crop&w=400&q=80`} // Mock Images
                                        alt="Similar"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => e.target.src = 'https://placehold.co/400x500?text=Product'}
                                    />
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-blue-600">
                                    Premium {product.category || "Apparel"} - Variant {i + 1}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">₹{Math.round(bestOffer.price * (0.8 + Math.random() * 0.4)).toLocaleString()}</span>
                                    <span className="text-xs text-gray-400 line-through">₹{Math.round(bestOffer.price * 1.5).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
};

export default ProductPage;
