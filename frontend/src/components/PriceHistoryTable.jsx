import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

const PriceHistoryTable = ({ historyData }) => {
    if (!historyData || historyData.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No history data available.
            </div>
        );
    }

    // Flatten data: [{ date, store, price, url }]
    const flatData = [];
    historyData.forEach(comp => {
        comp.data.forEach(point => {
            flatData.push({
                dateObj: new Date(point.date),
                date: new Date(point.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
                store: comp.competitor,
                price: point.price,
                url: comp.url
            });
        });
    });

    // Default sort by Date Descending
    const [sortConfig, setSortConfig] = useState({ key: 'dateObj', direction: 'desc' });

    const sortedData = [...flatData].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <div className="w-4 h-4 ml-1 inline-block text-gray-300">↕</div>;
        return sortConfig.direction === 'asc'
            ? <ChevronUp className="w-4 h-4 ml-1 inline-block text-blue-500" />
            : <ChevronDown className="w-4 h-4 ml-1 inline-block text-blue-500" />;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => requestSort('dateObj')}
                            >
                                Date <SortIcon columnKey="dateObj" />
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => requestSort('store')}
                            >
                                Store <SortIcon columnKey="store" />
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => requestSort('price')}
                            >
                                Price (₹) <SortIcon columnKey="price" />
                            </th>
                            <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {row.date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                    {row.store}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                    ₹{row.price.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                                        Visit <ExternalLink size={14} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {sortedData.length > 10 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 text-center">
                    Showing top 10 recent records (scroll table for more if applicable)
                    {/* Simplified for now, real pagination could be added */}
                </div>
            )}
        </div>
    );
};

export default PriceHistoryTable;
