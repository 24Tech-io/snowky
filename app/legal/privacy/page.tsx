export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 font-sans text-gray-800">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <p className="mb-4 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                    <p className="leading-relaxed">
                        Snowky ("we", "our", or "us") respects your privacy and is committed to protecting it through our compliance with this policy. This policy describes the types of information we may collect from you or that you may provide when you visit the website Snowky.com (our "Website") and our practices for collecting, using, maintaining, protecting, and disclosing that information.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                    <p className="leading-relaxed mb-2">
                        We collect several types of information from and about users of our Website, including information:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li>By which you may be personally identified, such as name, postal address, e-mail address, telephone number, or any other identifier by which you may be contacted online or offline ("personal information").</li>
                        <li>About your internet connection, the equipment you use to access our Website, and usage details.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                    <p className="leading-relaxed">
                        We use information that we collect about you or that you provide to us, including any personal information:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-2">
                        <li>To present our Website and its contents to you.</li>
                        <li>To provide you with information, products, or services that you request from us.</li>
                        <li>To fulfill any other purpose for which you provide it.</li>
                        <li>To provide you with notices about your account/subscription, including expiration and renewal notices.</li>
                        <li>To carry out our obligations and enforce our rights arising from any contracts entered into between you and us, including for billing and collection.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
                    <p className="leading-relaxed">
                        We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on our secure servers behind firewalls.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">5. Contact Information</h2>
                    <p className="leading-relaxed">
                        To ask questions or comment about this privacy policy and our privacy practices, contact us at: privacy@snowky.com.
                    </p>
                </section>
            </div>
        </div>
    );
}
