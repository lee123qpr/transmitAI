import { Mail, MapPin, Phone } from 'lucide-react';
import SEO from '../components/SEO';

const ContactPage = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="Contact Us - Transmit.AI"
                description="Get in touch with Transmit.AI. Contact us for support, sales inquiries, or general questions about our AI-powered document extraction platform."
            />

            {/* Hero Section */}
            <section className="relative px-6 lg:px-8 py-24 lg:py-32 bg-slate-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Have questions about Transmit.AI? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>
                </div>
            </section>

            <section className="py-24 bg-white">
                <div className="max-w-5xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Contact Details */}
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-8">Contact Information</h2>
                            <div className="space-y-6">
                                {/* Email */}
                                <div className="flex gap-4 items-start">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">Email</h3>
                                        <a href="mailto:support@transmit.ai" className="text-blue-600 hover:text-blue-700 transition-colors">
                                            support@transmit.ai
                                        </a>
                                        <p className="text-sm text-slate-500 mt-1">We'll respond within 24 hours</p>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex gap-4 items-start">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">Phone</h3>
                                        <a href="tel:+442078901234" className="text-blue-600 hover:text-blue-700 transition-colors">
                                            +44 (0) 20 7890 1234
                                        </a>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex gap-4 items-start">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">Location</h3>
                                        <p className="text-slate-600">
                                            London, United Kingdom
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">Serving clients worldwide</p>
                                    </div>
                                </div>
                            </div>


                        </div>

                        {/* Contact Form */}
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-8">Send us a Message</h2>
                            <form className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-900 mb-2">
                                        Your Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="John Smith"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="john@company.com"
                                    />
                                </div>

                                {/* Subject */}
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-slate-900 mb-2">
                                        Subject *
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        required
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="How can we help?"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-slate-900 mb-2">
                                        Message *
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={6}
                                        required
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        placeholder="Tell us more about your inquiry..."
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full px-8 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                                >
                                    Send Message
                                </button>

                                <p className="text-xs text-slate-500 text-center">
                                    We typically respond within 24 hours during business days
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to get started?</h2>
                    <p className="text-lg text-slate-600 mb-8">
                        Try Transmit.AI free for 10 documents. No credit card required.
                    </p>
                    <a
                        href="/app"
                        className="inline-block px-8 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105"
                    >
                        Start Free Trial
                    </a>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;
