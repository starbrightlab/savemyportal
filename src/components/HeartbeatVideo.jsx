
import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

const SILENT_VIDEO_BASE64 = "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21tcDQxAAAACHZyZWQAAAAId2lkdGgAAAAIaGVpZ2h0AAAAAG1kYXQ=";

const HeartbeatVideo = forwardRef((props, ref) => {
    const videoRef = useRef(null);

    useImperativeHandle(ref, () => ({
        play: async () => {
            if (videoRef.current) {
                try {
                    await videoRef.current.play();
                    console.log("[Heartbeat] Video started successfully.");
                    return true;
                } catch (err) {
                    console.error("[Heartbeat] Play failed:", err);
                    return false;
                }
            }
        }
    }));

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onPause = () => console.warn("[Heartbeat] Video paused unexpectedly!");
        const onEnded = () => {
            console.log("[Heartbeat] Video ended. Restarting...");
            video.play().catch(e => console.error("Restart failed", e));
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
            src={SILENT_VIDEO_BASE64}
            loop
            muted
            playsInline
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                objectFit: 'contain',
                zIndex: 50, // Moved to Z-Index 50 (above Slideshow) to prevent Chrome background throttling
                pointerEvents: 'none',
                background: 'transparent',
                opacity: 0.001, // Force browser to render frame (prevents sleep) without affecting UI
            }}
        />
    );
});

HeartbeatVideo.displayName = 'HeartbeatVideo';

export default HeartbeatVideo;
