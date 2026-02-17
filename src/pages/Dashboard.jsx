import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    const apps = [
        {
            id: 'slideshow',
            title: 'Photos',
            icon: '📸',
            route: '/slideshow',
            color: 'from-purple-500 to-blue-500'
        },
        {
            id: 'weather',
            title: 'Weather',
            icon: '☁️',
            // Placeholder for now
            route: '#',
            color: 'from-blue-400 to-cyan-300'
        },
        {
            id: 'settings',
            title: 'Settings',
            icon: '⚙️',
            route: '/settings',
            color: 'from-gray-600 to-gray-400'
        }
    ];

    return (
        <div className="center-content" style={{ padding: 20 }}>
            <h1 style={{ marginBottom: 40, fontSize: '2.5rem' }}>Good Afternoon</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 20,
                width: '100%',
                maxWidth: 800
            }}>
                {apps.map(app => (
                    <div
                        key={app.id}
                        onClick={() => navigate(app.route)}
                        style={{
                            background: `linear-gradient(135deg, var(--tw-gradient-stops, #333, #111))`,
                            borderRadius: 16,
                            aspectRatio: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transition: 'transform 0.2s',
                        }}
                        className={`hover:scale-105 active:scale-95 bg-gradient-to-br ${app.color}`}
                    >
                        <span style={{ fontSize: '3rem', marginBottom: 10 }}>{app.icon}</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>{app.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
