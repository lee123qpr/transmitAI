import { useState, useEffect } from 'react';
import { FileSpreadsheet, Brain, Layers, CheckCircle, ArrowRight, FileText, Newspaper, Calendar } from 'lucide-react';
import { SignUpButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

import SEO from '../components/SEO';

import HeroAnimation from '../components/HeroAnimation';

import TrustedByStrip from '../components/TrustedByStrip';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    header_image?: string;
    created_at: string;
    keywords?: string;
}

const LandingPage = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [latestArticles, setLatestArticles] = useState<Article[]>([]);

    useEffect(() => {
        fetch(`${API_URL}/articles`)
            .then(res => res.ok ? res.json() : [])
            .then((data: Article[]) => setLatestArticles(data.slice(0, 3)))
            .catch(() => setLatestArticles([]));
    }, []);

    // Handle hash links when navigating from other pages or same page
    useEffect(() => {
        if (window.location.hash) {
            const id = window.location.hash.replace('#', '');
            const scrollToElement = () => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            };
            // Small timeout to allow React to render the DOM elements
            setTimeout(scrollToElement, 150);
        }
    }, []);

    return (
        <div className="flex flex-col">
            <SEO
                title="Automate Construction Document Extraction"
                description="Stop manually typing data. Transmit.AI uses AI to extract metadata, revisions, and drawings into Excel registers."
            />
            {/* HERO SECTION */}
            <section className="relative px-6 lg:px-8 py-12 lg:py-20 overflow-hidden bg-slate-50">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
                    {/* Left Column: Text */}
                    <div className="text-left">
                        <h1 className="text-[2.5rem] leading-[1] sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-8 flex flex-col items-start space-y-0 sm:-space-y-1 lg:-space-y-3">
                            <span className="pb-1">Generate</span>
                            <span className="pb-1">Construction</span>
                            <span className="flex items-center min-h-[1.2em]">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 pb-2 whitespace-nowrap">
                                    Transmittals
                                </span>
                            </span>
                            <span className="text-[1.5rem] sm:text-3xl lg:text-4xl text-slate-800 mt-4 sm:mt-6 block leading-tight">
                                In Minutes, Not Hours — <br className="sm:hidden" /><span className="text-blue-600 whitespace-nowrap">Powered by AI</span>
                            </span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
                            Transmit.AI extracts data from your construction documents automatically, turning hours of manual data entry into a document list or transmittal ready in minutes. Built for document controllers, project managers, and QS's.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <SignUpButton mode="modal" forceRedirectUrl="/app">
                                <button className="px-8 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-2">
                                    Try Transmit.AI Free <ArrowRight size={20} />
                                </button>
                            </SignUpButton>
                            <button onClick={() => setIsVideoModalOpen(true)} className="px-8 py-4 text-lg font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all hover:scale-105 flex items-center justify-center">
                                View Video
                            </button>
                        </div>
                        <p className="mt-6 text-sm text-slate-600 font-medium">No credit card required · 10 free documents · Cancel anytime</p>
                    </div>

                    {/* Right Column: Visual */}
                    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center lg:justify-end">
                        <HeroAnimation />
                    </div>
                </div>
            </section>

            {/* TRUSTED BY STRIP */}
            <TrustedByStrip />

            {/* PROBLEM SECTION */}
            <section className="py-32 bg-slate-900 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-10">
                    <svg viewBox="0 0 1024 1024" className="w-[800px] h-[800px]" aria-hidden="true">
                        <circle cx="512" cy="512" r="512" fill="url(#gradient-problem)" />
                        <defs>
                            <radialGradient id="gradient-problem" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(512 512) rotate(90) scale(512)">
                                <stop stopColor="#3b82f6" />
                                <stop offset="1" stopColor="#0f172a" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        {/* Text Content */}
                        <div>
                            <h2
                                className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight"
                            >
                                Still Manually Typing Out Document Lists?
                            </h2>

                            <div
                                className="space-y-6 text-lg text-slate-300 leading-relaxed"
                            >
                                <p>
                                    If you’re a document controller or project manager, you know the pain: stacks of drawings, specs, and submittals, and hours spent manually keying data into spreadsheets or transmittal forms.
                                </p>
                                <p>
                                    The average construction transmittal takes 2–4 hours to compile manually. Multiply that across a project lifecycle, and you’re losing days — sometimes weeks — to data entry alone.
                                </p>
                                <p>
                                    Our AI-powered <strong className="text-white font-semibold">document control software</strong> eliminates this bottleneck. By instantly extracting document numbers, revisions, and titles straight from your PDFs, Transmit.AI auto-generates flawless transmittals so your team can focus on actually delivering the project.
                                </p>
                            </div>

                            <div
                                className="mt-8 flex items-center gap-4 border-l-4 border-blue-500 pl-5 py-2"
                            >
                                <p className="text-xl lg:text-2xl font-bold text-white">
                                    There’s a better way.
                                </p>
                            </div>
                        </div>

                        {/* Visual Cards */}
                        <div className="flex flex-col gap-6 mt-8 lg:mt-0 items-center lg:items-start justify-center">
                            {/* 1. "The Old Way" Card */}
                            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl shadow-rose-900/10 w-full max-w-lg relative overflow-hidden transition-all duration-500 hover:border-white/20 hover:shadow-rose-900/20 group">

                                {/* Background Red Glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-rose-500/15 transition-all duration-500 -translate-y-1/2 translate-x-1/3"></div>

                                <div className="relative z-10">
                                    <div className="flex items-start gap-4 mb-8">
                                        <div className="w-14 h-14 bg-slate-800/80 backdrop-blur border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            <FileSpreadsheet className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" size={26} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-xl drop-shadow-sm">The Old Way</h3>
                                            <p className="text-slate-400 mt-1 text-sm font-medium leading-relaxed">Manual data entry, scattered tracking sheets, prone to human error.</p>
                                        </div>
                                    </div>

                                    {/* Simulated "Old Way" Messy UI */}
                                    <div className="bg-slate-950/60 backdrop-blur-md rounded-xl p-5 border border-white/5 relative shadow-inner">

                                        {/* Error Badge */}
                                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] tracking-wider font-bold px-3 py-1.5 rounded-full shadow-lg shadow-rose-500/20 border border-rose-400/50 flex items-center gap-1.5">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                            </span>
                                            3 ERRORS DETECTED
                                        </div>

                                        {/* Mock Table Header */}
                                        <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                                            <div className="w-1/3 h-2 bg-slate-800/80 rounded-full"></div>
                                            <div className="w-1/4 h-2 bg-slate-800/80 rounded-full"></div>
                                            <div className="w-1/4 h-2 bg-slate-800/80 rounded-full"></div>
                                        </div>

                                        {/* Mock Table Rows */}
                                        <div className="space-y-4">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-1/3 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 flex items-center relative overflow-hidden">
                                                    <span className="text-[10px] text-rose-400 font-mono font-bold tracking-tight">Typo: ARC-01</span>
                                                    <div className="absolute inset-0 bg-rose-500/10 animate-[pulse_2s_ease-in-out_infinite]"></div>
                                                </div>
                                                <div className="w-1/4 h-7 bg-slate-800/50 rounded-lg"></div>
                                                <div className="w-1/4 h-7 bg-slate-800/50 rounded-lg"></div>
                                            </div>
                                            <div className="flex gap-3 items-center">
                                                <div className="w-1/3 h-7 bg-slate-800/50 rounded-lg"></div>
                                                <div className="w-1/4 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 flex items-center relative overflow-hidden">
                                                    <span className="text-[10px] text-rose-400 font-mono font-bold tracking-tight">Missing Rev</span>
                                                    <div className="absolute inset-0 bg-rose-500/10 animate-[pulse_2.5s_ease-in-out_infinite]"></div>
                                                </div>
                                                <div className="w-1/4 h-7 bg-slate-800/50 rounded-lg"></div>
                                            </div>
                                            <div className="flex gap-3 items-center">
                                                <div className="w-1/3 h-7 bg-slate-800/50 rounded-lg"></div>
                                                <div className="w-1/4 h-7 bg-slate-800/50 rounded-lg"></div>
                                                <div className="w-1/4 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2 flex items-center relative overflow-hidden">
                                                    <span className="text-[10px] text-rose-400 font-mono font-bold tracking-tight">Wrong Date</span>
                                                    <div className="absolute inset-0 bg-rose-500/10 animate-[pulse_2s_ease-in-out_infinite_0.5s]"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. "The Transmit.AI Way" Card */}
                            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-lg relative overflow-hidden transition-all duration-500 hover:border-white/20 hover:shadow-blue-900/20 group">

                                {/* Background Blue Glow */}
                                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-600/20 transition-all duration-500 translate-y-1/3 -translate-x-1/4"></div>

                                <div className="relative z-10">
                                    <div className="flex items-start gap-4 mb-8">
                                        <div className="w-14 h-14 bg-blue-600 border border-blue-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform duration-500">
                                            <img src="/favicon.svg" alt="Transmit.AI Logo" className="w-8 h-8 object-contain filter brightness-0 invert drop-shadow-md" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-xl drop-shadow-sm">The Transmit.AI Way</h3>
                                            <p className="text-blue-100/70 mt-1 font-medium text-sm leading-relaxed">Instant extraction, highly accurate, export drop-in ready document lists.</p>
                                        </div>
                                    </div>

                                    {/* Simulated "Transmit" Clean UI */}
                                    <div className="bg-slate-950/60 backdrop-blur-md rounded-xl p-5 font-mono text-sm border border-white/5 shadow-inner relative overflow-hidden">

                                        {/* Success Edge Bar */}
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>

                                        {/* Mock Table Header */}
                                        <div className="flex items-center gap-3 text-white/50 border-b border-white/10 pb-3 mb-4 pl-3">
                                            <span className="w-1/3 text-[10px] uppercase font-bold tracking-widest">Doc Number</span>
                                            <span className="w-1/4 text-[10px] uppercase font-bold tracking-widest">Rev</span>
                                            <span className="flex-1 text-[10px] uppercase font-bold tracking-widest">Status</span>
                                        </div>

                                        {/* Mock Table Rows */}
                                        <div className="space-y-3 pl-3">
                                            <div className="flex items-center gap-3 text-white">
                                                <span className="w-1/3 bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-bold font-sans">ARC-001</span>
                                                <span className="w-1/4 bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-bold font-sans text-center">P01</span>
                                                <span className="flex-1 flex gap-1.5 items-center text-xs font-bold font-sans text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg"><CheckCircle size={14} /> Valid</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-white">
                                                <span className="w-1/3 bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-bold font-sans">STR-104</span>
                                                <span className="w-1/4 bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-bold font-sans text-center">C02</span>
                                                <span className="flex-1 flex gap-1.5 items-center text-xs font-bold font-sans text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg"><CheckCircle size={14} /> Valid</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feature Pills */}
                                    <div className="flex flex-wrap items-center gap-3 mt-6">
                                        <div className="flex items-center gap-2 text-white font-bold text-xs bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-400/30 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all hover:bg-blue-600/50 cursor-default">
                                            <CheckCircle size={14} className="text-blue-300 drop-shadow-sm" />
                                            Done in seconds
                                        </div>
                                        <div className="flex items-center gap-2 text-white font-bold text-xs bg-white/5 border border-white/10 px-4 py-2 rounded-full shadow-inner backdrop-blur-sm cursor-default">
                                            Zero errors
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section id="features" className="py-24 bg-slate-50 relative">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Construction Teams Choose Transmit.AI</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Stop manual data entry and let AI automatically extract construction document metadata—number, title, revision, date, and status.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                                <FileSpreadsheet size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Instant Excel Export</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Turn 100+ PDFs into a formatted Excel register in under 60 seconds. Compatible with all PM tools.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                                <Brain size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">AI Vision Analysis</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Reads drawings like a human. Extracts title blocks, revision codes, and handles scanned/legacy PDFs flawlessly.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                                <Layers size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Legal Evidence Protection</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Transmittal sheets with full metadata are stronger evidence than emails. Prevent "never received it" disputes and protect your organisation.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                                <CheckCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">99% Accuracy</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Industry-leading extraction accuracy. Handles complex title blocks, multi-page PDFs, and non-standard formats.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                                <ArrowRight size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Batch Processing</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Upload entire folders at once. Process hundreds of documents in parallel with no manual intervention.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-4 group-hover:scale-110 transition-transform">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Format Support</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Works with PDFs, scanned documents, CAD exports, and Word files. No format left behind.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHY TRANSMITTALS MATTER SECTION */}
            <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4">Why Proper Transmittal Documentation Matters</h2>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                            In construction, proper document control isn't just admin—it's legal protection
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 mb-4">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Without Controlled Transmittals</h3>
                            <ul className="space-y-2 text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <span>"I never received that email" disputes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <span>No proof of document submission dates</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <span>Weak evidence in contractual disputes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <span>Costly legal battles and liability exposure</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 mb-4">
                                <CheckCircle size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">With Transmit.AI</h3>
                            <ul className="space-y-2 text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Irrefutable proof with full metadata</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Complete audit trail of all submissions</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Strong documentary evidence for contracts</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400 mt-1">✓</span>
                                    <span>Prevent disputes before they start</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-400/20 rounded-2xl p-8 text-center">
                        <blockquote className="text-lg italic text-slate-200 mb-4">
                            "A controlled transmittal sheet attached to any document sent to an external party, containing all metadata of the transmittal, signed by the sender and by the recipient is a much stronger piece of evidence than an email alone, as the recipient can always claim that they never received that email."
                        </blockquote>
                        <p className="text-sm text-slate-400">— Industry Best Practice (Consepsys, 2019)</p>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS SECTION */}
            <section className="py-24 bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/20 blur-[100px] rounded-full" />
                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Trusted by Industry Professionals</h2>
                        <p className="text-lg text-slate-600">See what our users have to say about Transmit.AI</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Testimonial 1 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <CheckCircle key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-slate-700 mb-6 leading-relaxed">
                                "This tool has saved our team 10+ hours per week. We used to spend entire afternoons manually typing data from transmittals. Now it's done in minutes."
                            </p>
                            <div className="flex items-center gap-3 mt-auto">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">
                                    JM
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">James Morrison</p>
                                    <p className="text-sm text-slate-500">Senior QS, Tier 1 Contractor</p>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial 2 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <CheckCircle key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-slate-700 mb-6 leading-relaxed">
                                "The AI accuracy is impressive. Even handles our old scanned drawings from the 90s. Game changer for document control."
                            </p>
                            <div className="flex items-center gap-3 mt-auto">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold shrink-0">
                                    SC
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">Sarah Chen</p>
                                    <p className="text-sm text-slate-500">Document Controller, Major Infrastructure</p>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial 3 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <CheckCircle key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-slate-700 mb-6 leading-relaxed">
                                "Simple, fast, and reliable. We process 200+ drawings per week and this has become essential to our workflow. Highly recommend."
                            </p>
                            <div className="flex items-center gap-3 mt-auto">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold shrink-0">
                                    RP
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">Robert Patel</p>
                                    <p className="text-sm text-slate-500">Associate Architect, Design Firm</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            {/* ARTICLES SECTION */}
            {latestArticles.length > 0 && (
                <section className="py-24 bg-white border-t border-slate-100">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-4 py-2 rounded-full mb-4">From the Blog</span>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Insights & Guides</h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                Stay up to date with the latest in AI document control, construction technology, and industry best practice.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            {latestArticles.map((article) => (
                                <Link
                                    key={article.id}
                                    to={`/articles/${article.slug}`}
                                    className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/60 transition-all flex flex-col h-full"
                                >
                                    {/* Image */}
                                    <div className="relative h-48 overflow-hidden bg-slate-100 flex items-center justify-center text-slate-300">
                                        <Newspaper size={36} className="absolute z-0" />
                                        {article.header_image && (
                                            <img
                                                src={article.header_image}
                                                alt={article.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        )}
                                        {article.keywords && (
                                            <span className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-sm text-blue-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                                                {article.keywords.split(',')[0].trim()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex-grow flex flex-col">
                                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                            <Calendar size={12} />
                                            {new Date(article.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors leading-snug">
                                            {article.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">
                                            {article.excerpt || 'Read the full article to learn more.'}
                                        </p>
                                        <div className="mt-auto flex items-center gap-1 text-blue-600 font-bold text-sm">
                                            Read More <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="text-center">
                            <Link
                                to="/articles"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all hover:scale-105 shadow-lg"
                            >
                                See All Articles <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* PRICING SECTION */}
            < section id="pricing" className="py-24 bg-slate-50" >
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
                        <p className="text-lg text-slate-600 mb-8">Choose the plan that fits your workload</p>

                        <div className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${billingCycle === 'yearly' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Yearly <span className="text-xs ml-1 text-green-400 font-normal">(Save)</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {/* Free Tier */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:border-blue-300 transition-colors relative">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Free Trial</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-slate-900">£0</span>
                                    <span className="text-slate-500">/mo</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-2">Perfect for testing the waters</p>
                            </div>
                            <div className="space-y-4 mb-8 flex-grow">
                                <div className="flex gap-3 text-sm text-slate-700"><CheckCircle size={18} className="text-green-500 shrink-0" /> 10 Documents / month</div>
                                <div className="flex gap-3 text-sm text-slate-700"><CheckCircle size={18} className="text-green-500 shrink-0" /> PDF & Word Support</div>
                                <div className="flex gap-3 text-sm text-slate-700"><CheckCircle size={18} className="text-green-500 shrink-0" /> 30-day history</div>
                                <div className="flex gap-3 text-sm text-slate-400 decoration-slate-300 line-through"><CheckCircle size={18} className="text-slate-300 shrink-0" /> Excel Export</div>
                            </div>
                            <SignUpButton mode="modal" forceRedirectUrl="/app">
                                <button className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold rounded-lg transition-colors border border-slate-200">
                                    Start Free
                                </button>
                            </SignUpButton>
                        </div>

                        {/* Pro Tier */}
                        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col transform md:-translate-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-white mb-2">Pro</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">£{billingCycle === 'monthly' ? '20' : '17'}</span>
                                    <span className="text-slate-400">/mo</span>
                                </div>
                                {billingCycle === 'yearly' && <p className="text-xs text-green-400 font-medium mt-1">£200/year - Save £40</p>}
                                <p className="text-sm text-slate-400 mt-2">Perfect for individuals</p>
                            </div>
                            <div className="space-y-4 mb-8 flex-grow">
                                <div className="flex gap-3 text-sm text-slate-200"><CheckCircle size={18} className="text-blue-400 shrink-0" /> 500 Documents / month</div>
                                <div className="flex gap-3 text-sm text-slate-200"><CheckCircle size={18} className="text-blue-400 shrink-0" /> <span className="font-bold text-white">Excel/CSV Export</span></div>
                                <div className="flex gap-3 text-sm text-slate-200"><CheckCircle size={18} className="text-blue-400 shrink-0" /> Edit Metadata & Fixes</div>
                                <div className="flex gap-3 text-sm text-slate-200"><CheckCircle size={18} className="text-blue-400 shrink-0" /> Unlimited History</div>
                            </div>
                            <SignUpButton mode="modal" forceRedirectUrl="/app">
                                <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/30">
                                    Get Started
                                </button>
                            </SignUpButton>
                        </div>

                        {/* Business Tier */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:border-blue-300 transition-colors">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Business</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-slate-900">£{billingCycle === 'monthly' ? '60' : '50'}</span>
                                    <span className="text-slate-500">/mo</span>
                                </div>
                                {billingCycle === 'yearly' && <p className="text-xs text-green-600 font-medium mt-1">£600/year - Save £120</p>}
                                <p className="text-sm text-slate-500 mt-2">For high-volume teams</p>
                            </div>
                            <div className="space-y-4 mb-8 flex-grow">
                                <div className="flex gap-3 text-sm text-slate-700"><CheckCircle size={18} className="text-purple-500 shrink-0" /> <span className="font-bold text-slate-900">2,500 Documents</span> / month</div>
                                <div className="flex gap-3 text-sm text-slate-700"><CheckCircle size={18} className="text-purple-500 shrink-0" /> All Pro features</div>
                                <div className="flex gap-3 text-sm text-slate-700"><CheckCircle size={18} className="text-purple-500 shrink-0" /> Priority Processing</div>
                                <div className="flex gap-3 text-sm text-slate-700"><CheckCircle size={18} className="text-purple-500 shrink-0" /> Dedicated Support</div>
                            </div>
                            <SignUpButton mode="modal" forceRedirectUrl="/app">
                                <button className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors shadow-lg">
                                    Get Business
                                </button>
                            </SignUpButton>
                        </div>
                    </div>
                </div>
            </section >

            {/* CTA SECTION */}
            <section className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold text-slate-900 mb-6">Stop Spending Hours on Transmittals. Start in Minutes.</h2>
                    <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                        Join construction teams across the UK using Transmit.AI to automate document extraction and stop wasting time on manual data entry.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-10 text-sm font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span>Up and running in minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span>Works with your existing documents</span>
                        </div>
                    </div>

                    <SignUpButton mode="modal" forceRedirectUrl="/app">
                        <button className="px-10 py-5 text-xl font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2 mx-auto">
                            Get Started Free <ArrowRight size={24} />
                        </button>
                    </SignUpButton>
                </div>
            </section>

            {/* VIDEO MODAL */}
            {isVideoModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setIsVideoModalOpen(false)}
                >
                    <div
                        className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsVideoModalOpen(false)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors border border-white/20"
                            aria-label="Close video"
                        >
                            ✕
                        </button>
                        <iframe
                            src="https://www.youtube.com/embed/VkZKc-fvwSk?autoplay=1&rel=0"
                            title="Transmit.AI Product Demo"
                            className="w-full h-full border-0 bg-black"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}
        </div >
    );
};

export default LandingPage;
