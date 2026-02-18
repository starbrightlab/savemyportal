export default function Privacy() {
    return (
        <div className="min-h-screen bg-deep-space text-gray-300 p-8 md:p-16">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
                    <p>Welcome to SaveMyPortal ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Information We Collect</h2>
                    <p>We collect personal information that you voluntarily provide to us when you register on the application, specifically:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Google Account information (email, name, profile picture) via Google Sign-In.</li>
                        <li>Photos and media URLs that you explicitly choose to link from your Google Photos or iCloud albums.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. How We Use Your Information</h2>
                    <p>We use your information strictly to provide the digital photo frame functionality. We do not sell or share your data with third parties for marketing purposes.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Contact Us</h2>
                    <p>If you have questions or comments about this policy, you may email us at support@starbrightlab.com.</p>
                </section>

                <div className="pt-8">
                    <a href="/" className="text-electric-blue hover:text-white transition-colors">← Back to Home</a>
                </div>
            </div>
        </div>
    );
}
