import Link from 'next/link';

export const metadata = {
    title: 'Terms of Service - SaveMyPortal',
    description: 'Terms of Service for SaveMyPortal by Starbright Lab.',
};

const lastUpdated = 'February 18, 2025';

export default function Terms() {
    return (
        <div className="min-h-screen bg-deep-space text-gray-300 p-8 md:p-16">
            <div className="max-w-4xl mx-auto space-y-10">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
                    <p className="text-sm text-gray-500">Last updated: {lastUpdated}</p>
                </div>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. Agreement to Terms</h2>
                    <p>
                        By accessing or using SaveMyPortal (&quot;the Service&quot;), operated by Starbright Lab
                        (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you agree to be bound by these Terms of Service. If you do not
                        agree to these terms, please do not use the Service.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Description of Service</h2>
                    <p>
                        SaveMyPortal is a web application that repurposes Meta Portal devices (and other web-capable
                        displays) into digital photo frames. The Service allows you to connect shared photo albums
                        from Google Photos, iCloud, and other supported providers, and displays them in a
                        customizable slideshow.
                    </p>
                    <p>
                        SaveMyPortal is an independent project by Starbright Lab and is not affiliated with,
                        endorsed by, or associated with Meta Platforms, Inc., Google LLC, or Apple Inc.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. Eligibility</h2>
                    <p>
                        You must be at least 13 years of age to use the Service. By using the Service, you
                        represent and warrant that you meet this requirement.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Account Registration</h2>
                    <p>
                        To use the Service, you must sign in using a Google account via OAuth. You are responsible
                        for maintaining the security of your Google account and for all activities that occur through
                        your SaveMyPortal account. You agree to notify us immediately of any unauthorized use.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">5. User Responsibilities</h2>
                    <p>You agree to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Use the Service only for its intended purpose of displaying personal photos.</li>
                        <li>Only link photo albums that you own or have permission to display.</li>
                        <li>Not attempt to access other users&apos; data or circumvent our security measures.</li>
                        <li>Not use the Service for any unlawful purpose or in violation of any applicable laws.</li>
                        <li>Not reverse-engineer, scrape, or misuse the Service or its infrastructure.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">6. Intellectual Property</h2>
                    <p>
                        The Service, including its design, code, logos, and branding, is the property of
                        Starbright Lab and is protected by applicable intellectual property laws. You may not
                        copy, modify, distribute, or create derivative works of the Service without our prior
                        written consent.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">7. Photo Content &amp; Third-Party Services</h2>
                    <p>
                        You retain all rights to the photos you display through the Service. We do not claim
                        ownership of your content. Photos are accessed from third-party services (Google Photos,
                        iCloud) through shared album URLs that you provide.
                    </p>
                    <p>
                        Your use of third-party photo services is governed by their respective terms of service.
                        We are not responsible for the availability, accuracy, or content of third-party services.
                        If a third-party service changes its sharing mechanism or access policies, some features of
                        the Service may be affected.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">8. Donations &amp; Payments</h2>
                    <p>
                        SaveMyPortal is a free service. We accept voluntary one-time donations to help cover
                        server and development costs. Donations are processed securely by Stripe and are
                        non-refundable. Making a donation does not entitle you to any additional features,
                        priority support, or service guarantees.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">9. Disclaimers</h2>
                    <p>
                        THE SERVICE IS PROVIDED ON AN &quot;AS-IS&quot; AND &quot;AS-AVAILABLE&quot; BASIS. WE MAKE NO WARRANTIES,
                        EXPRESS OR IMPLIED, REGARDING THE SERVICE, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
                        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                    </p>
                    <p>
                        We do not guarantee that the Service will be uninterrupted, error-free, or secure. We do
                        not guarantee compatibility with any specific device, browser, or operating system, including
                        Meta Portal devices.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">10. Limitation of Liability</h2>
                    <p>
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, STARBRIGHT LAB SHALL NOT BE LIABLE FOR ANY
                        INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
                        LIMITED TO LOSS OF DATA, LOSS OF PROFITS, OR LOSS OF USE, ARISING OUT OF OR RELATED TO
                        YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                    </p>
                    <p>
                        Our total aggregate liability for any claims arising from or related to the Service shall
                        not exceed the amount you have paid to us (if any) in the twelve (12) months preceding
                        the claim.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">11. Termination &amp; Account Deletion</h2>
                    <p>
                        You may delete your account at any time through the Settings page. Upon deletion, all of
                        your data will be permanently removed from our systems, including feeds, sources, photo
                        references, and consent records. This action cannot be undone.
                    </p>
                    <p>
                        We reserve the right to suspend or terminate your access to the Service at any time, with
                        or without cause, and with or without notice. Reasons for termination may include, but are
                        not limited to, violation of these Terms, abusive behavior, or prolonged inactivity.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">12. Modifications to the Service &amp; Terms</h2>
                    <p>
                        We reserve the right to modify, suspend, or discontinue any part of the Service at any
                        time without prior notice. We may also update these Terms from time to time. If we make
                        material changes, we will update the &quot;Last updated&quot; date at the top of this page. Your
                        continued use of the Service after changes are posted constitutes your acceptance of the
                        updated Terms.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">13. Governing Law</h2>
                    <p>
                        These Terms shall be governed by and construed in accordance with the laws of the
                        jurisdiction in which Starbright Lab operates, without regard to conflict of law principles.
                        Any disputes arising from these Terms or the Service shall be resolved through good faith
                        negotiation, and if necessary, binding arbitration.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">14. Contact Us</h2>
                    <p>
                        If you have questions or concerns about these Terms, please contact us at:
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
