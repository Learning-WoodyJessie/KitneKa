import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, TrendingUp, ShieldCheck, Zap, ArrowRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LandingPage = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    // Initial hero search input state
    const [heroQuery, setHeroQuery] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleGetStarted = (e) => {
        if (e) e.preventDefault();
        navigate('/search');
    };

    const handleHeroSearch = (e) => {
        e.preventDefault();
        if (heroQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(heroQuery)}`);
        } else {
            navigate('/search');
        }
    };

    const benefits = [
        {
            icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
            title: "Real-Time Price Tracking",
            description: "Track price history across major retailers to buy at the perfect moment."
        },
        {
            icon: <MapPin className="w-8 h-8 text-purple-600" />,
            title: "Local Store Discovery",
            description: "Find the best deals in your neighborhood stores, not just online giants."
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-green-600" />,
            title: "AI Authenticity Checks",
            description: "Our AI verifies seller credibility so you can shop with total confidence."
        },
        {
            icon: <Zap className="w-8 h-8 text-amber-500" />,
            title: "Instant Comparison",
            description: "Compare prices from Amazon, Flipkart, Instagram, and local shops in one click."
        }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob"></div>
                    <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-br from-amber-100/40 to-pink-100/40 rounded-full blur-3xl mix-blend-multiply filter opacity-70 animate-blob animation-delay-2000"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 mb-8 shadow-sm"
                        >
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-xs font-semibold tracking-wide uppercase text-slate-600">The Future of Shopping is Here</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]"
                        >
                            Sahi Daam. <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Sahi Dukaan.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed"
                        >
                            Stop overpaying. Compare prices across online giants, Instagram sellers, and your local neighborhood stores instantly with KitneKa.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                        >
                            <form onSubmit={handleHeroSearch} className="relative w-full max-w-md group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search for shoes, mobiles, handbags..."
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-100 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-lg"
                                    value={heroQuery}
                                    onChange={(e) => setHeroQuery(e.target.value)}
                                />
                            </form>
                            <button
                                onClick={handleGetStarted}
                                className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                Get Started <ArrowRight className="h-4 w-4" />
                            </button>
                        </motion.div>

                        {/* Social Proof / Stats */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 0.8 }}
                            className="mt-16 pt-8 border-t border-slate-100 flex flex-wrap justify-center gap-8 md:gap-16 grayscale opacity-80"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-2xl text-slate-900">50K+</span>
                                <span className="text-sm text-slate-500 text-left leading-tight">Products<br />Tracked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-2xl text-slate-900">1.2K+</span>
                                <span className="text-sm text-slate-500 text-left leading-tight">Local<br />Stores</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-2xl text-slate-900">₹2Cr+</span>
                                <span className="text-sm text-slate-500 text-left leading-tight">Money<br />Saved</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>


            {/* BENEFITS SECTION */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold tracking-widest uppercase mb-4">Why KitneKa?</div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Smart Shopping, Simplified.</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">We bring the entire market to your fingertips, helping you make the best buying decisions in seconds.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
                            >
                                <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
                                <p className="text-slate-600 leading-relaxed text-sm">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-16 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-amber-500/10 to-pink-500/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Ready to stop overpaying?</h2>
                            <p className="text-slate-400 text-lg mb-10">Join thousands of smart shoppers who save money on every purchase with KitneKa.</p>
                            <button
                                onClick={handleGetStarted}
                                className="px-10 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-all transform hover:scale-105 shadow-xl"
                            >
                                Start Saving Now
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">KitneKa.</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Your personal shopping assistant for the best prices online and locally.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-wider">Product</h4>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Download App</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-wider">Company</h4>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-wider">Connect</h4>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-all text-slate-400 hover:text-blue-600">
                                    <span className="sr-only">Twitter</span>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-all text-slate-400 hover:text-blue-600">
                                    <span className="sr-only">Instagram</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium">
                        <p>&copy; {new Date().getFullYear()} BharatPricing. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
                            <a href="#" className="hover:text-slate-600">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
