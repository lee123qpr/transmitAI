import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const NewsletterModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        // Check if user has already seen/closed the modal recently, or subscribed
        const hasSubscribed = localStorage.getItem('transmit_newsletter_subscribed');
        const closedAt = localStorage.getItem('transmit_newsletter_closed_at');

        if (hasSubscribed) return;

        if (closedAt) {
            const closedDate = new Date(closedAt);
            const now = new Date();
            const daysSinceClosed = (now.getTime() - closedDate.getTime()) / (1000 * 3600 * 24);
            // Don't show again for 7 days if they closed it
            if (daysSinceClosed < 7) return;
        }

        // Show modal after 10 seconds
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('transmit_newsletter_closed_at', new Date().toISOString());
    };

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

            if (!res.ok) throw new Error('Failed to subscribe');

            setStatus('success');
            localStorage.setItem('transmit_newsletter_subscribed', 'true');

            // Auto close after 3 seconds on success
            setTimeout(() => {
                setIsOpen(false);
            }, 3000);
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            setStatus('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 mx-auto">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                <div className="relative p-8 overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                            <Send size={24} />
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                            Get Construction AI Insights
                        </h3>
                        <p className="text-slate-500 text-sm mb-8 font-medium leading-relaxed">
                            Join our newsletter. We share the latest strategies for automating document control and streamlining construction workflows. No spam, ever.
                        </p>

                        {status === 'success' ? (
                            <div className="p-4 bg-green-50 text-green-700 text-sm font-bold rounded-xl border border-green-100 text-center animate-in zoom-in duration-300">
                                🎉 Thanks for subscribing! You're on the list.
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full px-5 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                                >
                                    {status === 'loading' ? 'Subscribing...' : 'Subscribe Now'}
                                </button>
                                {status === 'error' && (
                                    <p className="text-red-500 text-xs font-bold text-center mt-2 animate-in slide-in-from-top-1">
                                        Failed to subscribe. Please try again.
                                    </p>
                                )}
                            </form>
                        )}

                        <p className="text-center text-[10px] text-slate-400 font-medium mt-6 uppercase tracking-wider">
                            You can unsubscribe at any time
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsletterModal;
