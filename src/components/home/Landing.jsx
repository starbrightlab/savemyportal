"use client";

import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Slideshow from '@/components/frame/Slideshow';
import WakeLock from '@/components/frame/WakeLock';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Landing() {
    const { user, loading } = useAuth();
    const [isFrameMode, setIsFrameMode] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const wakeLockRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    const router = useRouter();

    const startFrame = async () => {
        try {
            await document.documentElement.requestFullscreen();
        } catch (e) {
            console.log("Fullscreen request failed (likely need gesture):", e);
        }

        setIsFrameMode(true);
        wakeLockRef.current?.play();
    };

    const exitFrame = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.log(err));
        }
        setIsFrameMode(false);
        wakeLockRef.current?.pause();
    };

    const handleInteraction = () => {
        if (!isFrameMode) return;

        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    };

    if (loading) return null;

    return (
        <div
            className="relative w-screen h-screen overflow-hidden bg-deep-space text-white"
            onClick={handleInteraction}
        >
            <WakeLock ref={wakeLockRef} />

            {/* Background Layer: The Slideshow */}
            <div className="absolute inset-0 z-0">
                <Slideshow speed={15000} user={user} feed={feed} />
            </div>

            {/* Overlay Layer: Visible when NOT in Frame Mode */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-1000 z-10 flex flex-col items-center justify-center
                ${isFrameMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <div className="text-center space-y-8 max-w-2xl px-6">
                    <div className="flex justify-center mb-8">
                        <img
                            src="/savemyportal-logo-white.svg"
                            alt="SaveMyPortal Logo"
                            className="w-32 h-32 md:w-48 md:h-48 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-pulse-slow"
                        />
                    </div>

                    {!user ? (
                        /* GUEST STATE */
                        <div className="space-y-6">
                            <Link
                                href="/onboarding"
                                className="px-20 py-10 bg-electric-blue border-2 border-white/50 text-white rounded-3xl text-4xl font-bold hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-all transform hover:scale-105 flex items-center gap-4 shadow-2xl"
                            >
                                Get Started
                            </Link>
                            <p className="text-xl text-gray-300 font-light">
                                Repurpose your portal. Give it a second life.
                            </p>
                        </div>
                    ) : (
                        /* LOGGED IN STATE */
                        <div className="flex flex-col items-center gap-12 w-full">
                            {/* CTA Button: Centered & Large */}
                            <div className="flex-1 flex items-center justify-center w-full py-12">
                                <button
                                    onClick={startFrame}
                                    className="px-20 py-10 bg-electric-blue border-2 border-white/50 text-white rounded-3xl text-4xl font-bold hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-all transform hover:scale-105 flex items-center gap-4 shadow-2xl"
                                >
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Start Frame
                                </button>
                            </div>

                            {/* Secondary Controls - Pushed lower */}
                            <div className="flex justify-center mt-8">
                                <Link
                                    href="/dashboard"
                                    className="px-8 py-3 text-base font-medium text-gray-300 hover:text-white border border-white/20 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm"
                                >
                                    Settings
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Frame Controls: Visible on Tap in Frame Mode */}
            <div
                className={`absolute top-0 left-0 right-0 p-8 z-50 flex justify-between items-start transition-opacity duration-300 bg-gradient-to-b from-black/80 to-transparent
                ${isFrameMode && showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <div className="text-white/80 font-medium">
                    {/* Clock or Info could go here */}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-3 glass rounded-full text-white font-medium hover:bg-white/20 transition-all backdrop-blur-md"
                    >
                        Settings
                    </button>
                    <button
                        onClick={exitFrame}
                        className="px-6 py-3 bg-red-500/20 text-red-100 border border-red-500/30 rounded-full font-medium hover:bg-red-500/30 transition-all backdrop-blur-md"
                    >
                        Exit
                    </button>
                </div>
            </div>
            {/* Footer - Hidden in Frame Mode */}
            <footer
                className={`absolute bottom-0 w-full p-6 flex flex-col md:flex-row justify-between items-center text-xs text-white/40 z-20 transition-opacity duration-1000
                ${isFrameMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <div className="w-full md:w-1/3 text-center md:text-left hidden md:block">
                    {/* Spacer for balance */}
                </div>

                <div className="w-full md:w-1/3 text-center mb-4 md:mb-0">
                    <span>Made with <span className="text-red-500">♥</span> by </span>
                    <a href="https://starbrightlab.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                        Starbright Lab
                    </a>
                </div>

                <div className="w-full md:w-1/3 flex justify-center md:justify-end gap-6">
                    <Link href="/privacy" className="hover:text-white transition-colors">
                        Privacy
                    </Link>
                    <Link href="/terms" className="hover:text-white transition-colors">
                        Terms
                    </Link>
                </div>
            </footer>
        </div>
    );
}
