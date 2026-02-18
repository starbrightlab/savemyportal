"use client";

import Link from 'next/link';

export default function ReadyState() {
    return (
        <section className="relative w-full h-full flex flex-col items-center justify-center bg-deep-space">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-electric-blue/10 rounded-full blur-[100px] animate-pulse-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-soft-gold/5 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center animate-fade-in space-y-12">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold font-display text-white">
                        Welcome Back
                    </h1>
                    <p className="text-gray-400 text-lg">Your frame is ready.</p>
                </div>

                {/* Primary Action */}
                <Link
                    href="/frame"
                    className="group relative inline-flex items-center justify-center px-12 py-8 bg-gradient-to-br from-electric-blue to-blue-700 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-all duration-300 transform hover:scale-105"
                >
                    <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xl font-bold text-white tracking-wide">Start Frame</span>
                    </div>
                </Link>

                {/* Secondary Actions */}
                <div className="flex justify-center gap-6 pt-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-6 py-3 glass rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Settings</span>
                    </Link>
                    <Link
                        href="/mission"
                        className="flex items-center gap-2 px-6 py-3 glass rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
                    >
                        <span>Mission</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
