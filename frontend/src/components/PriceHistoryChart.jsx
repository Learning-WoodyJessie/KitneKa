import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PriceHistoryChart = ({ historyData, timeRange }) => {
    if (!historyData || historyData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                No price history available.
            </div>
        );
    }

    // Transform data for Recharts
    let chartData = [];
    const isYearly = timeRange >= 365;

    if (isYearly) {
        // Aggregate by Month
        const monthlyData = {}; // Key: "MMM YY" -> { date: timestamp, counts: {}, sums: {} }

        historyData.forEach(comp => {
            comp.data.forEach(point => {
                const dateObj = new Date(point.date);
                const key = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); // "Dec 24"

                if (!monthlyData[key]) {
                    monthlyData[key] = {
                        displayDate: key,
                        rawDate: dateObj.getTime(), // Use timestamp for sorting
                        prices: {}
                    };
                }

                if (!monthlyData[key].prices[comp.competitor]) {
                    monthlyData[key].prices[comp.competitor] = { sum: 0, count: 0 };
                }
                monthlyData[key].prices[comp.competitor].sum += point.price;
                monthlyData[key].prices[comp.competitor].count += 1;
            });
        });

        // Convert to array and average prices
        chartData = Object.values(monthlyData)
            .sort((a, b) => a.rawDate - b.rawDate)
            .map(item => {
                const point = { displayDate: item.displayDate };
                Object.keys(item.prices).forEach(comp => {
                    const { sum, count } = item.prices[comp];
                    point[comp] = Math.round(sum / count);
                });
                return point;
            });

    } else {
        // Daily Data (Existing Logic)
        const allDates = new Set();
        historyData.forEach(comp => {
            comp.data.forEach(point => allDates.add(point.date));
        });
        const sortedDates = Array.from(allDates).sort();

        chartData = sortedDates.map(date => {
            const point = {
                displayDate: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                rawDate: date
            };

            historyData.forEach(comp => {
                const match = comp.data.find(d => d.date === date);
                if (match) {
                    point[comp.competitor] = match.price;
                }
            });
            return point;
        });
    }

    const colors = ["#2563eb", "#db2777", "#16a34a", "#ca8a04", "#9333ea"];

    return (
        <div className="h-96 w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="displayDate"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={isYearly ? 0 : 30} // Show all months if possible, gap for days
                        interval={isYearly ? 0 : 'preserveStartEnd'}
                    />
                    <YAxis
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value}`}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`₹${value}`, 'Price']}
                    />
                    <Legend />
                    {historyData.map((comp, idx) => (
                        <Line
                            key={comp.competitor}
                            type="monotone"
                            dataKey={comp.competitor}
                            stroke={colors[idx % colors.length]}
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 8 }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PriceHistoryChart;
