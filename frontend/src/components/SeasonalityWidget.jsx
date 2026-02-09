import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

const SeasonalityWidget = () => {
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTips = async () => {
            try {
                const response = await axios.get(`${API_BASE}/seasonality/tips`);
                setTips(response.data.tips);
            } catch (error) {
                console.error("Failed to fetch seasonal tips", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTips();
    }, []);

    if (loading) return null;

    if (!tips.length) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>

            <div className="flex items-start gap-4 z-10 relative">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Calendar size={24} className="text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold mb-1">Smart Buying Tip</h3>
                    <div className="space-y-3">
                        {tips.map((tip, index) => (
                            <div key={index}>
                                <p className="font-medium text-white/90 text-sm">{tip.title}</p>
                                <p className="text-indigo-100 text-xs mt-1 leading-relaxed">
                                    {tip.description}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium bg-white/10 w-fit px-3 py-1.5 rounded-full">
                        <TrendingUp size={14} />
                        <span>AI Market Analysis</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeasonalityWidget;
