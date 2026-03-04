import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Brain, Layers, CheckCircle, ArrowRight, FileText } from 'lucide-react';
import { SignUpButton } from '@clerk/clerk-react';

import SEO from '../components/SEO';

import HeroAnimation from '../components/HeroAnimation';

import TrustedByStrip from '../components/TrustedByStrip';

const WORDS = ['Documents', 'Drawings', 'Reports', 'Specifications', 'Surveys'];

const LandingPage = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [wordIndex, setWordIndex] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const currentWord = WORDS[wordIndex];

        if (isDeleting) {
            timer = setTimeout(() => {
                setDisplayText(currentWord.substring(0, displayText.length - 1));
            }, 40);

            if (displayText === '') {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setIsDeleting(false);
                setWordIndex((prev) => (prev + 1) % WORDS.length);
            }
        } else {
            timer = setTimeout(() => {
                setDisplayText(currentWord.substring(0, displayText.length + 1));
            }, 80);

            if (displayText === currentWord) {
                timer = setTimeout(() => {
                    setIsDeleting(true);
                }, 2000);
            }
        }

        return () => clearTimeout(timer);
    }, [displayText, isDeleting, wordIndex]);

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
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 pb-4 mb-[-1rem] sm:-mb-4 whitespace-nowrap">
                                    Transmittals
                                </span>
                            </span>
                            <span className="text-[1.5rem] sm:text-3xl lg:text-4xl text-slate-800 mt-2 block">
                                In Minutes, Not Hours — <span className="text-blue-600">Powered by AI</span>
                            </span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
                            Transmit.AI extracts data from your construction documents automatically, turning hours of manual data entry into a document list or transmittal ready in minutes. Built for document controllers, project managers, and QS teams across the UK.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <SignUpButton mode="modal" forceRedirectUrl="/app">
                                <button className="px-8 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-2">
                                    Try Transmit.AI Free <ArrowRight size={20} />
                                </button>
                            </SignUpButton>
                            <a href="#how-it-works" className="px-8 py-4 text-lg font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all hover:scale-105 flex items-center justify-center">
                                View Video
                            </a>
                        </div>
                        <p className="mt-6 text-sm text-slate-500">No credit card required · 10 free documents · Cancel anytime</p>
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
            <section className="py-24 bg-white relative">
                <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Still Manually Typing Out Document Lists?</h2>

                    <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                        <p>
                            If you’re a document controller or project manager in construction, you know the pain: stacks of drawings, specs, and submittals, and hours spent manually keying data into spreadsheets or transmittal forms.
                        </p>
                        <p>
                            The average construction transmittal takes 2–4 hours to compile manually. Multiply that across a project lifecycle, and you’re losing days — sometimes weeks — to data entry alone.
                        </p>
                        <p className="font-bold text-slate-900 text-xl pt-4">
                            There’s a better way.
                        </p>
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
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <CheckCircle key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-slate-700 mb-6 leading-relaxed">
                                "This tool has saved our team 10+ hours per week. We used to spend entire afternoons manually typing data from transmittals. Now it's done in minutes."
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                    JM
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">James Morrison</p>
                                    <p className="text-sm text-slate-500">Senior QS, Tier 1 Contractor</p>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial 2 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <CheckCircle key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-slate-700 mb-6 leading-relaxed">
                                "The AI accuracy is impressive. Even handles our old scanned drawings from the 90s. Game changer for document control."
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                                    SC
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">Sarah Chen</p>
                                    <p className="text-sm text-slate-500">Document Controller, Major Infrastructure</p>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial 3 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <CheckCircle key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-slate-700 mb-6 leading-relaxed">
                                "Simple, fast, and reliable. We process 200+ drawings per week and this has become essential to our workflow. Highly recommend."
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
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
        </div >
    );
};

export default LandingPage;
