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

        // Listen for auth state changes (e.g. after redirect back from Google)
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) setUser(session.user);
            if (event === 'SIGNED_OUT') setUser(null);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin, // Redirects back to wherever we are
                scopes: 'https://www.googleapis.com/auth/photoslibrary.readonly' // Request Photos access immediately
            }
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="center-content">
            <h1>Settings</h1>

            <div style={{ marginTop: 20, padding: 30, background: '#222', borderRadius: 16, width: '100%', maxWidth: 400 }}>
                <h2>Account</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : user ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        {user.user_metadata?.avatar_url && (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt="Avatar"
                                style={{ width: 64, height: 64, borderRadius: '50%' }}
                            />
                        )}
                        <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{user.user_metadata?.full_name}</p>
                        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>{user.email}</p>
                        <button onClick={handleLogout} style={{ ...btnStyle, background: '#ef4444' }}>Sign Out</button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ marginBottom: 20 }}>Connect your Google Photos account to access your albums.</p>
                        <button onClick={handleLogin} style={btnStyle}>
                            Connect Google Account
                        </button>
                    </div>
                )}
            </div>

            <div style={{ marginTop: 40, textAlign: 'center' }}>
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
