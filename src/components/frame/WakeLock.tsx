"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface WakeLockHandle {
    play: () => void;
    pause: () => void;
}

const WakeLock = forwardRef<WakeLockHandle, unknown>((props, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const activeRef = useRef(false); // true while frame mode is active

    useImperativeHandle(ref, () => ({
        play: () => {
            activeRef.current = true;
            if (videoRef.current) {
                videoRef.current.play().catch(e => console.error("WakeLock play failed:", e));
            }
        },
        pause: () => {
            activeRef.current = false;
            if (videoRef.current) {
                videoRef.current.pause();
            }
        }
    }));

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onPause = () => {
            // If we're still supposed to be playing (frame mode active), the pause was
            // unexpected — e.g. Chrome power management or media pipeline suspension.
            // Restart after a short delay to avoid fighting with intentional pause().
            if (activeRef.current) {
                setTimeout(() => {
                    if (activeRef.current && video.paused && !video.ended) {
                        video.play().catch(e => console.error("[WakeLock] Auto-restart failed:", e));
                    }
                }, 1000);
            }
        };

        const onEnded = () => {
            video.play().catch(e => console.error("[WakeLock] Restart failed:", e));
        };

        video.addEventListener('pause', onPause);
        video.addEventListener('ended', onEnded);

        return () => {
            video.removeEventListener('pause', onPause);
            video.removeEventListener('ended', onEnded);
        };
    }, []);

    return (
        <video
            ref={videoRef}
            src="/assets/silent.mp4"
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none"
        />
    );
});

WakeLock.displayName = "WakeLock";
export default WakeLock;
