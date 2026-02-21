import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, CheckCircle, Zap, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useDocumentStore } from '../services/store';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
    const { user } = useUser();
    const { subscriptionTier } = useDocumentStore();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    // Hooks must be called before this return
    if (!isOpen) return null;

    const handleUpgrade = async (planType: 'pro_monthly' | 'pro_yearly' | 'business_monthly' | 'business_yearly') => {
        setIsLoading(planType);
        setError(null);
        try {
            if (!user) {
                setError('You must be logged in to upgrade.');
                return;
            }

            const res = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.primaryEmailAddress?.emailAddress,
                    returnUrl: window.location.origin,
                    planType
                })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Server error: ${res.status} ${res.statusText} ${text.substring(0, 100)}`);
            }

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('Checkout error:', data);
                setError(data.error || 'Failed to start checkout. Please try again.');
            }
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Network error. Please check your connection.';
            setError(message);
        } finally {
            setIsLoading(null);
        }
    };

    const isPro = subscriptionTier === 'pro';
    const isBusiness = subscriptionTier === 'business';

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[999999] flex items-start justify-center bg-slate-900/50 backdrop-blur-sm overflow-y-auto py-8 px-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-3xl relative animate-fade-in-up flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col overflow-y-auto">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 text-center sticky top-0 z-10 bg-slate-50">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Upgrade Your Plan</h2>
                        <p className="text-slate-600 mb-4">Choose the best plan for your needs</p>

                        {/* Billing Cycle Toggle */}
                        <div className="inline-flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-lg">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'monthly'
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'yearly'
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                Yearly
                                <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Save</span>
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-6 mt-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                        {/* Pro Plan */}
                        <div className="p-6 md:w-1/2 flex flex-col items-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-4">
                                <Zap size={14} className="fill-blue-700" /> PRO
                            </div>
                            <div className="text-center mb-6">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold text-slate-900">
                                        £{billingCycle === 'monthly' ? '20' : '200'}
                                    </span>
                                    <span className="text-slate-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                </div>
                                {billingCycle === 'yearly' && (
                                    <p className="text-xs text-green-600 font-medium mt-1">Save £40/year</p>
                                )}
                                <p className="text-xs text-slate-400 mt-1">Perfect for individuals</p>
                            </div>

                            <ul className="space-y-3 mb-8 w-full">
                                <li className="flex gap-2 text-sm text-slate-700"><CheckCircle size={16} className="text-green-500 shrink-0" /> 500 Documents/mo</li>
                                <li className="flex gap-2 text-sm text-slate-700"><CheckCircle size={16} className="text-green-500 shrink-0" /> Export to Excel & PDF</li>
                                <li className="flex gap-2 text-sm text-slate-700"><CheckCircle size={16} className="text-green-500 shrink-0" /> Unlimited History</li>
                            </ul>

                            <button
                                onClick={() => handleUpgrade(billingCycle === 'monthly' ? 'pro_monthly' : 'pro_yearly')}
                                disabled={isLoading !== null || isPro || isBusiness}
                                className={`w-full py-2.5 px-4 font-bold rounded-lg shadow-md transition-all mt-auto flex justify-center items-center gap-2
                                    ${isPro || isBusiness
                                        ? 'bg-green-100 text-green-700 cursor-default'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                                    }`}
                            >
                                {(isLoading === 'pro_monthly' || isLoading === 'pro_yearly') && <Loader2 size={16} className="animate-spin" />}
                                {isPro || isBusiness ? 'Plan Active' : 'Upgrade to Pro'}
                            </button>
                        </div>

                        {/* Business Plan */}
                        <div className="p-6 md:w-1/2 flex flex-col items-center bg-slate-50/50">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold mb-4">
                                <Zap size={14} className="fill-yellow-400 text-yellow-400" /> BUSINESS
                            </div>
                            <div className="text-center mb-6">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold text-slate-900">
                                        £{billingCycle === 'monthly' ? '60' : '600'}
                                    </span>
                                    <span className="text-slate-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                </div>
                                {billingCycle === 'yearly' && (
                                    <p className="text-xs text-green-600 font-medium mt-1">Save £120/year (2 months free)</p>
                                )}
                                <p className="text-xs text-slate-400 mt-1">For high-volume teams</p>
                            </div>

                            <ul className="space-y-3 mb-8 w-full">
                                <li className="flex gap-2 text-sm text-slate-700"><CheckCircle size={16} className="text-slate-900 shrink-0" /> <strong>2,500 Documents</strong>/mo</li>
                                <li className="flex gap-2 text-sm text-slate-700"><CheckCircle size={16} className="text-slate-900 shrink-0" /> Priority Processing</li>
                                <li className="flex gap-2 text-sm text-slate-700"><CheckCircle size={16} className="text-slate-900 shrink-0" /> Dedicated Support</li>
                            </ul>

                            <button
                                onClick={() => handleUpgrade(billingCycle === 'monthly' ? 'business_monthly' : 'business_yearly')}
                                disabled={isLoading !== null || isBusiness}
                                className={`w-full py-2.5 px-4 font-bold rounded-lg shadow-md transition-all mt-auto flex justify-center items-center gap-2
                                    ${isBusiness
                                        ? 'bg-green-100 text-green-700 cursor-default'
                                        : 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-105'
                                    }`}
                            >
                                {(isLoading === 'business_monthly' || isLoading === 'business_yearly') && <Loader2 size={16} className="animate-spin" />}
                                {isBusiness ? 'Plan Active' : 'Get Business'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UpgradeModal;
