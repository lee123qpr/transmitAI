import { Upload, FileCheck, Download, CheckCircle } from 'lucide-react';
import SEO from '../components/SEO';

const HowItWorksPage = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="How It Works - Transmit.AI"
                description="Learn how Transmit.AI uses AI to extract data from construction documents in just 3 simple steps. Upload, process, and export in under 60 seconds."
            />

            {/* Hero Section */}
            <section className="relative px-6 lg:px-8 py-24 lg:py-32 bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                        How It Works
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Transform hundreds of construction PDFs into a structured Excel register in just 3 simple steps.
                    </p>
                </div>
            </section>

            {/* Steps Section */}
            <section className="py-24 bg-white">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <div className="space-y-24">
                        {/* Step 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="order-2 md:order-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                        <Upload size={24} />
                                    </div>
                                    <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Step 1</span>
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Upload Your Documents</h2>
                                <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                    Simply drag and drop your PDF files into the upload zone. You can upload individual files or entire folders at once. Our platform supports PDFs, scanned documents, CAD exports, and Word files.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-600">Batch upload hundreds of files simultaneously</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-600">Handles scanned documents and legacy PDFs</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-600">Secure cloud storage with encryption</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="order-1 md:order-2">
                                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-12 flex items-center justify-center aspect-square">
                                    <Upload size={120} className="text-blue-600" strokeWidth={1.5} />
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="order-1">
                                <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-12 flex items-center justify-center aspect-square">
                                    <FileCheck size={120} className="text-purple-600" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="order-2">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                        <FileCheck size={24} />
                                    </div>
                                    <span className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Step 2</span>
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">AI Processes Your Files</h2>
                                <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                    Our advanced AI vision technology automatically reads your documents, identifies title blocks, extracts metadata, and structures the information. This happens in seconds, not hours.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-600">99% extraction accuracy on construction documents</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-600">Reads title blocks, revision codes, and dates</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-600">Processes 100+ documents in under 60 seconds</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="order-2 md:order-1">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                        <Download size={24} />
                                    </div>
                                    <span className="text-sm font-semibold text-green-600 uppercase tracking-wide">Step 3</span>
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Export to Excel or PDF</h2>
                                <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                    Download your complete document register as a formatted Excel spreadsheet or PDF. The data is ready to use in your project management systems like Procore, BIM 360, or Aconex.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-600">Clean, formatted Excel files (.xlsx)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-600">Professional PDF reports</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-600">Compatible with all major PM tools</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="order-1 md:order-2">
                                <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl p-12 flex items-center justify-center aspect-square">
                                    <Download size={120} className="text-green-600" strokeWidth={1.5} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Teams Love Transmit.AI</h2>
                        <p className="text-lg text-slate-600">Save time, reduce errors, and focus on what matters</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-2xl border border-slate-200">
                            <div className="text-4xl font-bold text-blue-600 mb-2">10+ hrs</div>
                            <div className="text-lg font-semibold text-slate-900 mb-2">Saved Per Week</div>
                            <p className="text-slate-600 text-sm">
                                Eliminate manual data entry and free your team to focus on high-value work
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-slate-200">
                            <div className="text-4xl font-bold text-purple-600 mb-2">99%</div>
                            <div className="text-lg font-semibold text-slate-900 mb-2">Accuracy Rate</div>
                            <p className="text-slate-600 text-sm">
                                Industry-leading extraction accuracy reduces costly mistakes and rework
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-slate-200">
                            <div className="text-4xl font-bold text-green-600 mb-2">&lt;60s</div>
                            <div className="text-lg font-semibold text-slate-900 mb-2">Processing Time</div>
                            <p className="text-slate-600 text-sm">
                                Process 100+ documents in under a minute, not hours or days
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-white">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to transform your workflow?</h2>
                    <p className="text-lg text-slate-600 mb-8">
                        Start free with 10 documents per month. No credit card required.
                    </p>
                    <a
                        href="/app"
                        className="inline-block px-8 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105"
                    >
                        Get Started Free
                    </a>
                </div>
            </section>
        </div>
    );
};

export default HowItWorksPage;
