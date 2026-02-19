"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFeeds } from '@/hooks/useFeeds';
import Slideshow from '@/components/frame/Slideshow';
import FrameErrorBoundary from '@/components/frame/FrameErrorBoundary';
import WakeLock, { WakeLockHandle } from '@/components/frame/WakeLock';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Feed } from '@/types/feed';

export default function Landing() {
    const { user, loading } = useAuth();
    const { data: feeds = [] } = useFeeds(user?.id);
    const [isFrameMode, setIsFrameMode] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const wakeLockRef = useRef<WakeLockHandle>(null);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [activeFeedId, setActiveFeedId] = useState<string | null>(null);

    // Derive the active feed from the feeds array using priority:
    // 1. URL param (highest) → 2. localStorage → 3. activeFeedId state → 4. first feed
    const feed: Feed | null = (() => {
        if (feeds.length === 0) return null;

        // If we have an activeFeedId (from selector or init), use it
        if (activeFeedId) {
            const found = feeds.find(f => f.id === activeFeedId);
            if (found) return found as Feed;
        }

        // Fallback to first feed
        return feeds[0] as Feed;
    })();

    // On mount: check URL param → localStorage for initial feed selection
    useEffect(() => {
        if (feeds.length === 0) return;

        const params = new URLSearchParams(window.location.search);
        const paramId = params.get('feedId');

        if (paramId) {
            setActiveFeedId(paramId);
            localStorage.setItem('active_feed_id', paramId);
            window.history.replaceState({}, '', '/');
        } else {
            const storedId = localStorage.getItem('active_feed_id');
            if (storedId && feeds.some(f => f.id === storedId)) {
                setActiveFeedId(storedId);
            } else {
                setActiveFeedId(feeds[0].id);
            }
        }
    }, [feeds]);

    const handleFeedChange = (feedId: string) => {
        setActiveFeedId(feedId);
        localStorage.setItem('active_feed_id', feedId);
    };

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
                <FrameErrorBoundary>
                    <Slideshow feed={feed} />
                </FrameErrorBoundary>
            </div>

            {/* Overlay Layer: Visible when NOT in Frame Mode */}
            <div
                className={`absolute inset-0 bg-black/30 transition-opacity duration-1000 z-10 flex flex-col items-center justify-center
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
                            <p className="text-white/70 text-lg md:text-xl font-light max-w-md mx-auto">
                                Turn your old Meta Portal into a beautiful digital photo frame.
                            </p>
                            <Link
                                href="/onboarding"
                                className="px-20 py-10 bg-transparent border-2 border-white/50 text-white rounded-3xl text-4xl font-bold hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-all transform hover:scale-105 flex items-center justify-center gap-4 shadow-2xl"
                                style={{ background: "rgba(0, 0, 0, 0.1)", backdropFilter: "blur(12px)" }}
                            >
                                Get Started
                            </Link>
                        </div>
                    ) : (
                        /* LOGGED IN STATE */
                        <div className="flex flex-col items-center gap-12 w-full">
                            {/* CTA Button: Centered & Large */}
                            <div className="flex-1 flex items-center justify-center w-full py-12">
                                <button
                                    onClick={startFrame}
                                    className="px-20 py-10 bg-transparent border-2 border-white/50 text-white rounded-3xl text-4xl font-bold hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-all transform hover:scale-105 flex items-center gap-4 shadow-2xl"
                                    style={{ background: "rgba(0, 0, 0, 0.1)", backdropFilter: "blur(12px)" }}
                                >
                                    Start Frame
                                </button>
                            </div>

                            {/* Feed Selector — only visible with 2+ feeds */}
                            {feeds.length >= 2 && (
                                <div className="flex items-center gap-3">
                                    <select
                                        value={activeFeedId || ''}
                                        onChange={(e) => handleFeedChange(e.target.value)}
                                        className="appearance-none px-6 py-2.5 rounded-full text-sm font-medium text-white border border-white/20 cursor-pointer focus:outline-none focus:border-white/40 transition-colors"
                                        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                                    >
                                        {feeds.map(f => (
                                            <option key={f.id} value={f.id} className="bg-gray-900 text-white">
                                                {f.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Secondary Controls */}
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
                    {feed?.name && (
                        <span className="text-sm text-white/60 px-4 py-2 rounded-full"
                            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                        >
                            {feed.name}
                        </span>
                    )}
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
