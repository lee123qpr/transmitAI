import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser, useAuth } from '@clerk/clerk-react';
import React, { Suspense, lazy } from 'react';
import { useDocumentStore } from './services/store';

// Layouts
import PublicLayout from './layouts/PublicLayout';

// App Components
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { ToastProvider } from './components/Toast';
import Loading from './components/Loading';
import ErrorBoundary from './components/ErrorBoundary';
import AnnouncementBanner from './components/AnnouncementBanner';
import MaintenanceOverlay from './components/MaintenanceOverlay';
import CookieBanner from './components/CookieBanner';

// Lazy Loaded Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));

// Protected Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard')); // New
const UploadPage = lazy(() => import('./pages/UploadPage'));
const Success = lazy(() => import('./pages/payment/Success'));
const Cancel = lazy(() => import('./pages/payment/Cancel'));

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing Publishable Key")
}


// Sync Component to ensure User Status is always up to date
const GlobalUserSync = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { fetchUserStatus } = useDocumentStore();

  React.useEffect(() => {
    const sync = async () => {
      if (user) {
        console.log('[GlobalSync] Fetching latest user status...');
        const token = await getToken();
        fetchUserStatus(user.id, user.primaryEmailAddress?.emailAddress, token || undefined);
      }
    };
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, fetchUserStatus, getToken]);

  return null;
};

// System Sync Component
const SystemConfigSync = () => {
  const { fetchSystemState } = useDocumentStore();

  React.useEffect(() => {
    fetchSystemState();
    const interval = setInterval(fetchSystemState, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [fetchSystemState]);

  return null;
};

const ProtectedLayout = () => {
  const { maintenanceMode, isAdmin } = useDocumentStore();

  if (maintenanceMode && !isAdmin) {
    return <MaintenanceOverlay />;
  }

  return (
    <>
      <SignedIn>
        <GlobalUserSync />
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
          <AnnouncementBanner />
          <Header />
          <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </main>
          <Footer />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ErrorBoundary>
        <ToastProvider>
          <SystemConfigSync />
          <Router>
            <ScrollToTop />
            <CookieBanner />
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* PUBLIC ROUTES */}
                <Route element={
                  <div className="flex flex-col min-h-screen">
                    <AnnouncementBanner />
                    <PublicLayout />
                  </div>
                }>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                  <Route path="/legal/terms" element={<TermsOfService />} />
                  <Route path="/legal/cookies" element={<CookiePolicy />} />
                  <Route path="/articles" element={<ArticlesPage />} />
                  <Route path="/articles/:slug" element={<ArticleDetail />} />
                </Route>

                {/* PROTECTED APP ROUTES */}
                <Route path="/app" element={<ProtectedLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="upload" element={<UploadPage />} />
                  <Route path="admin" element={<AdminDashboard />} /> {/* Admin Route */}
                  <Route path="payment/success" element={<Success />} />
                  <Route path="payment/cancel" element={<Cancel />} />
                </Route>

                {/* CATCH ALL */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </ToastProvider>
      </ErrorBoundary>
    </ClerkProvider>
  );
}

export default App;
