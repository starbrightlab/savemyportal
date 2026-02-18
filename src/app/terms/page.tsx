export default function Terms() {
    return (
        <div className="min-h-screen bg-deep-space text-gray-300 p-8 md:p-16">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. Agreement to Terms</h2>
                    <p>By accessing or using SaveMyPortal, you agree to be bound by these Terms of Service.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Description of Service</h2>
                    <p>SaveMyPortal is a tool designed to repurpose Meta Portal devices into digital photo frames. It is not affiliated with Meta Platforms, Inc.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. User Responsibilities</h2>
                    <p>You are responsible for maintaining the confidentiality of your account linking information and for all activities that occur under your account.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Disclaimer</h2>
                    <p>The service is provided on an "as-is" and "as-available" basis. We disclaim all warranties, express or implied.</p>
                </section>

                <div className="pt-8">
                    <a href="/" className="text-electric-blue hover:text-white transition-colors">← Back to Home</a>
                </div>
            </div>
        </div>
    );
}
