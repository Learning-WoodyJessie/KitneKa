import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PriceHistoryChart = ({ historyData }) => {
    if (!historyData || historyData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 text-gray-400">
                No price history available yet.
            </div>
        );
    }

    // Transform data for Recharts: Need a single array of objects with keys for lines
    // The backend returns { competitor: 'Amazon', data: [{date, price}, ...] }
    // We need [{ date: '2023-01-01', Amazon: 100, Flipkart: 105 }, ...]

    // 1. Collect all unique dates
    const allDates = new Set();
    historyData.forEach(comp => {
        comp.data.forEach(entry => allDates.add(entry.date));
    });

    // 2. Sort dates
    const sortedDates = Array.from(allDates).sort();

    // 3. Build chart data
    const chartData = sortedDates.map(date => {
        const point = { date: new Date(date).toLocaleDateString() };
        historyData.forEach(comp => {
            const entry = comp.data.find(d => d.date === date);
            if (entry) {
                point[comp.competitor] = entry.price;
            }
        });
        return point;
    });

    const colors = ["#2563eb", "#db2777", "#16a34a", "#ea580c"]; // Blue, Pink, Green, Orange

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Price History</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: '500' }}
                        />
                        <Legend />
                        {historyData.map((comp, index) => (
                            <Line
                                key={comp.competitor}
                                type="monotone"
                                dataKey={comp.competitor}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PriceHistoryChart;
