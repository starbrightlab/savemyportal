"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

const WakeLock = forwardRef((props, ref) => {
    const videoRef = useRef(null);

    useImperativeHandle(ref, () => ({
        play: () => {
            if (videoRef.current) {
                videoRef.current.play().catch(e => console.error("WakeLock play failed:", e));
            }
        },
        pause: () => {
            if (videoRef.current) {
                videoRef.current.pause();
            }
        }
    }));

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onPause = () => {
            // If we expect it to be playing, we might want to force it.
            // For now, we only log. Logic to force-stay-awake should be handled by the parent
            // calling .play() when entering Frame Mode.
            console.log("[WakeLock] Video paused.");
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
