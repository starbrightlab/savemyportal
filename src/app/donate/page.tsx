import Link from 'next/link';

export const metadata = {
    title: 'Donate - SaveMyPortal',
    description: 'Support the project.',
};

export default function Donate() {
    return (
        <div className="min-h-screen pt-24 px-6 flex flex-col items-center">
            <div className="glass-card p-10 max-w-2xl w-full text-center space-y-8">
                <h1 className="text-4xl md:text-6xl font-bold font-display text-soft-gold">
                    Support the Project
                </h1>
                <p className="text-xl text-gray-300">
                    Server costs for scraping Google Photos and iCloud are real.
                    We rely on donations to keep this service free and open source.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                    <div className="p-6 rounded-xl border border-white/10 hover:border-soft-gold/50 transition-all cursor-pointer group">
                        <div className="text-2xl font-bold text-white mb-2">$5</div>
                        <div className="text-sm text-gray-400 group-hover:text-soft-gold">Coffee</div>
                    </div>
                    <div className="p-6 rounded-xl border-2 border-soft-gold/50 bg-soft-gold/10 cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                        <div className="text-3xl font-bold text-soft-gold mb-2">$10</div>
                        <div className="text-sm text-gray-400 text-soft-gold">Server Month</div>
                    </div>
                    <div className="p-6 rounded-xl border border-white/10 hover:border-soft-gold/50 transition-all cursor-pointer group">
                        <div className="text-2xl font-bold text-white mb-2">$25</div>
                        <div className="text-sm text-gray-400 group-hover:text-soft-gold">Super Fan</div>
                    </div>
                </div>

                <a
                    href="https://buy.stripe.com/test_123" // Placeholder
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-4 mt-8 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform"
                >
                    Donate via Stripe
                </a>

                <p className="text-xs text-gray-500 mt-4">
                    Secure payment processed by Stripe. You can cancel at any time.
                </p>
            </div>
        </div>
    );
}
