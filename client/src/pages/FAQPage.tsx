import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import SEO from '../components/SEO';

interface FAQItem {
    question: string;
    answer: string;
}

const FAQPage = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqItems: FAQItem[] = [
        {
            question: "How does Transmit.AI work?",
            answer: "Simply upload your PDF documents, and our AI-powered system automatically extracts key information like document titles, revision codes, dates, and metadata. You can then export the extracted data to Excel or PDF format for use in your project management systems."
        },
        {
            question: "What file formats do you support?",
            answer: "We support PDF files (including scanned/legacy documents), Word documents (.docx), CAD exports, and most common construction document formats. Our AI vision technology can read both digital and scanned documents with high accuracy."
        },
        {
            question: "How accurate is the AI extraction?",
            answer: "Our AI achieves 99% accuracy on standard construction documents. It's trained specifically on title blocks, revision tables, and transmittal formats used in the architecture, engineering, and construction industries."
        },
        {
            question: "How do I get started?",
            answer: "Simply sign up for a free account - no credit card required. You'll get 10 documents per month on the free tier to test the platform. Upgrade to Pro (£20/month) for 500 documents or Business (£60/month) for 2,500 documents."
        },
        {
            question: "Can I cancel or change my plan anytime?",
            answer: "Yes! You can upgrade, downgrade, or cancel your subscription at any time through your account settings. Changes take effect immediately, and you'll only be charged for what you use."
        },
        {
            question: "What happens to my documents after processing?",
            answer: "Your documents are securely stored in the cloud with industry-standard encryption. You maintain full ownership of your data and can delete documents at any time. We never share your documents with third parties."
        },
        {
            question: "Do you offer batch processing?",
            answer: "Yes! You can upload entire folders of documents at once. Our system processes them in parallel, so you can handle hundreds of documents in minutes rather than hours of manual data entry."
        },
        {
            question: "What's included in the Business tier?",
            answer: "The Business tier includes 2,500 documents per month, all Pro features, priority processing, and dedicated support. It's perfect for teams and firms with high-volume document management needs."
        },
        {
            question: "Can I export to my existing systems?",
            answer: "Yes! We export to Excel (.xlsx) and PDF formats, which are compatible with all major project management tools including Procore, BIM 360, Aconex, and others."
        },
        {
            question: "Do you offer yearly pricing?",
            answer: "Yes! Both Pro and Business tiers offer yearly billing options with significant savings. Pro yearly is £200/year (save £40), and Business yearly is £600/year (save £120 - equivalent to 2 months free)."
        },
        {
            question: "Is there an API available?",
            answer: "API access is coming soon! We're currently developing REST API endpoints for enterprise customers to integrate Transmit.AI directly into their workflows. Contact us if you're interested in early access."
        },
        {
            question: "What kind of support do you offer?",
            answer: "Free tier users get email support with 24-48 hour response times. Pro users get priority email support with 12-hour response times. Business tier customers get dedicated support with same-day responses and direct access to our technical team."
        },
        {
            question: "Can I try before upgrading?",
            answer: "Absolutely! The free tier gives you 10 documents per month to thoroughly test the platform. You can see exactly how it works with your documents before committing to a paid plan."
        },
        {
            question: "How secure is my data?",
            answer: "We use bank-level encryption (AES-256) for data at rest and TLS 1.3 for data in transit. Our infrastructure is hosted on secure cloud servers with regular security audits. We're GDPR compliant and take data privacy seriously."
        },
        {
            question: "Do you handle scanned documents?",
            answer: "Yes! Our AI vision technology is specifically designed to handle scanned documents, including old drawings from the 80s and 90s. We can extract data from low-quality scans, handwritten annotations, and non-standard formats."
        }
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="Frequently Asked Questions - Transmit.AI"
                description="Find answers to common questions about Transmit.AI's AI-powered document extraction platform for construction professionals."
            />

            {/* Hero Section */}
            <section className="relative px-6 lg:px-8 py-24 lg:py-32 bg-slate-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Everything you need to know about Transmit.AI. Can't find what you're looking for? <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">Contact us</a>.
                    </p>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 bg-white">
                <div className="max-w-3xl mx-auto px-6 lg:px-8">
                    <div className="space-y-4">
                        {faqItems.map((item, index) => (
                            <div
                                key={index}
                                className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all hover:border-blue-200"
                            >
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    className="w-full flex items-center justify-between p-6 text-left"
                                >
                                    <h3 className="text-lg font-semibold text-slate-900 pr-8">
                                        {item.question}
                                    </h3>
                                    <ChevronDown
                                        size={20}
                                        className={`text-slate-400 shrink-0 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-200 ${openIndex === index ? 'max-h-96' : 'max-h-0'
                                        }`}
                                >
                                    <p className="px-6 pb-6 text-slate-600 leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Still have questions?</h2>
                    <p className="text-lg text-slate-600 mb-8">
                        Our team is here to help. Get in touch and we'll respond within 24 hours.
                    </p>
                    <a
                        href="/contact"
                        className="inline-block px-8 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105"
                    >
                        Contact Support
                    </a>
                </div>
            </section>
        </div>
    );
};

export default FAQPage;
