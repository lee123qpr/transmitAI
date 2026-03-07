import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { CreditCard, ExternalLink, Zap } from 'lucide-react';
import { useDocumentStore } from '../services/store';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const BillingSettings: React.FC = () => {
    const { user } = useUser();
    const { subscriptionTier, usage, createdAt, renewalDate, cancelAtPeriodEnd } = useDocumentStore();
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
                        <div className={`mt-4 pt-4 border-t ${subscriptionTier === 'business' ? 'border-slate-800' : 'border-slate-100'}`}>
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                                <div>
                                    <p className={`text-xs uppercase tracking-wider mb-1 ${subscriptionTier === 'business' ? 'text-slate-500' : 'text-slate-400'}`}>Member Since</p>
                                    <p className={`text-sm font-medium ${subscriptionTier === 'business' ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {createdAt ? new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown'}
                                    </p>
                                </div>
                                {subscriptionTier !== 'free' && renewalDate && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className={`text-xs uppercase tracking-wider ${cancelAtPeriodEnd ? 'text-red-500' : (subscriptionTier === 'business' ? 'text-slate-500' : 'text-slate-400')}`}>
                                                {cancelAtPeriodEnd ? 'Cancels On' : 'Renews On'}
                                            </p>
                                            {cancelAtPeriodEnd && (
                                                <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                    Pending Cancellation
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm font-medium ${cancelAtPeriodEnd ? 'text-red-600' : (subscriptionTier === 'business' ? 'text-slate-300' : 'text-slate-700')}`}>
                                            {new Date(renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                            ${subscriptionTier === 'free' ? 'bg-slate-100 text-slate-600' :
                                subscriptionTier === 'pro' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-400 text-slate-900'}`}>
                            {subscriptionTier}
                        </div>
                        <div className={`text-right ${subscriptionTier === 'business' ? 'text-slate-300' : 'text-slate-600'}`}>
                            <p className="text-xs uppercase tracking-wider mb-1 opacity-70">Current Usage</p>
                            <p className="text-lg font-bold">
                                {usage.current} <span className="text-sm font-normal opacity-75">/ {usage.limit} Docs</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Section */}
            <div className="space-y-4">
                {/* Upgrade Options (Visible for Free / Pro) */}
                {subscriptionTier !== 'business' && (
                    <div className="space-y-4 mt-8">
                        <h3 className="font-bold text-slate-900 text-lg border-b pb-2">Upgrade Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pro Plan */}
                            {subscriptionTier === 'free' && (
                                <div className="border border-blue-100 rounded-xl p-6 flex flex-col bg-slate-50 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Zap size={64} className="fill-blue-700" />
                                    </div>
                                    <div className="relative z-10 flex-1 flex flex-col">
                                        <div className="inline-flex items-center w-fit gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-4">
                                            <Zap size={14} className="fill-blue-700" /> PRO
                                        </div>
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-3xl font-bold text-slate-900">£20</span>
                                            <span className="text-slate-500 font-medium">/mo</span>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-6">Perfect for individuals. Get 500 documents/mo and unlimited history.</p>
                                        <button
                                            onClick={() => document.dispatchEvent(new CustomEvent('open-upgrade-modal'))}
                                            className="w-full mt-auto px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                                        >
                                            Upgrade to Pro
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Business Plan */}
                            <div className={`border rounded-xl p-6 flex flex-col relative overflow-hidden group ${subscriptionTier === 'free' ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className={`absolute top-0 right-0 p-4 transition-opacity ${subscriptionTier === 'free' ? 'opacity-10 group-hover:opacity-20' : 'opacity-5 group-hover:opacity-10'}`}>
                                    <Zap size={64} className={subscriptionTier === 'free' ? 'fill-yellow-400 text-yellow-400' : ''} />
                                </div>
                                <div className="relative z-10 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${subscriptionTier === 'free' ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>
                                            <Zap size={14} className="fill-yellow-400 text-yellow-400" /> BUSINESS
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${subscriptionTier === 'free' ? 'bg-yellow-100/10 text-yellow-400 border border-yellow-400/20' : 'bg-yellow-100 text-yellow-800 border-none'}`}>Recommended</span>
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className={`text-3xl font-bold ${subscriptionTier === 'free' ? 'text-white' : 'text-slate-900'}`}>£60</span>
                                        <span className={`font-medium ${subscriptionTier === 'free' ? 'text-slate-400' : 'text-slate-500'}`}>/mo</span>
                                    </div>
                                    <p className={`text-sm mb-6 ${subscriptionTier === 'free' ? 'text-slate-300' : 'text-slate-600'}`}>For high-volume teams. Get 2,500 documents/mo and priority support.</p>

                                    <button
                                        onClick={subscriptionTier === 'free'
                                            ? () => document.dispatchEvent(new CustomEvent('open-upgrade-modal'))
                                            : handleManageSubscription
                                        }
                                        disabled={isLoading}
                                        className={`w-full mt-auto px-4 py-3 font-medium rounded-lg transition-colors shadow-sm flex justify-center items-center gap-2
                                            ${subscriptionTier === 'free'
                                                ? 'bg-yellow-400 hover:bg-yellow-500 text-slate-900'
                                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                                            }`}
                                    >
                                        {isLoading ? 'Loading...' : 'Get Business'}
                                        {subscriptionTier !== 'free' && <ExternalLink size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
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
