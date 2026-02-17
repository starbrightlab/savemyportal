import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Settings = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        checkUser();
    }, []);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <div className="center-content">
            <h1>Settings</h1>

            <div style={{ marginTop: 20, padding: 20, background: '#222', borderRadius: 10 }}>
                <h2>Account</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : user ? (
                    <div>
                        <p>Logged in as: {user.email}</p>
                        <button onClick={handleLogout} style={btnStyle}>Sign Out</button>
                    </div>
                ) : (
                    <div>
                        <p>Not connected.</p>
                        <button onClick={handleLogin} style={btnStyle}>Connect Google Account</button>
                    </div>
                )}
            </div>

            <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>SaveMyPortal v0.1.0</p>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>Provided by Starbright Lab</p>
            </div>
        </div>
    );
};

const btnStyle = {
    marginTop: 10,
    padding: '10px 20px',
    borderRadius: 5,
    border: 'none',
    background: '#3b82f6',
    color: 'white',
    fontSize: '1rem',
    cursor: 'pointer'
};

export default Settings;
