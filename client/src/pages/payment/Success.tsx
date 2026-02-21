import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useDocumentStore } from '../../services/store';
import SEO from '../../components/SEO';

const Success = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const { fetchUserStatus } = useDocumentStore();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMsg, setErrorMsg] = useState('');
    const [countdown, setCountdown] = useState(5);

    // Primary method: verify the session directly with our backend
    // This is reliable in serverless as it's a pull, not a push (webhook)
    useEffect(() => {
        if (!isLoaded || !user) return;
        if (!sessionId) {
            setErrorMsg('No session ID found in URL. Please contact support.');
            setStatus('error');
            return;
        }

        const verifySession = async () => {
            try {
                const token = await getToken();
                console.log(`[Success] Verifying session ${sessionId} for user ${user.id}`);

                const res = await fetch('/api/verify-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ sessionId, userId: user.id }),
                });

                const data = await res.json();
                console.log('[Success] Verify response:', data);

                if (res.ok && data.success) {
                    await fetchUserStatus(user.id, user.primaryEmailAddress?.emailAddress, token || undefined);
                    setStatus('success');
                } else {
                    // Payment not complete yet — could be a timing issue
                    // Retry once after 3 seconds to handle any propagation delay
                    console.warn('[Success] Session not complete yet, retrying in 3s...');
                    setTimeout(async () => {
                        try {
                            const retryRes = await fetch('/api/verify-session', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                },
                                body: JSON.stringify({ sessionId, userId: user.id }),
                            });
                            const retryData = await retryRes.json();
                            if (retryRes.ok && retryData.success) {
                                await fetchUserStatus(user.id, user.primaryEmailAddress?.emailAddress, token || undefined);
                                setStatus('success');
                            } else {
                                setErrorMsg(data.message || data.error || 'Could not confirm payment. Please contact support.');
                                setStatus('error');
                            }
                        } catch {
                            setErrorMsg('Network error on retry. Please refresh.');
                            setStatus('error');
                        }
                    }, 3000);
                }
            } catch (err) {
                console.error('[Success] Verification error:', err);
                setErrorMsg('Failed to connect to payment server. Please refresh.');
                setStatus('error');
            }
        };

        verifySession();
    }, [user, isLoaded, sessionId]);

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
        <div className="min-h-screen bg-slate-50 flex items-start justify-center p-4 pt-20 md:pt-32">
            <SEO title="Payment Processing | Transmit.AI" />
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center animate-fade-in-up">

                {status === 'verifying' && (
                    <>
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Loader2 size={40} className="animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Finalising Upgrade...</h1>
                        <p className="text-slate-600 mb-8">
                            We're confirming your payment with Stripe. This usually takes a few seconds.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">You're upgraded! 🎉</h1>
                        <p className="text-slate-600 mb-4">
                            Your account has been successfully upgraded. Welcome to the next level!
                        </p>
                        <p className="text-sm text-slate-400 mb-6">
                            Redirecting to dashboard in {countdown}s...
                        </p>
                        <button
                            onClick={() => navigate('/app/dashboard')}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            Go to Dashboard <ArrowRight size={18} />
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={40} />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Issue</h1>
                        <p className="text-slate-600 mb-4">
                            {errorMsg || 'We received your payment but could not confirm your upgrade automatically.'}
                        </p>
                        <p className="text-slate-500 text-sm mb-6">
                            Please try refreshing, or go to the dashboard and contact support if your tier has not updated.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
                        >
                            Try Again
                        </button>
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
                        Session ID: {sessionId ? `${sessionId.substring(0, 12)}...` : 'N/A'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Success;
