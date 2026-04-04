import { useState } from 'react';
import { Mail, MapPin, Instagram, Linkedin, Youtube, Send } from 'lucide-react';
import SEO from '../components/SEO';
import { useToast } from '../components/Toast';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ContactPage = () => {
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                showToast('✅ Your message has been sent successfully!', 'success', 5000);
                setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
            } else {
                throw new Error(data.error || 'Failed to send message');
            }
        } catch (error: any) {
            console.error('Contact form error:', error);
            showToast(error.message || 'Failed to send message. Please try again later.', 'error', 7000);
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="Contact Us - Transmit AI"
                description="Get in touch with Transmit AI. Contact us for support, sales inquiries, or general questions about our AI-powered document extraction platform."
            />

            {/* Hero Section */}
            <section className="relative px-6 lg:px-8 py-24 lg:py-32 bg-slate-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Have questions about Transmit AI? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
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
                                        <a href="mailto:support@transmittal.co.uk" className="text-blue-600 hover:text-blue-700 transition-colors">
                                            support@transmittal.co.uk
                                        </a>
                                        <p className="text-sm text-slate-500 mt-1">We'll respond within 24 hours</p>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex gap-4 items-start">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">Location</h3>
                                        <p className="text-slate-600 leading-relaxed">
                                            71-75 Shelton Street<br />
                                            Covent Garden<br />
                                            London<br />
                                            WC2H 9JQ
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Follow Us */}
                            <div className="flex gap-4 items-start mt-8">
                                <div>
                                    <h3 className="font-semibold text-slate-900 mb-4">Follow Us</h3>
                                    <div className="flex gap-4">
                                        <a href="https://www.instagram.com/transmit_ai/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-pink-50 hover:text-pink-600 transition-all">
                                            <Instagram size={22} />
                                        </a>
                                        <a href="https://www.linkedin.com/company/transmit-ai" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all">
                                            <Linkedin size={22} />
                                        </a>
                                        <a href="https://www.youtube.com/@Transmit_AI" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
                                            <Youtube size={22} />
                                        </a>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Contact Form */}
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-8">Send us a Message</h2>
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-900 mb-2">
                                        Your Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                                        placeholder="John Doe"
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
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
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
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
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
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows={6}
                                        required
                                        disabled={isSubmitting}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-50"
                                        placeholder="Tell us more about your inquiry..."
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Sending...' : (
                                        <>
                                            <Send size={20} />
                                            Send Message
                                        </>
                                    )}
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
                        Try Transmit AI free for 10 documents. No credit card required.
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
