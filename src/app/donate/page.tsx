import Link from 'next/link';

export const metadata = {
    title: 'Donate - SaveMyPortal',
    description: 'Support SaveMyPortal and help keep it free for everyone.',
};

const tiers = [
    {
        amount: '$5',
        label: 'Buy us a coffee',
        description: 'Keeps the servers running for another week.',
        url: 'https://buy.stripe.com/PLACEHOLDER_5',
        highlighted: false,
    },
    {
        amount: '$10',
        label: 'Cover a month',
        description: 'Covers a full month of server and infrastructure costs.',
        url: 'https://buy.stripe.com/PLACEHOLDER_10',
        highlighted: true,
    },
    {
        amount: '$25',
        label: 'Champion',
        description: 'Supports new feature development and keeps the project alive.',
        url: 'https://buy.stripe.com/PLACEHOLDER_25',
        highlighted: false,
    },
];

export default function Donate() {
    return (
        <div className="min-h-screen pt-24 px-6 flex flex-col items-center">
            <div className="glass-card p-10 max-w-2xl w-full text-center space-y-8">
                <h1 className="text-4xl md:text-5xl font-bold font-display text-soft-gold">
                    Support SaveMyPortal
                </h1>
                <p className="text-lg text-gray-300 max-w-lg mx-auto">
                    SaveMyPortal is free for everyone. Server costs, photo syncing, and continued
                    development are funded entirely by donations from people like you.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    {tiers.map((tier) => (
                        <a
                            key={tier.amount}
                            href={tier.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block p-6 rounded-xl transition-all hover:scale-105 ${
                                tier.highlighted
                                    ? 'border-2 border-soft-gold/50 bg-soft-gold/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                                    : 'border border-white/10 hover:border-soft-gold/50 bg-white/5'
                            }`}
                        >
                            <div className={`text-3xl font-bold mb-2 ${tier.highlighted ? 'text-soft-gold' : 'text-white'}`}>
                                {tier.amount}
                            </div>
                            <div className={`text-sm font-medium mb-1 ${tier.highlighted ? 'text-soft-gold/80' : 'text-gray-300'}`}>
                                {tier.label}
                            </div>
                            <div className="text-xs text-gray-500">
                                {tier.description}
                            </div>
                        </a>
                    ))}
                </div>

                <p className="text-xs text-gray-500 pt-4">
                    Donations are one-time and processed securely by Stripe. No account required.
                </p>

                <div className="pt-4">
                    <Link href="/" className="text-electric-blue hover:text-white transition-colors text-sm">
                        &larr; Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
