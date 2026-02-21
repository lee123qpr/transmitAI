import SEO from '../../components/SEO';

const CookiePolicy = () => {
    return (
        <div className="min-h-screen bg-white">
            <SEO
                title="Cookie Policy - Transmit.AI"
                description="Learn about how Transmit.AI uses cookies to improve your experience on our platform."
            />

            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-4xl font-bold text-slate-900 mb-8">Cookie Policy</h1>
                <p className="text-slate-500 mb-8">Last updated: February 16, 2026</p>

                <div className="prose prose-slate max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">What Are Cookies</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">How We Use Cookies</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Transmit.AI uses cookies for the following purposes:
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
                            <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.</li>
                            <li><strong>Authentication Cookies:</strong> We use cookies to remember your login state and keep you signed in as you navigate through the application.</li>
                            <li><strong>Preference Cookies:</strong> These cookies allow the website to remember choices you make (such as your preferred language or region) and provide enhanced features.</li>
                            <li><strong>Analytics Cookies:</strong> We use these cookies to understand how visitors interact with our website, helping us improve the user experience.</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Types of Cookies We Use</h2>

                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-slate-900 mb-3">Session Cookies</h3>
                            <p className="text-slate-600 leading-relaxed">
                                These are temporary cookies that expire when you close your browser. They help us maintain your session as you navigate through our application.
                            </p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-slate-900 mb-3">Persistent Cookies</h3>
                            <p className="text-slate-600 leading-relaxed">
                                These cookies remain on your device for a set period or until you delete them. They help us recognize you as a returning visitor and remember your preferences.
                            </p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-slate-900 mb-3">Third-Party Cookies</h3>
                            <p className="text-slate-600 leading-relaxed">
                                We use services from third parties such as Clerk (authentication), Stripe (payments), and analytics providers. These services may set their own cookies to provide their functionality.
                            </p>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Cookies We Use</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 border-b">Cookie Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 border-b">Purpose</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 border-b">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    <tr>
                                        <td className="px-4 py-3 text-sm text-slate-600 border-b">__clerk_*</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 border-b">Authentication and session management</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 border-b">Session/Persistent</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-sm text-slate-600 border-b">session_id</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 border-b">Maintain your session state</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 border-b">Session</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 text-sm text-slate-600 border-b">preferences</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 border-b">Remember your settings and preferences</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 border-b">1 year</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Managing Cookies</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            You can control and manage cookies in various ways. Please note that removing or blocking cookies may impact your user experience and parts of our website may no longer be fully accessible.
                        </p>

                        <h3 className="text-xl font-semibold text-slate-900 mb-3">Browser Settings</h3>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Most browsers allow you to view, manage, delete, and block cookies for a website. Be aware that if you delete all cookies, any preferences you have set will be lost, including the ability to opt-out from cookies.
                        </p>

                        <div className="bg-slate-50 p-6 rounded-lg mb-4">
                            <p className="text-slate-700 mb-2"><strong>Browser-specific cookie management:</strong></p>
                            <ul className="list-disc pl-6 text-slate-600 space-y-1">
                                <li>Chrome: Settings → Privacy and security → Cookies and other site data</li>
                                <li>Firefox: Settings → Privacy & Security → Cookies and Site Data</li>
                                <li>Safari: Preferences → Privacy → Manage Website Data</li>
                                <li>Edge: Settings → Cookies and site permissions → Cookies and site data</li>
                            </ul>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Do Not Track</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do not want to have your online activity tracked. We respect DNT signals where technically feasible.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Updates to This Policy</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            We may update this Cookie Policy from time to time to reflect changes in technology, legislation, our operations, or for other operational, legal, or regulatory reasons. Please check this page periodically for updates.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact Us</h2>
                        <p className="text-slate-600 leading-relaxed mb-4">
                            If you have any questions about our use of cookies, please contact us at:
                        </p>
                        <div className="bg-blue-50 p-6 rounded-lg">
                            <p className="text-slate-700 mb-1"><strong>Email:</strong> <a href="mailto:support@transmit.ai" className="text-blue-600 hover:text-blue-700">support@transmit.ai</a></p>
                            <p className="text-slate-700"><strong>Website:</strong> <a href="/contact" className="text-blue-600 hover:text-blue-700">Contact Form</a></p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default CookiePolicy;
