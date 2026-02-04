import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TIME_RANGES = [
    { label: '1W', days: 7 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: '6M', days: 180 },
    { label: '1Y', days: 365 },
];

const PriceHistoryChart = ({ currentPrice, priceHistory }) => {
    const [activeRange, setActiveRange] = useState(TIME_RANGES[1]); // Default 1M
    const [chartData, setChartData] = useState([]);

    // Generate simulated data if real history is missing
    const generateSimulatedData = (days, basePrice) => {
        const data = [];
        const now = new Date();
        // Volatility factor: roughly +/- 15% range over the period
        const range = basePrice * 0.15;

        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Random walk simulation
            // Add some seasonality/trend: 
            // e.g., lower prices 3 months ago, higher now? or random.
            // Let's make it look organic with sine wave + random noise
            const noise = (Math.random() - 0.5) * (basePrice * 0.05); // 5% noise
            const trend = Math.sin(i / 30) * (basePrice * 0.05); // Monthly cycle

            // Ensure the last point matches current price exactly
            let price = basePrice + noise + trend;
            if (i === 0) price = basePrice;

            data.push({
                date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                timestamp: date,
                price: Math.round(price)
            });
        }
        return data;
    };

    useEffect(() => {
        if (priceHistory && priceHistory.length > 0) {
            // Process real data if available
            // filter based on activeRange.days
            setChartData(priceHistory);
        } else if (currentPrice) {
            // Generate mock data on mount or range change
            setChartData(generateSimulatedData(activeRange.days, currentPrice));
        }
    }, [currentPrice, priceHistory, activeRange]);

    // Calculate stats
    const stats = useMemo(() => {
        if (!chartData.length) return { min: 0, max: 0, current: 0 };
        const prices = chartData.map(d => d.price);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
            current: prices[prices.length - 1]
        };
    }, [chartData]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-sm">
                    <p className="font-medium text-gray-500 mb-1">{label}</p>
                    <p className="text-blue-600 font-bold text-lg">
                        ₹{payload[0].value.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Best Market Price</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Price History</h3>
                    <p className="text-sm text-gray-500">
                        Lowest: <span className="font-medium text-green-600">₹{stats.min.toLocaleString()}</span> •
                        Highest: <span className="font-medium text-red-500">₹{stats.max.toLocaleString()}</span>
                    </p>
                </div>

                <div className="flex bg-gray-50 p-1 rounded-lg self-start">
                    {TIME_RANGES.map((range) => (
                        <button
                            key={range.label}
                            onClick={() => setActiveRange(range)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeRange.label === range.label
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            minTickGap={30}
                        />
                        <YAxis
                            hide={true}
                            domain={['dataMin - 100', 'dataMax + 100']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#2563eb"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PriceHistoryChart;
