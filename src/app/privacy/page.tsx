import Link from 'next/link';

export const metadata = {
    title: 'Privacy Policy - SaveMyPortal',
    description: 'Privacy Policy for SaveMyPortal by Starbright Lab.',
};

const lastUpdated = 'February 18, 2025';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-deep-space text-gray-300 p-8 md:p-16">
            <div className="max-w-4xl mx-auto space-y-10">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
                    <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
                </div>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
                    <p>
                        Welcome to SaveMyPortal, operated by Starbright Lab (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to
                        protecting your personal information and your right to privacy. This Privacy Policy explains how
                        we collect, use, store, and share information when you use our web application at savemyportal.com
                        (the &quot;Service&quot;).
                    </p>
                    <p>
                        By using the Service, you agree to the practices described in this Privacy Policy. If you do not
                        agree, please do not use the Service.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Information We Collect</h2>
                    <p>We collect the following categories of information:</p>

                    <h3 className="text-lg font-semibold text-white/90">2.1 Account Information</h3>
                    <p>
                        When you sign in using Google OAuth, we receive your name, email address, and profile picture
                        from Google. We do not receive or store your Google password.
                    </p>

                    <h3 className="text-lg font-semibold text-white/90">2.2 Photo Album URLs</h3>
                    <p>
                        You provide us with shared album URLs from Google Photos, iCloud, or other supported services.
                        We store these URLs to fetch and display your photos on your device. We do not access your
                        private photo library or any albums beyond those you explicitly share with us.
                    </p>

                    <h3 className="text-lg font-semibold text-white/90">2.3 Photo Metadata</h3>
                    <p>
                        When we process your shared albums, we store references (URLs, dimensions, and capture dates)
                        to the individual photos within those albums. We do not store copies of your actual photos on
                        our servers.
                    </p>

                    <h3 className="text-lg font-semibold text-white/90">2.4 Local Storage Data</h3>
                    <p>
                        We use your browser&apos;s localStorage to remember your active feed selection and session
                        preferences. This data never leaves your device.
                    </p>

                    <h3 className="text-lg font-semibold text-white/90">2.5 Consent Records</h3>
                    <p>
                        When you accept our Terms of Service during onboarding, we record the timestamp and version
                        of the agreement you accepted.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. Photo Data</h2>
                    <p>
                        Your photos are displayed on your device by proxying the image through our server to avoid
                        CORS restrictions. Images are streamed in real time and are not stored, cached, or retained
                        on our servers. The proxy acts as a pass-through only.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. How We Use Your Information</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>To authenticate your identity and provide access to the Service.</li>
                        <li>To fetch and display photos from your linked albums on your device.</li>
                        <li>To save your feed configurations, display preferences, and sleep schedules.</li>
                        <li>To process voluntary donations via our payment provider.</li>
                        <li>To communicate with you about the Service if necessary (e.g., security notifications).</li>
                    </ul>
                    <p>
                        We do not use your information for advertising, profiling, or any purpose beyond providing
                        the Service.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">5. Data Storage &amp; Security</h2>
                    <p>
                        Your account data, feed configurations, and source references are stored in a PostgreSQL
                        database hosted by Supabase (powered by AWS infrastructure). All data is protected by
                        Row-Level Security (RLS) policies, ensuring that each user can only access their own data.
                    </p>
                    <p>
                        All connections to the Service use HTTPS encryption. Authentication tokens are managed
                        securely through Supabase Auth.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">6. Third-Party Services</h2>
                    <p>We use the following third-party services to operate:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong className="text-white">Google</strong> &mdash; OAuth authentication and Google Photos album access.</li>
                        <li><strong className="text-white">Apple</strong> &mdash; iCloud Shared Album access (when you provide an iCloud album link).</li>
                        <li><strong className="text-white">Supabase</strong> &mdash; Database hosting, authentication, and serverless functions.</li>
                        <li><strong className="text-white">Netlify</strong> &mdash; Web application hosting and deployment.</li>
                        <li><strong className="text-white">Stripe</strong> &mdash; Secure processing of voluntary donations. We never see or store your payment details.</li>
                    </ul>
                    <p>
                        Each of these services has their own privacy policy. We encourage you to review them.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">7. Cookies &amp; Local Storage</h2>
                    <p>
                        SaveMyPortal does not use tracking cookies or third-party analytics. We use browser
                        localStorage to store your active feed ID and session preferences locally on your device.
                        Supabase Auth uses secure HTTP-only cookies for authentication session management.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">8. Data Retention &amp; Deletion</h2>
                    <p>
                        We retain your data for as long as your account is active. You can delete your account at
                        any time from the Settings page in the application. When you delete your account, all of
                        your data &mdash; including feeds, sources, photo references, and consent records &mdash; is
                        permanently and immediately deleted from our database. This action cannot be undone.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">9. Your Rights</h2>
                    <p>Depending on your location, you may have the following rights regarding your personal data:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong className="text-white">Access</strong> &mdash; Request a copy of the personal data we hold about you.</li>
                        <li><strong className="text-white">Correction</strong> &mdash; Request correction of inaccurate data.</li>
                        <li><strong className="text-white">Deletion</strong> &mdash; Request deletion of your data (available self-service via Settings).</li>
                        <li><strong className="text-white">Portability</strong> &mdash; Request your data in a portable format.</li>
                        <li><strong className="text-white">Objection</strong> &mdash; Object to processing of your personal data.</li>
                    </ul>
                    <p>
                        To exercise any of these rights, please contact us at{' '}
                        <a href="mailto:support@starbrightlab.com" className="text-electric-blue hover:text-white transition-colors">
                            support@starbrightlab.com
                        </a>. We will respond within 30 days.
                    </p>
                    <p className="text-sm text-gray-500">
                        For EU/EEA residents: these rights are provided under the General Data Protection Regulation
                        (GDPR). For California residents: these rights are provided under the California Consumer
                        Privacy Act (CCPA).
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">10. Children&apos;s Privacy</h2>
                    <p>
                        The Service is not directed at children under the age of 13. We do not knowingly collect
                        personal information from children. If you believe a child has provided us with personal
                        information, please contact us and we will promptly delete it.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">11. International Data Transfers</h2>
                    <p>
                        Your data may be processed and stored in the United States through our infrastructure
                        providers (Supabase/AWS, Netlify). By using the Service, you consent to the transfer of
                        your information to the United States and other jurisdictions where our service providers
                        operate.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">12. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. If we make material changes, we will
                        update the &quot;Last updated&quot; date at the top of this page. Your continued use of the Service
                        after changes are posted constitutes your acceptance of the updated policy.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">13. Contact Us</h2>
                    <p>
                        If you have questions, concerns, or requests regarding this Privacy Policy or our data
                        practices, please contact us at:
                    </p>
                    <p>
                        <strong className="text-white">Starbright Lab</strong><br />
                        Email:{' '}
                        <a href="mailto:support@starbrightlab.com" className="text-electric-blue hover:text-white transition-colors">
                            support@starbrightlab.com
                        </a>
                    </p>
                </section>

                <div className="pt-8 border-t border-white/10">
                    <Link href="/" className="text-electric-blue hover:text-white transition-colors">
                        &larr; Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
