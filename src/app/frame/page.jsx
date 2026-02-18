"use client";

import React, { useRef, useEffect } from 'react';
import Slideshow from '@/components/frame/Slideshow';
import Link from 'next/link';

export default function Frame() {
    const videoRef = useRef(null);

    // Wake Lock Strategy: Play a silent, looping video in the background.
    // This trick (T17 Wake Lock) prevents the Facebook Portal from entering sleep mode.
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const playVideo = async () => {
            try {
                await video.play();
                console.log("[WakeLock] Video started.");
            } catch (err) {
                console.error("[WakeLock] Play failed:", err);
            }
        };

        const onPause = () => {
            console.log("[WakeLock] Paused unexpectedly. Restarting...");
            playVideo();
        };

        video.addEventListener('pause', onPause);
        video.addEventListener('ended', playVideo);

        // Initial play
        playVideo();

        // Watchdog
        const interval = setInterval(() => {
            if (video.paused) {
                console.log("[WakeLock] Watchdog triggering play...");
                playVideo();
            }
        }, 5000);

        return () => {
            video.removeEventListener('pause', onPause);
            video.removeEventListener('ended', playVideo);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="relative w-screen h-screen bg-black overflow-hidden group">
            {/* Wake Lock Video (Invisible but active) */}
            <video
                ref={videoRef}
                src="/assets/silent.mp4" // Served from public/assets or we need to import it if using src/assets
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none"
            />

            {/* Main Content */}
            <Slideshow speed={15000} />

            {/* Exit Overlay (Visible on Hover/Tap) */}
            <div className="absolute top-0 left-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-b from-black/80 to-transparent z-50">
                <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-white/10 glass rounded-full text-white font-medium hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md"
                >
                    ← Exit Frame
                </Link>
            </div>
        </div>
    );
}
