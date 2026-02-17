import React, { useState, useRef } from 'react';
import silentVideo from '../assets/silent.mp4';

const DualVideoTest = () => {
    const [logs, setLogs] = useState([]);
    const [foregroundPlaying, setForegroundPlaying] = useState(false);
    const foregroundRef = useRef(null);

    const addLog = (msg) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10)); // Keep last 10
        console.log(msg);
    };

    const toggleForeground = async () => {
        if (!foregroundRef.current) return;

        if (foregroundPlaying) {
            foregroundRef.current.pause();
            addLog("Foreground: Paused");
            setForegroundPlaying(false);
        } else {
            try {
                await foregroundRef.current.play();
                addLog("Foreground: Playing");
                setForegroundPlaying(true);
            } catch (e) {
                addLog(`Foreground Error: ${e.message}`);
            }
        }
    };

    return (
        <div style={{ padding: 20, color: 'white', position: 'relative', zIndex: 100 }}>
            <h1>Hardware Decoder Test</h1>

            <div style={{ marginBottom: 20, border: '1px solid #333', padding: 10 }}>
                <h3>1. Heartbeat Video (Background)</h3>
                <p>Status: Running in Layout (Invisible/Black bg). Check if it stops when you play below.</p>
            </div>

            <div style={{ marginBottom: 20, border: '1px solid #333', padding: 10 }}>
                <h3>2. Foreground Video</h3>
                <button
                    onClick={toggleForeground}
                    style={{
                        padding: '10px 20px',
                        fontSize: '1.2rem',
                        background: foregroundPlaying ? 'red' : 'green',
                        color: 'white',
                        border: 'none',
                        borderRadius: 5
                    }}
                >
                    {foregroundPlaying ? "Pause Video 2" : "Play Video 2"}
                </button>
                <video
                    ref={foregroundRef}
                    src={silentVideo}
                    loop
                    muted
                    playsInline
                    style={{
                        display: 'block',
                        width: 300,
                        marginTop: 10,
                        border: '2px solid blue',
                        opacity: 0.5 // Visible so we can see it
                    }}
                />
            </div>

            <div style={{ background: '#111', padding: 10, borderRadius: 5, fontFamily: 'monospace' }}>
                <h3>Logs</h3>
                {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
        </div>
    );
};

export default DualVideoTest;
