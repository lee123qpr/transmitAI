import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { CreditCard, ExternalLink } from 'lucide-react';
import { useDocumentStore } from '../services/store';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const BillingSettings: React.FC = () => {
    const { user } = useUser();
    const { subscriptionTier } = useDocumentStore();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleManageSubscription = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/create-portal-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    email: user?.primaryEmailAddress?.emailAddress,
                    returnUrl: window.location.href
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
                alert('Failed to open billing portal. You may not have an active subscription.');
            }
        } catch (error: unknown) {
            console.error('Billing Portal Error:', error);
            if (error instanceof Error) {
                alert(`Error opening billing portal: ${error.message}`);
            } else {
                alert('Error opening billing portal');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 w-full max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Subscription & Billing</h2>

            {/* Current Plan Card */}
            <div className={`border rounded-xl p-6 shadow-sm mb-6 ${subscriptionTier === 'business' ? 'bg-slate-900 border-slate-900 text-white' :
                subscriptionTier === 'pro' ? 'bg-blue-50 border-blue-100' :
                    'bg-white border-slate-200'
                }`}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className={`text-sm font-medium mb-1 ${subscriptionTier === 'business' ? 'text-slate-400' : 'text-slate-500'}`}>Current Plan</p>
                        <h3 className={`text-2xl font-bold capitalize ${subscriptionTier === 'business' ? 'text-white' : 'text-slate-900'}`}>{subscriptionTier} Plan</h3>
                        <p className={`text-sm mt-2 ${subscriptionTier === 'business' ? 'text-slate-300' : 'text-slate-500'}`}>
                            {subscriptionTier === 'free' && 'Upgrade to remove limits.'}
                            {subscriptionTier === 'pro' && 'Great for individuals.'}
                            {subscriptionTier === 'business' && 'Powering your entire team.'}
                        </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                        ${subscriptionTier === 'free' ? 'bg-slate-100 text-slate-600' :
                            subscriptionTier === 'pro' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-400 text-slate-900'}`}>
                        {subscriptionTier}
                    </div>
                </div>
            </div>

            {/* Actions Section */}
            <div className="space-y-4">
                {/* Upgrade to Pro (Visible only for Free) */}
                {subscriptionTier === 'free' && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h4 className="font-bold text-blue-900">Upgrade to Pro</h4>
                            <p className="text-sm text-blue-700 mt-1">Get 500 documents/mo and unlimited history.</p>
                        </div>
                        <button
                            onClick={() => document.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
                            className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                        >
                            Upgrade Now
                        </button>
                    </div>
                )}

                {/* Upgrade to Business (Visible for Pro) */}
                {subscriptionTier === 'pro' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                Upgrade to Business
                                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full uppercase font-bold">Recommended</span>
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">Need more? Get 2,500 documents/mo and priority support.</p>
                        </div>
                        <button
                            onClick={handleManageSubscription} // Portal handles upgrades
                            disabled={isLoading}
                            className="whitespace-nowrap px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
                        >
                            {isLoading ? 'Loading...' : 'Update Plan'}
                            <ExternalLink size={14} />
                        </button>
                    </div>
                )}

                {/* Manage Subscription (Visible for Paid) */}
                {subscriptionTier !== 'free' && (
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                            <CreditCard size={18} />
                            Manage Subscription
                        </h4>
                        <p className="text-slate-600 text-sm mb-4">
                            Update payment method, download invoices, or cancel subscription.
                        </p>
                        <button
                            onClick={handleManageSubscription}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors shadow-sm"
                        >
                            {isLoading ? 'Loading...' : 'Open Customer Portal'}
                            <ExternalLink size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillingSettings;
