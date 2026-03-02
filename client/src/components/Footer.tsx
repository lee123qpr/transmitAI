import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Instagram, Linkedin, Youtube, Send, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                    <div className="lg:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white">
                                <Layers size={14} strokeWidth={3} />
                            </div>
                            <span className="font-bold text-lg text-slate-900">Transmit<span className="text-blue-600">.AI</span></span>
                        </Link>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Automating document extraction for the construction industry. Save hours of manual data entry with AI.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-slate-500">
                            <li><Link to="/how-it-works" className="hover:text-blue-600 transition-colors">How It Works</Link></li>
                            <li><Link to="/articles" className="hover:text-blue-600 transition-colors">Articles</Link></li>
                            <li><a href="/#features" className="hover:text-blue-600 transition-colors">Features</a></li>
                            <li><a href="/#pricing" className="hover:text-blue-600 transition-colors">Pricing</a></li>
                            <li><Link to="/faq" className="hover:text-blue-600 transition-colors">FAQs</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-slate-500">
                            <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact Us</Link></li>
                            <li><Link to="/legal/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/legal/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
                            <li><Link to="/legal/cookies" className="hover:text-blue-600 transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>

                    <div className="lg:col-span-1">
                        <h4 className="font-semibold text-slate-900 mb-4">Stay Updated</h4>
                        <p className="text-sm text-slate-500 mb-4">
                            Subscribe to our newsletter for the latest AI updates and features.
                        </p>
                        <NewsletterForm />
                    </div>

                    <div className="lg:col-span-1">
                        <h4 className="font-semibold text-slate-900 mb-4">Follow Us</h4>
                        <div className="flex gap-4">
                            <a href="https://www.instagram.com/transmit_ai/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-pink-50 hover:text-pink-600 transition-all">
                                <Instagram size={18} />
                            </a>
                            <a href="https://www.linkedin.com/company/transmit-ai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all">
                                <Linkedin size={18} />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
                                <Youtube size={18} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-400">© 2026 Transmit.AI Ltd. All rights reserved.</p>
                    <div className="flex gap-6 text-xs text-slate-400">
                        <span>Made with ❤️ in London</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const NewsletterForm = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');
        try {
            const res = await fetch(`${API_URL}/newsletter/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!res.ok) throw new Error();
            setStatus('success');
            setEmail('');
        } catch {
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 size={16} />
                <span className="text-xs font-bold">Successfully subscribed!</span>
            </div>
        );
    }

    return (
        <form className="space-y-2 mb-6" onSubmit={handleSubmit}>
            <div className="relative">
                <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
            </div>
            <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
                {status === 'loading' ? 'Subscribing...' : (
                    <>
                        <span>Subscribe</span>
                        <Send size={14} />
                    </>
                )}
            </button>
            {status === 'error' && (
                <p className="text-[10px] text-red-500 font-bold px-1">Failed to subscribe. Try again.</p>
            )}
        </form>
    );
};

export default Footer;
