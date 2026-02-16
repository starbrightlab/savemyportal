
import React, { useState, useRef } from 'react';
import HeartbeatVideo from './HeartbeatVideo';

const Layout = ({ children }) => {
    const [hasStarted, setHasStarted] = useState(false);
    const videoRef = useRef(null);

    const handleStart = async () => {
        if (videoRef.current) {
            await videoRef.current.play();
            setHasStarted(true);
        }
    };

    return (
        <div className="layout-root">
            {/* 1. Heartbeat Video (Always present, z-index: 0) */}
            <HeartbeatVideo ref={videoRef} />

            {/* 2. Interaction Layer (z-index: 100) */}
            {!hasStarted && (
                <div className="start-overlay" onClick={handleStart}>
                    <div className="start-content">
                        <h1>SaveMyPortal</h1>
                        <p>Tap anywhere to start</p>
                    </div>
                </div>
            )}

            {/* 3. Main Application Content (z-index: 10) */}
            {hasStarted && (
                <div className="app-content">
                    {children}
                </div>
            )}
        </div>
    );
};

export default Layout;
