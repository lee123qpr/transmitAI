const PrivacyPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20">
            <h1 className="text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
            <div className="prose prose-slate max-w-none text-slate-600">
                <p className="mb-4">Last Updated: February 14, 2026</p>

                <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Introduction</h2>
                <p className="mb-4">
                    Welcome to Transmit AI. We respect your privacy and are committed to protecting your personal data.
                    This privacy policy will inform you as to how we look after your personal data when you visit our website (www.transmittal.co.uk)
                    and tell you about your privacy rights and how the law protects you.
                </p>

                <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. The Data We Collect</h2>
                <p className="mb-4">
                    We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                    <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                    <li><strong>Technical Data:</strong> includes Internet Protocol (IP) address, your login data, browser type and version.</li>
                    <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
                </ul>

                <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. How We Use Your Data</h2>
                <p className="mb-4">
                    We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                    <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                    <li>Where we need to comply with a legal or regulatory obligation.</li>
                </ul>

                <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Data Security</h2>
                <p className="mb-4">
                    We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed.
                </p>

                <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Contact Us</h2>
                <p className="mb-4">
                    If you have any questions about this privacy policy or our privacy practices, please contact us at: <a href="mailto:support@transmittal.co.uk" className="text-blue-600 hover:underline">support@transmittal.co.uk</a>
                </p>
                <p className="mb-4">
                    <strong>Our Registered Address:</strong><br />
                    Transmit AI<br />
                    71-75 Shelton Street<br />
                    Covent Garden<br />
                    London, UK<br />
                    WC2H 9JQ
                </p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
