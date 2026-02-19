"use client";

import React, { useState, useEffect } from 'react';

interface StepDonateProps {
    onComplete: () => void;
}

interface PriceInfo {
    basePrice: number;
    finalPrice: number;
    discountActive: boolean;
    discountPercent: number | null;
}

export default function StepDonate({ onComplete }: StepDonateProps) {
    const [loading, setLoading] = useState(false);
    const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);

    useEffect(() => {
        fetch('/api/stripe/price')
            .then(res => res.json())
            .then(data => { if (!data.error) setPriceInfo(data); })
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
                setLoading(false);
            }
        } catch {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 text-center">
            <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white">Unlock the Full Experience</h2>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                    Your Portal frame is ready! Want to take it further?
                    Upgrade to Pro for unlimited feeds, video support, and full customisation.
                </p>
            </div>

            {/* Feature comparison */}
            <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
                <div className="space-y-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Free</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            1 feed
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            1 source
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Photos only
                        </li>
                    </ul>
                </div>
                <div className="space-y-3 p-4 rounded-xl border border-soft-gold/30 bg-soft-gold/5">
                    <h3 className="text-xs font-bold text-soft-gold uppercase tracking-wide">Pro</h3>
                    <ul className="space-y-2 text-sm text-gray-200">
                        <li className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-soft-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Unlimited feeds
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-soft-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Unlimited sources
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-soft-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Photos & videos
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-soft-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Full customisation
                        </li>
                    </ul>
                </div>
            </div>

            <div className="space-y-3 pt-2">
                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="w-full py-4 bg-soft-gold hover:bg-yellow-500 text-black rounded-xl font-bold text-lg transition-all shadow-lg shadow-soft-gold/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {loading ? 'Loading...' : (
                        <>
                            Upgrade to Pro
                            {priceInfo && (
                                <span className="text-black/70 font-medium text-base">
                                    {priceInfo.discountActive ? (
                                        <><span className="line-through opacity-50">${priceInfo.basePrice}</span> ${priceInfo.finalPrice}</>
                                    ) : (
                                        <>${priceInfo.finalPrice}</>
                                    )}
                                </span>
                            )}
                        </>
                    )}
                </button>
                <button
                    onClick={onComplete}
                    className="w-full py-4 bg-electric-blue hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-electric-blue/20"
                >
                    Continue with Free
                </button>
            </div>

            <p className="text-xs text-gray-600">
                One-time payment. No subscription. Use on all your devices.
            </p>
        </div>
    );
}
