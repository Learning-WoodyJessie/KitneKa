import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import PriceHistoryChart from './PriceHistoryChart';
import PriceHistoryTable from './PriceHistoryTable';
import { ChevronLeft, ExternalLink, ShoppingCart, Loader2, Table, BarChart3, Calendar } from 'lucide-react';

const ProductPage = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New States
    const [timeRange, setTimeRange] = useState(30); // Days: 7, 30, 365
    const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

    const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    useEffect(() => {
        const fetchData = async () => {
            // Only show loader on initial load if we want to avoid UI jumps, 
            // but for better UX on range switch, we might keep old data until new arrives.
            // For simplicity, we just set loading to true.
            setLoading(true);
            try {
                // Fetch Product Details (only if not loaded)
                if (!product) {
                    const productRes = await axios.get(`${API_BASE}/products/${id}`);
                    setProduct(productRes.data);
                }

                // Fetch Price History with Range
                const historyRes = await axios.get(`${API_BASE}/products/${id}/history?days=${timeRange}`);
                setHistory(historyRes.data.history);
            } catch (err) {
                console.error("Failed to load product", err);
                setError("Product not found or failed to load.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, timeRange]);

    if (loading && !product) {
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
                <Link to="/" className="text-blue-600 hover:underline flex items-center gap-2">
                    <ChevronLeft size={16} /> Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors">
                    <ChevronLeft size={16} className="mr-1" /> Back to Search
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 p-8 lg:p-12">
                        {/* Image Section */}
                        <div className="flex items-center justify-center bg-gray-50 rounded-xl p-8 h-96">
                            <img
                                src={product.image_url || "https://placehold.co/400x400?text=No+Image"}
                                alt={product.name}
                                className="max-h-full max-w-full object-contain mix-blend-multiply"
                            />
                        </div>

                        {/* Details Section */}
                        <div>
                            <div className="mb-6">
                                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide">
                                    {product.category || "General"}
                                </span>
                                <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-2 leading-tight">
                                    {product.name}
                                </h1>
                                <p className="text-gray-500 text-sm">SKU: {product.sku}</p>
                            </div>

                            <div className="flex items-end gap-4 mb-8">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Lowest Price</p>
                                    <p className="text-4xl font-bold text-gray-900">
                                        ₹{product.lowest_market_price?.toLocaleString()}
                                    </p>
                                </div>
                                {product.your_price > product.lowest_market_price && (
                                    <div className="mb-1 text-sm text-red-500 font-medium">
                                        Price Alert: Market is cheaper!
                                    </div>
                                )}
                            </div>

                            {/* Competitors List */}
                            <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <ShoppingCart size={18} /> Available At
                                </h3>
                                <div className="space-y-3">
                                    {product.competitor_prices?.map((comp, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                            <div className="font-medium text-gray-700">{comp.name}</div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-gray-900">₹{comp.price?.toLocaleString()}</span>
                                                <a
                                                    href={comp.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                >
                                                    <ExternalLink size={18} />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200">
                                Set Price Alert
                            </button>
                        </div>
                    </div>

                    {/* Price History Section */}
                    <div className="border-t border-gray-100 p-8 lg:p-12 bg-gray-50/50">
                        <div className="max-w-5xl mx-auto">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Calendar className="text-blue-600" size={24} /> Price History
                                    </h3>
                                    <p className="text-gray-500 text-sm mt-1">Track price changes over time</p>
                                </div>

                                <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                                    {/* Range Selector */}
                                    {[
                                        { label: '7 Days', val: 7 },
                                        { label: '30 Days', val: 30 },
                                        { label: '1 Year', val: 365 }
                                    ].map(range => (
                                        <button
                                            key={range.val}
                                            onClick={() => setTimeRange(range.val)}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${timeRange === range.val
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                                    {/* View Toggle */}
                                    <button
                                        onClick={() => setViewMode('chart')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'chart' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                        title="Chart View"
                                    >
                                        <BarChart3 size={20} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                        title="Table View"
                                    >
                                        <Table size={20} />
                                    </button>
                                </div>
                            </div>

                            {loading && !history ? (
                                <div className="h-64 flex items-center justify-center">
                                    <Loader2 className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : (
                                <div className="animate-in fade-in duration-500">
                                    {viewMode === 'chart' ? (
                                        <>
                                            <PriceHistoryChart historyData={history} />
                                            <p className="text-center text-sm text-gray-400 mt-4">
                                                * Price history for last {timeRange} days.
                                            </p>
                                        </>
                                    ) : (
                                        <PriceHistoryTable historyData={history} />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
