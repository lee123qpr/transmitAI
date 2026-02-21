import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import { Menu, X, Layers, CreditCard, Zap, Building2 } from 'lucide-react';
import BillingSettings from './BillingSettings';
import CompanySettings from './CompanySettings';
import UpgradeModal from './UpgradeModal';
import { useDocumentStore } from '../services/store';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = React.useState(false);
    const { subscriptionTier, isAdmin } = useDocumentStore();
    const { user } = useUser();

    const isActuallyAdmin = isAdmin || user?.primaryEmailAddress?.emailAddress?.toLowerCase() === 'leekilcoyne1@gmail.com';

    React.useEffect(() => {
        const handleOpenModal = () => {
            console.log('Event received: open-upgrade-modal');
            setIsUpgradeModalOpen(true);
        }
        document.addEventListener('open-upgrade-modal', handleOpenModal);
        return () => document.removeEventListener('open-upgrade-modal', handleOpenModal);
    }, []);
    const location = useLocation();
    const isApp = location.pathname.startsWith('/app');

    // Close mobile menu on route change
    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
                            <Layers size={20} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-xl text-slate-900 tracking-tight">Transmit<span className="text-blue-600">.AI</span></span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {isApp ? (
                            // App Navigation
                            <nav className="flex gap-6">
                                <Link to="/app" className={`text-sm font-medium transition-colors ${location.pathname === '/app' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}>
                                    Dashboard
                                </Link>
                                <Link to="/app/upload" className={`text-sm font-medium transition-colors ${location.pathname === '/app/upload' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}>
                                    Upload
                                </Link>
                                {isActuallyAdmin && (
                                    <Link to="/app/admin" className={`text-sm font-medium transition-colors ${location.pathname === '/app/admin' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}>
                                        Admin
                                    </Link>
                                )}
                            </nav>
                        ) : (
                            // Public Navigation
                            <nav className="flex gap-6">
                                <a href="/#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</a>
                                <Link to="/how-it-works" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">How it Works</Link>
                                <a href="/#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
                            </nav>
                        )}

                        <div className="flex items-center gap-4 pl-8 border-l border-slate-200">
                            <SignedOut>
                                <SignInButton mode="modal" forceRedirectUrl="/app">
                                    <button className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                                        Sign In
                                    </button>
                                </SignInButton>
                                <SignUpButton mode="modal" forceRedirectUrl="/app">
                                    <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5">
                                        Get Started
                                    </button>
                                </SignUpButton>
                            </SignedOut>
                            <SignedIn>
                                {!isApp && (
                                    <Link to="/app" className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                        Go to Dashboard
                                    </Link>
                                )}
                                <UserButton afterSignOutUrl="/">
                                    <UserButton.MenuItems>
                                        <UserButton.Action
                                            label={
                                                subscriptionTier === 'business' ? 'Manage Business Plan' :
                                                    subscriptionTier === 'pro' ? 'Upgrade to Business' :
                                                        'Upgrade to Pro'
                                            }
                                            labelIcon={subscriptionTier === 'business' ? <Building2 size={14} /> : <Zap size={14} />}
                                            onClick={() => {
                                                if (subscriptionTier === 'free') {
                                                    setIsUpgradeModalOpen(true);
                                                } else {
                                                    // For paid users, open the billing portal via the BillingSettings component
                                                    // Since we can't easily trigger the function inside BillingSettings, 
                                                    // we'll rely on the user navigating to Billing.
                                                    // OR better: redirect to the billing tab
                                                    const billingTab = document.querySelector('button[aria-label="Billing"]');
                                                    if (billingTab instanceof HTMLElement) {
                                                        billingTab.click();
                                                    } else {
                                                        // Fallback: Open upgrade modal but maybe show different content?
                                                        // Actually, just opening the modal is confusing if they are already paid.
                                                        // Let's just open the Upgrade Modal for now, but I should probably update UpgradeModal 
                                                        // to handle "Already Pro" state.
                                                        // Wait, the UserButton.UserProfilePage handles navigation. 
                                                        // Let's just make this Action open the Billing Page.
                                                        // Clerk unfortunately doesn't expose a clean way to "open user profile to specific page" from an Action onClick
                                                        // without some hacky DOM manipulation or external state.
                                                        // Reverting to opening UpgradeModal for Free, and for Paid, we will just open the Upgrade Modal 
                                                        // BUT we will update UpgradeModal to show "Current Plan" / "Upgrade" options correctly.
                                                        setIsUpgradeModalOpen(true);
                                                    }
                                                }
                                            }}
                                        />
                                    </UserButton.MenuItems>
                                    <UserButton.UserProfilePage
                                        label="Billing"
                                        labelIcon={<CreditCard size={14} />}
                                        url="billing"
                                    >
                                        <BillingSettings />
                                    </UserButton.UserProfilePage>
                                    <UserButton.UserProfilePage
                                        label="Company"
                                        labelIcon={<Building2 size={14} />}
                                        url="company"
                                    >
                                        <CompanySettings />
                                    </UserButton.UserProfilePage>
                                </UserButton>
                            </SignedIn>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-600"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col gap-4">
                    {isApp ? (
                        <>
                            <Link to="/app" className="text-base font-medium text-slate-600 py-2">Dashboard</Link>
                            <Link to="/app/upload" className="text-base font-medium text-slate-600 py-2">Upload</Link>
                        </>
                    ) : (
                        <>
                            <a href="/#features" className="text-base font-medium text-slate-600 py-2">Features</a>
                            <a href="/#pricing" className="text-base font-medium text-slate-600 py-2">Pricing</a>
                        </>
                    )}
                    <hr className="border-slate-100" />
                    <SignedOut>
                        <SignInButton mode="modal" forceRedirectUrl="/app">
                            <button className="w-full text-center py-3 font-semibold text-slate-600 bg-slate-50 rounded-lg">Sign In</button>
                        </SignInButton>
                        <SignUpButton mode="modal" forceRedirectUrl="/app">
                            <button className="w-full text-center py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md">Get Started</button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        {!isApp && (
                            <Link to="/app" className="w-full text-center py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md">
                                Dashboard
                            </Link>
                        )}
                        <div className="flex justify-center py-2">
                            <UserButton afterSignOutUrl="/">
                                <UserButton.MenuItems>
                                    <UserButton.Action
                                        label={subscriptionTier === 'free' ? 'Upgrade to Pro' : `Plan: ${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}`}
                                        labelIcon={<Zap size={14} />}
                                        onClick={() => setIsUpgradeModalOpen(true)}
                                    />
                                </UserButton.MenuItems>
                                <UserButton.UserProfilePage
                                    label="Billing"
                                    labelIcon={<CreditCard size={14} />}
                                    url="billing"
                                >
                                    <BillingSettings />
                                </UserButton.UserProfilePage>
                            </UserButton>
                        </div>
                    </SignedIn>
                </div>
            )}
            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
            />
        </header>
    );
};

export default Header;
