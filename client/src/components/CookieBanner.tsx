import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Cookie } from 'lucide-react';

const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkConsent = () => {
            const consent = localStorage.getItem('cookieConsent');
            if (consent) {
                // If there's already consent saved, ensure banner is hidden
                setIsVisible(false);
            } else {
                // If no consent, show the banner
                setIsVisible(true);
            }
        };
        checkConsent();
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        setIsVisible(false);
        // Here you would typically initialize your analytics/tracking scripts
    };

    const handleReject = () => {
        localStorage.setItem('cookieConsent', 'rejected');
        setIsVisible(false);
        // Here you would ensure non-essential cookies are blocked
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 sm:pb-4 pb-safe bg-white border-t border-slate-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] transform transition-transform duration-500 ease-out">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

                <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-blue-50 rounded-full hidden sm:block">
                        <Cookie className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                            <span className="sm:hidden"><Cookie className="w-5 h-5 text-blue-600" /></span>
                            We value your privacy
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                            We use essential cookies to make our site work. With your consent, we may also use non-essential cookies to improve user experience and analyse website traffic. By clicking "Accept All", you agree to our website's cookie use as described in our <Link to="/legal/cookies" className="text-blue-600 hover:text-blue-800 underline underline-offset-2 font-medium">Cookie Policy</Link>.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0 self-stretch sm:self-auto">
                    <button
                        onClick={handleReject}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-lg border-2 border-slate-200 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-colors"
                    >
                        Reject Non-Essential
                    </button>
                    <button
                        onClick={handleAccept}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors"
                    >
                        Accept All
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors hidden lg:block"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CookieBanner;
