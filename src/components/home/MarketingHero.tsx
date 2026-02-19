"use client";

import React from 'react';
import Link from 'next/link';

const FEATURES = [
    {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
            </svg>
        ),
        title: "Your Photos, Back Where They Belong",
        description: "Connect Google Photos or iCloud albums. See them on your Portal again."
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
        ),
        title: "No Jailbreak Required",
        description: "Works in the Portal's built-in browser. 2 minutes to set up, zero technical knowledge needed."
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
        ),
        title: "Free Forever",
        description: "The free tier gives you exactly what Meta took away. Pro unlocks extras if you want them."
    },
];

export default function MarketingHero() {
    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-black/70 via-black/50 to-black/70">
            <div className="text-center space-y-8 max-w-3xl px-6">
                
                {/* Logo + Tagline */}
                <div className="space-y-6">
                    <div className="flex justify-center">
                        <img
                            src="/savemyportal-logo-white.svg"
                            alt="SaveMyPortal Logo"
                            className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                        />
                    </div>
                    
                    <div className="space-y-3">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-outfit tracking-tight text-white">
                            Your Portal Isn't Dead.
                        </h1>
                        <p className="text-xl md:text-2xl text-electric-blue font-light">
                            We saved it.
                        </p>
                    </div>
                    
                    <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto font-light leading-relaxed">
                        Meta killed your photo frame. We brought it back. 
                        <span className="text-white"> Turn your Portal into a beautiful slideshow again — in under 2 minutes.</span>
                    </p>
                </div>

                {/* CTA */}
                <div className="flex flex-col items-center gap-4">
                    <Link
                        href="/onboarding"
                        className="group px-12 py-5 bg-electric-blue hover:bg-blue-500 text-white rounded-2xl text-xl md:text-2xl font-bold transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] flex items-center gap-3"
                    >
                        Get Started Free
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                    <p className="text-sm text-white/50">
                        No credit card required • Works on Portal Plus Gen 2
                    </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 max-w-4xl mx-auto">
                    {FEATURES.map((feature, i) => (
                        <div 
                            key={i}
                            className="p-5 rounded-xl text-left"
                            style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div className="w-10 h-10 rounded-lg bg-electric-blue/20 flex items-center justify-center text-electric-blue mb-3">
                                {feature.icon}
                            </div>
                            <h3 className="text-base font-semibold text-white mb-1">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-white/60 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Social Proof / Trust */}
                <div className="flex flex-col items-center gap-3 pt-4">
                    <div className="flex items-center gap-2 text-sm text-white/40">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span>Open Source</span>
                        <span className="text-white/20">•</span>
                        <span>Made by <a href="https://starbrightlab.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">Starbright Lab</a></span>
                    </div>
                </div>
            </div>

            {/* Bottom Links */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 text-xs text-white/30">
                <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
                <Link href="/mission" className="hover:text-white/60 transition-colors">Our Mission</Link>
            </div>
        </div>
    );
}
