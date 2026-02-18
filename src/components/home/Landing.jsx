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
                <Slideshow speed={15000} />
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
                            <p className="text-xl text-gray-300 font-light">
                                Repurpose your hardware. Give it a second life.
                            </p>
                            <Link
                                href="/onboarding"
                                className="inline-block px-10 py-5 bg-electric-blue text-white rounded-full text-xl font-bold hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all transform hover:scale-105"
                            >
                                Get Started
                            </Link>
                        </div>
                    ) : (
                        /* LOGGED IN STATE */
                        <div className="space-y-8 animate-fade-in">
                            <button
                                onClick={startFrame}
                                className="px-12 py-6 bg-electric-blue text-white rounded-2xl text-2xl font-bold hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
                            >
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start Frame
                            </button>

                            <div className="flex justify-center gap-6">
                                <Link
                                    href="/dashboard"
                                    className="px-6 py-2 text-sm font-medium text-gray-400 hover:text-white border border-white/10 rounded-full hover:bg-white/5 transition-colors"
                                >
                                    Manage Feed
                                </Link>
                                <button className="px-6 py-2 text-sm font-medium text-gray-400 hover:text-white border border-white/10 rounded-full hover:bg-white/5 transition-colors">
                                    Settings
                                </button>
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
        </div>
    );
}
