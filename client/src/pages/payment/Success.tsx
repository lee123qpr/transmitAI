import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useUser, useAuth } from '@clerk/clerk-react';
import SEO from '../../components/SEO';

const Success = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'verifying' | 'success' | 'timeout'>('verifying');
    const [countdown, setCountdown] = useState(5);

    // Poll for subscription update
    useEffect(() => {
        if (!isLoaded || !user) return;

        let attempts = 0;
        const maxAttempts = 20; // 20 attempts * 2s = 40s max wait
        let simulationTriggered = false;

        const checkStatus = async () => {
            try {
                // Fetch fresh user data from YOUR backend, not just Clerk
                const token = await getToken();
                const res = await fetch(`/api/user?userId=${user.id}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                const data = await res.json();

                // Check if tier is no longer 'free' (or matches expected)
                // For simplicity, any non-free tier is a success for now
                if (data.subscription_tier !== 'free') {
                    setStatus('success');
                    return true;
                }

                // LOCALHOST FALLBACK: If webhook hasn't fired after 10s (5 attempts), simulate it
                if (!simulationTriggered && attempts >= 5 && window.location.hostname === 'localhost') {
                    simulationTriggered = true;
                    console.log('[DEV] Webhook timeout detected on localhost. Triggering simulation...');

                    // Call the simulate endpoint
                    try {
                        const planType = searchParams.get('plan') || 'pro'; // Get plan from URL params
                        const simRes = await fetch('/api/webhooks/simulate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.id, planType })
                        });

                        if (simRes.ok) {
                            console.log('[DEV] Webhook simulation successful');
                        }
                    } catch (err) {
                        console.error('[DEV] Failed to simulate webhook:', err);
                    }
                }
            } catch (err) {
                console.error("Error polling status:", err);
            }
            return false;
        };

        const interval = setInterval(async () => {
            attempts++;
            const isUpdated = await checkStatus();

            if (isUpdated) {
                clearInterval(interval);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                setStatus('timeout');
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [user, isLoaded, searchParams]);

    // Redirect countdown (only starts after success)
    useEffect(() => {
        if (status !== 'success') return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/app/dashboard');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <SEO title="Payment Processing | Transmit.AI" />
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center animate-fade-in-up">

                {status === 'verifying' && (
                    <>
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Loader2 size={40} className="animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Finalizing Upgrade...</h1>
                        <p className="text-slate-600 mb-8">
                            We're confirming your payment with Stripe. This usually takes a few seconds.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 scale-in-center">
                            <CheckCircle size={40} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">You're a Pro!</h1>
                        <p className="text-slate-600 mb-8">
                            Your account has been successfully upgraded. Redirecting you to the dashboard...
                        </p>
                        <p className="text-sm text-slate-400 mb-6">
                            Redirecting in {countdown}s
                        </p>
                        <button
                            onClick={() => navigate('/app/dashboard')}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            Return to Dashboard <ArrowRight size={18} />
                        </button>
                    </>
                )}

                {status === 'timeout' && (
                    <>
                        <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 size={40} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Still Processing</h1>
                        <p className="text-slate-600 mb-6">
                            We received your payment, but your account update is taking longer than expected.
                        </p>
                        <div className="bg-yellow-50 text-yellow-800 text-sm p-4 rounded-lg mb-6 text-left">
                            <strong>Developer Note:</strong><br />
                            If you are running on Localhost, make sure your specific Stripe Webhook CLI is running!
                            <code className="block mt-2 bg-black/10 p-2 rounded">stripe listen --forward-to localhost:3000/api/webhooks/stripe</code>
                        </div>
                        <button
                            onClick={() => navigate('/app/dashboard')}
                            className="text-slate-500 hover:text-slate-900 underline text-sm"
                        >
                            Continue to Dashboard anyway
                        </button>
                    </>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-mono">
                        Session ID: {sessionId ? `${sessionId.substring(0, 10)}...` : 'N/A'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Success;
