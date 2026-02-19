"use client";

import React from 'react';

interface StepDonateProps {
    onComplete: () => void;
}

const tiers = [
    {
        amount: '$5',
        label: 'Buy us a coffee',
        description: 'Keeps the servers running',
        url: 'https://buy.stripe.com/PLACEHOLDER_5',
        highlighted: false,
    },
    {
        amount: '$10',
        label: 'Cover a month',
        description: 'Covers a month of server costs',
        url: 'https://buy.stripe.com/PLACEHOLDER_10',
        highlighted: true,
    },
    {
        amount: '$25',
        label: 'Champion',
        description: 'Supports feature development',
        url: 'https://buy.stripe.com/PLACEHOLDER_25',
        highlighted: false,
    },
];

export default function StepDonate({ onComplete }: StepDonateProps) {
    return (
        <div className="space-y-8 text-center">
            <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white">Help Keep SaveMyPortal Free</h2>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                    SaveMyPortal is free for everyone. If you find it useful, consider a one-time
                    donation to help cover server costs and support continued development.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {tiers.map((tier) => (
                    <a
                        key={tier.amount}
                        href={tier.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block p-6 rounded-xl transition-all hover:scale-105 ${
                            tier.highlighted
                                ? 'border-2 border-soft-gold/50 bg-soft-gold/10 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                                : 'border border-white/10 hover:border-white/30 bg-white/5'
                        }`}
                    >
                        <div className={`text-3xl font-bold mb-1 ${tier.highlighted ? 'text-soft-gold' : 'text-white'}`}>
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

            <div className="space-y-3 pt-4">
                <button
                    onClick={onComplete}
                    className="w-full py-4 bg-electric-blue hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-electric-blue/20"
                >
                    Continue to Your Frame
                </button>
                <button
                    onClick={onComplete}
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                    Maybe later
                </button>
            </div>

            <p className="text-xs text-gray-600">
                Donations are one-time and processed securely by Stripe. Donating is completely optional.
            </p>
        </div>
    );
}
