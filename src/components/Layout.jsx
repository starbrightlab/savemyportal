
import React, { useState, useRef } from 'react';
import HeartbeatVideo from './HeartbeatVideo';

const Layout = ({ children }) => {
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 5)); // Keep last 5 logs
    };

    const handleStart = async () => {
        if (videoRef.current) {
            await videoRef.current.play();
            setHasStarted(true);
        }
    };

    return (
        <div className="layout-root">
            {/* 1. Heartbeat Video (Always present, z-index: 0) */}
            <HeartbeatVideo ref={videoRef} onLog={addLog} />

            {/* Debug Overlay (Temporary) */}
            <div style={{
                position: 'fixed',
                bottom: 10,
                right: 10,
                zIndex: 9999,
                background: 'rgba(0,0,0,0.7)',
                color: '#0f0',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '5px',
                pointerEvents: 'none',
                maxWidth: '300px'
            }}>
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>

            {/* 2. Interaction Layer (z-index: 100) */}
            {!hasStarted && (
                <div className="start-overlay" onClick={handleStart}>
                    <div className="start-content">
                        <h1>SaveMyPortal</h1>
                        <p>Tap anywhere to start</p>
                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>v0.1.1-debug</p>
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
