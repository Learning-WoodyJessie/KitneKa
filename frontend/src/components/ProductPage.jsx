import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Share2, Star, ShoppingBag, Truck, CheckCircle, AlertCircle, ExternalLink, Heart, ThumbsUp, ThumbsDown, Sparkles, AlertTriangle, TrendingDown, Info } from 'lucide-react';
import PriceHistoryChart from './PriceHistoryChart';
import { API_BASE } from '../config';

const ProductPage = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comparedPrices, setComparedPrices] = useState([]); // NEW: Multi-store prices
    const [comparingPrices, setComparingPrices] = useState(false); // Loading state for comparison
    const [similarProducts, setSimilarProducts] = useState([]); // NEW: Similar products

    // Offers Tab State
    const [activeOfferTab, setActiveOfferTab] = useState('popular');

    // Fetch Similar Products (Real Data)
    useEffect(() => {
        if (!product?.title) return;

        const fetchSimilar = async () => {
            try {
                // Construct query: Brand + Category OR Short Title
                let query = "";
                if (product.brand) {
                    query = `${product.brand} ${product.category || ""}`.trim();
                } else {
                    // If no brand, use first 4 words of title
                    query = product.title.split(' ').slice(0, 4).join(' ');
                }

                // Avoid searching for specific model numbers to get broader "similar" items
                // Strips MK3192 etc. if present in the short query
                query = query.replace(/[A-Z0-9]{4,}/g, '').trim();

                console.log("Fetching similar products for:", query);
                const res = await axios.get(`${API_BASE}/search`, {
                    params: { q: query }
                });

                if (res.data?.results?.online) {
                    // Filter out current product and limit to 5
                    const filtered = res.data.results.online
                        .filter(p => p.id !== product.id && p.title !== product.title)
                        .slice(0, 5);
                    setSimilarProducts(filtered);
                }
            } catch (e) {
                console.error("Similar fetch failed", e);
            }
        };

        fetchSimilar();
    }, [product]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Try LocalStorage
                const cachedData = localStorage.getItem(`product_shared_${id}`);
                let productData = null;

                if (cachedData) {
                    productData = JSON.parse(cachedData);
                    setProduct(productData);
                } else {
                    // 2. Fallback: API
                    const productRes = await axios.get(`${API_BASE}/products/${id}`);
                    productData = productRes.data;
                    setProduct(productData);
                }

                // 3. NEW: Fetch multi-store prices using product title (Critical for URL search items)
                if (productData?.title) {
                    setComparingPrices(true);
                    try {
                        console.log("Triggering comparison for:", productData.title);
                        const compareRes = await axios.get(`${API_BASE}/product/compare`, {
                            params: { title: productData.title }
                        });
                        if (compareRes.data?.prices && compareRes.data.prices.length > 0) {
                            setComparedPrices(compareRes.data.prices);
                        }
                    } catch (compareErr) {
                        console.warn("Price comparison failed:", compareErr);
                        // Not critical - continue with single store
                    } finally {
                        setComparingPrices(false);
                    }
                }

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

    const [resolvingUrl, setResolvingUrl] = useState(null);

    const handleBuyNow = async (e, url) => {
        e.preventDefault();

        // If it's already a direct link, just go
        if (!url.includes('google.com') && !url.includes('google.co.in')) {
            window.open(url, '_blank');
            return;
        }

        // If it looks like a Google Shopping viewer link, resolve it
        setResolvingUrl(url);
        try {
            const res = await axios.get(`${API_BASE}/discovery/resolve-link`, {
                params: { url }
            });
            if (res.data.url) {
                window.open(res.data.url, '_blank');
            } else {
                window.open(url, '_blank'); // Fallback
            }
        } catch (err) {
            console.error("Link resolution failed", err);
            window.open(url, '_blank'); // Fallback
        } finally {
            setResolvingUrl(null);
        }
    };

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

    // LIST OF POPULAR RETAILERS (Normalized)
    const POPULAR_RETAILERS = [
        'amazon', 'flipkart', 'myntra', 'ikea', 'h&m', 'zara', 'nike', 'adidas',
        'uniqlo', 'tata cliq', 'nykaa', 'ajio', 'michael kors', 'lakme', 'sephora'
    ];

    // SAMPLE/TRIAL STORES - These often sell samples, minis, or trial sizes
    // Flag these to prevent misleading "GREAT BUY" recommendations
    const SAMPLE_STORES = [
        'smytten',      // Known for samples/minis
        'myglamm',      // Often has sample sizes
        'freecultr',    // Trial offers
        'vaana',        // Small/trial sizes
        'gharstuff'     // Unverified small sizes
    ];

    // Check if store sells samples
    const isSampleStore = (sellerName) => {
        const name = (sellerName || '').toLowerCase();
        return SAMPLE_STORES.some(s => name.includes(s));
    };

    // Determine if seller is popular
    const isPopularStore = (sellerName) => {
        const name = (sellerName || '').toLowerCase();
        // Check list
        if (POPULAR_RETAILERS.some(r => name.includes(r))) return true;
        // Check if it matches product brand (Official Site)
        if (product.brand && name.includes(product.brand.toLowerCase())) return true;
        return false;
    };

    // Prepare Offer Data - PRIORITIZE comparedPrices from /product/compare API
    let allOffers = [];

    if (comparedPrices.length > 0) {
        // Use multi-store prices from API
        allOffers = comparedPrices.map(comp => ({
            seller: comp.source || 'Store',
            price: comp.price || 0,
            oldPrice: comp.old_price,
            shipping: 0,
            eta: '2-5 Days',
            url: comp.url || product.url,
            image: comp.image,
            stock: 'In Stock',
            matchClassification: comp.match_classification || 'SIMILAR',
            matchScore: comp.match_score || 0,
            llmReason: comp.llm_reason || '',
        }));
    } else {
        // Fallback: Use product.competitors (original behavior)
        allOffers = (product.competitors || product.competitor_prices || []).map(comp => ({
            seller: comp.name || comp.source,
            price: comp.price || product.price,
            shipping: comp.shipping || 0,
            eta: comp.eta || '3-5 Days',
            url: comp.url || product.url,
            stock: 'In Stock'
        }));
    }

    // Add current product as an offer if not already in list
    const currentSource = (product.source || '').toLowerCase();
    if (!allOffers.find(o => (o.seller || '').toLowerCase() === currentSource)) {
        allOffers.unshift({
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
    allOffers.sort((a, b) => (a.price + a.shipping) - (b.price + b.shipping));
    const bestOffer = allOffers[0] || { price: product.price, seller: product.source, url: product.url };

    // Split Offers
    const popularOffers = allOffers.filter(o => isPopularStore(o.seller)).slice(0, 15); // Limit to 15
    const otherOffers = allOffers.filter(o => !isPopularStore(o.seller)).slice(0, 15);   // Limit to 15

    // Fallback: If no popular offers found, put top 3 best price offers in popular
    if (popularOffers.length === 0 && otherOffers.length > 0) {
        popularOffers.push(...otherOffers.slice(0, 3));
        otherOffers.splice(0, 3);
    }

    const currentOffers = activeOfferTab === 'popular' ? popularOffers : otherOffers;

    // AI RECOMMENDATION LOGIC (Inspired by Buyhatke DealScan)
    const getRecommendation = () => {
        if (!allOffers.length) return null;

        // EXCLUDE SAMPLE STORES from price analysis to avoid misleading recommendations
        const realOffers = allOffers.filter(o => !isSampleStore(o.seller));
        const hasSampleStores = allOffers.length > realOffers.length;

        // Use real offers for calculations, fallback to all if no real offers
        const offersForCalc = realOffers.length > 0 ? realOffers : allOffers;

        const prices = offersForCalc.map(o => o.price);
        const minPrice = Math.min(...prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

        // Mock Rating if missing (since we need it for the score)
        const rating = parseFloat(product.rating || '4.0');

        // Price Difference %
        const priceDiff = ((avgPrice - minPrice) / avgPrice) * 100;

        // 1. High Risk / Low Rating
        if (rating < 3.5) {
            return {
                verdict: 'CAUTION',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                icon: <AlertTriangle className="text-amber-600 w-5 h-5" />,
                title: "Check Reviews Carefully",
                reason: "This product has a lower than average rating. We recommend checking user reviews before purchase.",
                score: 4
            };
        }

        // 2. Great Deal (Significant Price Drop/Gap)
        if (priceDiff > 15) {
            return {
                verdict: 'GREAT BUY',
                color: 'text-green-700',
                bg: 'bg-green-50',
                border: 'border-green-200',
                icon: <Sparkles className="text-green-600 w-5 h-5" />,
                title: "Excellent Price!",
                reason: `This deal is ${Math.round(priceDiff)}% cheaper than the market average of ₹${Math.round(avgPrice).toLocaleString()}. It's a great time to buy.`,
                score: 9
            };
        }

        // 3. Good Deal (Moderate Gap)
        if (priceDiff > 5) {
            return {
                verdict: 'GOOD DEAL',
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                icon: <CheckCircle className="text-emerald-600 w-5 h-5" />,
                title: "Fair Market Price",
                reason: "This price is competitive and lower than the average market rate.",
                score: 7
            };
        }

        // 4. Neutral / Wait
        return {
            verdict: 'NEUTRAL',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: <Info className="text-blue-600 w-5 h-5" />,
            title: "Standard Price",
            reason: "The price is stable. You can buy now if you need it, or wait for a potential sale.",
            score: 5
        };
    };

    const recommendation = getRecommendation();

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Nav */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/#/search'}
                        className="flex items-center text-gray-500 hover:text-black transition-colors gap-1"
                    >
                        <ChevronLeft size={20} />
                        <span className="text-sm font-medium">Back</span>
                    </button>
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

                        {/* Actions Row */}
                        <div className="flex items-center justify-center gap-4">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-red-200 hover:text-red-500 transition-colors shadow-sm">
                                <Heart size={18} />
                                <span className="text-sm font-medium">Wishlist</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-blue-200 hover:text-blue-500 transition-colors shadow-sm">
                                <ThumbsUp size={18} />
                                <span className="text-sm font-medium">Like</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:text-gray-600 transition-colors shadow-sm">
                                <ThumbsDown size={18} />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: DETAILS (Col span 7) */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Title & Stats */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-black font-bold text-xs uppercase tracking-widest border border-gray-200 px-3 py-1">
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

                        {/* Best Price Card */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Best Market Price</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-gray-900">₹{(bestOffer.price || 0).toLocaleString()}</span>
                                    {(bestOffer.price || 0) < ((product.original_price || 0) || (bestOffer.price || 0) * 1.2) && (
                                        <span className="text-lg text-gray-400 line-through">₹{Math.round((bestOffer.price || 0) * 1.2).toLocaleString()}</span>
                                    )}
                                </div>
                                <p className="text-sm text-green-600 font-medium mt-1">
                                    Lowest at {bestOffer.seller}
                                </p>
                            </div>
                            <button
                                onClick={(e) => handleBuyNow(e, product.url)}
                                disabled={resolvingUrl === product.url}
                                className="w-full sm:w-auto px-8 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-wait"
                            >
                                {resolvingUrl === product.url ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                        Redirecting...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag size={20} />
                                        Go to Store
                                    </>
                                )}
                            </button>
                        </div>

                        {/* AI Recommendation Card */}
                        {recommendation && (
                            <div className={`p-5 rounded-2xl border ${recommendation.border} ${recommendation.bg} flex gap-4 transition-all hover:shadow-md`}>
                                <div className={`mt-0.5 bg-white p-2.5 rounded-full h-fit shadow-sm ${recommendation.color} bg-opacity-100`}>
                                    {recommendation.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold uppercase tracking-widest ${recommendation.color}`}>AI Recommendation</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white shadow-sm border border-opacity-10 ${recommendation.color} ${recommendation.border}`}>
                                                {recommendation.verdict}
                                            </span>
                                        </div>
                                        {/* Mock Score Indicator */}
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 10 }).map((_, i) => (
                                                <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < recommendation.score ? recommendation.color.replace('text-', 'bg-') : 'bg-gray-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <h4 className={`font-bold text-sm mb-1 ${recommendation.color}`}>{recommendation.title}</h4>
                                    <p className="text-gray-700 font-medium text-sm leading-relaxed opacity-90">
                                        {recommendation.reason}
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* SECTION: OFFERS TABS */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Tabs Header */}
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveOfferTab('popular')}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeOfferTab === 'popular' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Top Retailers ({comparingPrices ? '...' : popularOffers.length})
                        </button>
                        <button
                            onClick={() => setActiveOfferTab('others')}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeOfferTab === 'others' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Other Options ({otherOffers.length})
                        </button>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto">
                        {currentOffers.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                        <th className="px-6 py-4">Seller</th>
                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Match</th>
                                        <th className="px-6 py-4">Shipping</th>
                                        <th className="px-6 py-4 hidden sm:table-cell">Delivery</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {currentOffers.map((offer, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{offer.seller}</div>
                                                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                                    {idx === 0 && activeOfferTab === 'popular' && <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 uppercase tracking-wide">BEST DEAL</span>}
                                                    {isPopularStore(offer.seller) && <span className="text-[10px] font-bold border border-gray-200 text-gray-500 px-2 py-0.5 uppercase tracking-wide">VERIFIED</span>}
                                                    {isSampleStore(offer.seller) && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 uppercase tracking-wide">SAMPLE</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                ₹{(offer.price || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {offer.matchScore > 0 ? (
                                                    <div title={offer.llmReason || ''} className="cursor-help">
                                                        <div className={`text-xl font-bold leading-none ${offer.matchClassification === 'EXACT_MATCH' ? 'text-green-600' :
                                                            offer.matchClassification === 'VARIANT_MATCH' ? 'text-blue-600' :
                                                                'text-gray-400'
                                                            }`}>
                                                            {offer.matchScore}%
                                                        </div>
                                                        <div className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${offer.matchClassification === 'EXACT_MATCH' ? 'text-green-500' :
                                                            offer.matchClassification === 'VARIANT_MATCH' ? 'text-blue-500' :
                                                                'text-gray-400'
                                                            }`}>
                                                            {offer.matchClassification === 'EXACT_MATCH' ? '✓ Exact' :
                                                                offer.matchClassification === 'VARIANT_MATCH' ? '~ Variant' : 'Similar'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs font-medium">Low Confidence</span>
                                                )}
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
                                                <button
                                                    onClick={(e) => handleBuyNow(e, offer.url)}
                                                    className="inline-flex items-center gap-1 text-black font-bold text-sm hover:underline disabled:opacity-50"
                                                    disabled={resolvingUrl === offer.url}
                                                >
                                                    {resolvingUrl === offer.url ? 'Loading...' : <>Buy Now <ExternalLink size={14} /></>}
                                                </button>
                                            </td>
                                        </tr>

                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                No offers found in this category.
                            </div>
                        )}
                    </div>
                </div>

                {/* PRICE HISTORY CHART */}
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Price History</h3>
                    <PriceHistoryChart currentPrice={bestOffer.price} />
                </div>

                {/* SECTION: SIMILAR PRODUCTS */}
                {similarProducts.length > 0 && (
                    <div className="pt-8 border-t border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 px-1">Similar Products</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {similarProducts.map((simProduct, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleProductClick(simProduct)}
                                    className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="aspect-[3/4] bg-gray-50 rounded-lg mb-4 overflow-hidden relative">
                                        <img
                                            src={simProduct.image || 'https://placehold.co/400x500?text=Product'}
                                            alt={simProduct.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => e.target.src = 'https://placehold.co/400x500?text=Product'}
                                        />
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-blue-600">
                                        {simProduct.title}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900">₹{(simProduct.price || 0).toLocaleString()}</span>
                                        {simProduct.original_price > simProduct.price && (
                                            <span className="text-xs text-gray-400 line-through">₹{simProduct.original_price.toLocaleString()}</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{simProduct.source}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default ProductPage;
