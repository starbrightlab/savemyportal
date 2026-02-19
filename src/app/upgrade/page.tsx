"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTier } from '@/context/TierContext';

interface PriceInfo {
    basePrice: number;
    finalPrice: number;
    currency: string;
    discountActive: boolean;
    discountPercent: number | null;
}

export default function Upgrade() {
    const { isPro } = useTier();
    const [loading, setLoading] = useState(false);
    const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
    const [showPromoInput, setShowPromoInput] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [promoError, setPromoError] = useState('');

    useEffect(() => {
        fetch('/api/stripe/price')
            .then(res => res.json())
            .then(data => { if (!data.error) setPriceInfo(data); })
            .catch(() => {});
    }, []);

    const handleUpgrade = async (code?: string) => {
        setLoading(true);
        setPromoError('');
        try {
            const fetchOptions: RequestInit = {
                method: 'POST',
                ...(code ? {
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ promoCode: code }),
                } : {}),
            };
            const res = await fetch('/api/stripe/create-checkout', fetchOptions);
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setPromoError(data.error || 'Something went wrong');
                setLoading(false);
            }
        } catch {
            setLoading(false);
        }
    };

    const features = [
        { free: '1 feed', pro: 'Unlimited feeds' },
        { free: '1 source', pro: 'Unlimited sources' },
        { free: 'Photos only', pro: 'Photos & videos' },
        { free: 'Default settings', pro: 'Full customisation' },
        { free: null, pro: 'Sleep schedule' },
        { free: null, pro: 'Custom transitions' },
        { free: null, pro: 'Video sound control' },
    ];

    return (
        <div className="min-h-screen pt-24 px-6 flex flex-col items-center">
            <div className="max-w-3xl w-full space-y-10">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-display text-white">
                        Upgrade to <span className="text-soft-gold">Pro</span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-lg mx-auto">
                        Unlock the full SaveMyPortal experience with a one-time payment.
                        No subscription, no recurring charges.
                    </p>
                </div>

                {isPro ? (
                    /* Already Pro */
                    <div className="text-center p-10 rounded-2xl border border-soft-gold/20 bg-soft-gold/5">
                        <div className="w-16 h-16 rounded-full bg-soft-gold/10 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-soft-gold" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 3.456a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-3.456A1 1 0 0112 2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-soft-gold mb-2">You're on Pro!</h2>
                        <p className="text-gray-400">All features are unlocked. Thank you for your support.</p>
                    </div>
                ) : (
                    <>
                        {/* Feature comparison */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Free</h2>
                                <ul className="space-y-3">
                                    {features.map((f, i) => (
                                        f.free ? (
                                            <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                                                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                {f.free}
                                            </li>
                                        ) : (
                                            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                                <svg className="w-4 h-4 text-gray-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                {f.pro}
                                            </li>
                                        )
                                    ))}
                                </ul>
                                <div className="pt-3 border-t border-white/5">
                                    <div className="text-2xl font-bold text-white">Free</div>
                                    <div className="text-xs text-gray-500">Forever</div>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl border border-soft-gold/30 bg-soft-gold/5 space-y-4 relative overflow-hidden">
                                {priceInfo?.discountActive && (
                                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-soft-gold/20 text-soft-gold text-[10px] font-bold uppercase tracking-wider">
                                        Launch offer
                                    </div>
                                )}
                                <h2 className="text-sm font-bold text-soft-gold uppercase tracking-wide">Pro</h2>
                                <ul className="space-y-3">
                                    {features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-200">
                                            <svg className="w-4 h-4 text-soft-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            {f.pro}
                                        </li>
                                    ))}
                                </ul>
                                <div className="pt-3 border-t border-soft-gold/10">
                                    {priceInfo ? (
                                        priceInfo.discountActive ? (
                                            <>
                                                <div className="text-2xl font-bold text-soft-gold">
                                                    ${priceInfo.finalPrice}
                                                    <span className="text-sm text-gray-500 line-through ml-2">${priceInfo.basePrice}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">One-time payment</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-2xl font-bold text-white">${priceInfo.finalPrice}</div>
                                                <div className="text-xs text-gray-500">One-time payment</div>
                                            </>
                                        )
                                    ) : (
                                        <div className="h-8" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="text-center space-y-4">
                            <button
                                onClick={() => handleUpgrade()}
                                disabled={loading}
                                className="px-12 py-4 bg-soft-gold hover:bg-yellow-500 text-black rounded-xl font-bold text-lg transition-all shadow-lg shadow-soft-gold/20 disabled:opacity-50"
                            >
                                {loading ? 'Loading...' : 'Upgrade Now'}
                            </button>
                            <p className="text-xs text-gray-600">
                                Pay once, use forever. Works on all your devices. Processed securely by Stripe.
                            </p>

                            {/* Promo code input */}
                            {!showPromoInput ? (
                                <button
                                    onClick={() => setShowPromoInput(true)}
                                    className="text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
                                >
                                    Have a code?
                                </button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                                        placeholder="Enter code"
                                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-soft-gold/50"
                                    />
                                    <button
                                        onClick={() => promoCode.trim() && handleUpgrade(promoCode.trim())}
                                        disabled={loading || !promoCode.trim()}
                                        className="px-4 py-2 bg-soft-gold hover:bg-yellow-500 text-black rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                                    >
                                        {loading ? '...' : 'Apply'}
                                    </button>
                                </div>
                            )}
                            {promoError && (
                                <p className="text-xs text-red-400">{promoError}</p>
                            )}
                        </div>

                        {/* FAQ */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-bold text-white">Questions</h3>
                            <div className="space-y-3">
                                {[
                                    { q: 'Is this a subscription?', a: 'No. It\'s a one-time payment. You pay once and keep Pro forever.' },
                                    { q: 'Can I use Pro on multiple devices?', a: 'Yes. Pro is tied to your account, not your device. Sign in on any Portal and it works.' },
                                    { q: 'What if I don\'t upgrade?', a: 'The free tier gives you everything Meta originally provided — 1 feed, 1 source, photos only. It works great.' },
                                ].map((faq, i) => (
                                    <div key={i} className="p-4 rounded-lg border border-white/5 bg-white/[0.02]">
                                        <p className="text-sm font-medium text-white">{faq.q}</p>
                                        <p className="text-sm text-gray-500 mt-1">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <div className="text-center pb-12">
                    <Link href="/" className="text-electric-blue hover:text-white transition-colors text-sm">
                        &larr; Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
