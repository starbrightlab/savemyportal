"use client";

import { useState, useEffect } from 'react';

interface PriceInfo {
    basePrice: number;
    currency: string;
    discountActive: boolean;
    discountPercent: number | null;
    finalPrice: number;
}

interface UpgradePromptProps {
    feature?: string;
    compact?: boolean;
}

export default function UpgradePrompt({ feature, compact = false }: UpgradePromptProps) {
    const [loading, setLoading] = useState(false);
    const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);

    useEffect(() => {
        fetch('/api/stripe/price')
            .then(res => res.json())
            .then(data => {
                if (!data.error) setPriceInfo(data);
            })
            .catch(() => {});
    }, []);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/stripe/create-checkout', { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('Checkout error:', data.error);
                setLoading(false);
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setLoading(false);
        }
    };

    if (compact) {
        return (
            <button
                onClick={handleUpgrade}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-base font-semibold text-soft-gold border border-soft-gold/30 active:bg-soft-gold/10 rounded-lg transition-all disabled:opacity-50"
            >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 3.456a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-3.456A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                {loading ? 'Loading...' : (
                    <>
                        Upgrade to Pro
                    </>
                )}
            </button>
        );
    }

    return (
        <div className="rounded-xl border border-soft-gold/20 bg-soft-gold/5 p-6 space-y-4">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-soft-gold/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-soft-gold" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 3.456a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-3.456A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">Upgrade to Pro</h3>
                    <p className="text-base text-gray-300 mt-1">
                        {feature
                            ? `Unlock ${feature} and more with a one-time Pro upgrade.`
                            : 'Unlock unlimited feeds, sources, video support, and full customisation.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-base">
                <div className="space-y-1.5">
                    <div className="text-gray-400 font-medium text-sm uppercase tracking-wide">Free</div>
                    <div className="text-gray-300">1 feed, 1 source</div>
                    <div className="text-gray-300">Photos only</div>
                    <div className="text-gray-300">Default settings</div>
                </div>
                <div className="space-y-1.5">
                    <div className="text-soft-gold font-medium text-sm uppercase tracking-wide">Pro</div>
                    <div className="text-gray-200">Unlimited feeds & sources</div>
                    <div className="text-gray-200">Photos & videos</div>
                    <div className="text-gray-200">Full customisation</div>
                </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="flex-1 py-3.5 bg-soft-gold active:bg-yellow-500 text-black rounded-lg font-bold text-base transition-all disabled:opacity-50 shadow-lg shadow-soft-gold/20"
                >
                    {loading ? 'Loading...' : 'Upgrade Now'}
                </button>
                {priceInfo && (
                    <div className="text-right">
                        {priceInfo.discountActive ? (
                            <>
                                <div className="text-lg font-bold text-soft-gold">${priceInfo.finalPrice}</div>
                                <div className="text-sm text-gray-400">
                                    <span className="line-through">${priceInfo.basePrice}</span>
                                    {' '}Launch offer
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-lg font-bold text-white">${priceInfo.finalPrice}</div>
                                <div className="text-sm text-gray-400">One-time payment</div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <p className="text-sm text-gray-400 text-center">
                Pay once, use forever. Works on all your devices.
            </p>
        </div>
    );
}
