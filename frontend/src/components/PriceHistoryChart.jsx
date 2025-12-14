import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PriceHistoryChart = ({ historyData }) => {
    if (!historyData || historyData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                No price history available.
            </div>
        );
    }

    // Transform data for Recharts
    // Backend: [{ competitor: "Amazon", data: [{date, price}] }]
    // Target: [{ date: "2023-10-01", Amazon: 100, Flipkart: 105 }]

    // 1. Collect all unique dates
    const allDates = new Set();
    historyData.forEach(comp => {
        comp.data.forEach(point => allDates.add(point.date));
    });
    const sortedDates = Array.from(allDates).sort();

    // 2. Build chart data
    const chartData = sortedDates.map(date => {
        const point = {
            displayDate: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }),
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
                        minTickGap={30}
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
