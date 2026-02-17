
import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

const HeartbeatVideo = forwardRef(({ onLog }, ref) => {
    const videoRef = useRef(null);

    const log = (msg) => {
        console.log(msg);
        if (onLog) onLog(msg);
    };

    useImperativeHandle(ref, () => ({
        play: async () => {
            if (videoRef.current) {
                try {
                    await videoRef.current.play();
                    log("[Heartbeat] Video started successfully.");
                    return true;
                } catch (err) {
                    console.error("[Heartbeat] Play failed:", err);
                    log(`[Heartbeat] Play failed: ${err.message}`);
                    return false;
                }
            }
        }
    }));

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onPause = () => log("[Heartbeat] Video paused unexpectedly!");
        const onEnded = () => {
            log("[Heartbeat] Video ended. Restarting...");
            video.play().catch(e => log(`Restart failed: ${e.message}`));
        };

        const onTimeUpdate = () => {
            // Optional: Log every few seconds to prove it's alive? 
            // Might be too noisy. Let's just log key events.
        };

        video.addEventListener('pause', onPause);
        video.addEventListener('ended', onEnded);

        // Add a safety check loop?
        const checkInterval = setInterval(() => {
            if (video.paused) {
                log("[Heartbeat] Watchdog: Video is paused. Attempting play...");
                video.play().catch(e => log(`Watchdog Replay Failed: ${e.message}`));
            }
        }, 5000);

        return () => {
            video.removeEventListener('pause', onPause);
            video.removeEventListener('ended', onEnded);
            clearInterval(checkInterval);
        };
    }, [onLog]);


    return (
        <video
            ref={videoRef}
            src="/silent.mp4"
            loop
            muted
            playsInline
            onError={(e) => console.error("Video Error:", e.nativeEvent)}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                objectFit: 'contain',
                zIndex: 0,
                pointerEvents: 'none',
                background: 'black',
            }}
        />
    );
});

HeartbeatVideo.displayName = 'HeartbeatVideo';

export default HeartbeatVideo;
