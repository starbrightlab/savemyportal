import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Settings = () => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [albums, setAlbums] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setSession(session);
            setLoading(false);
        };
        checkUser();

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setUser(session.user);
                setSession(session);
            }
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setSession(null);
                setAlbums([]);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                scopes: 'https://www.googleapis.com/auth/photoslibrary.readonly'
            }
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const fetchAlbums = async () => {
        if (!session?.provider_token) {
            setError("No Access Token found. Try logging out and back in.");
            return;
        }

        try {
            setError(null);
            const response = await fetch('https://photoslibrary.googleapis.com/v1/albums?pageSize=10', {
                headers: {
                    'Authorization': `Bearer ${session.provider_token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Google API Error: ${response.statusText}`);
            }

            const data = await response.json();
            setAlbums(data.albums || []);
            if (!data.albums) setError("No albums found (or empty account).");

        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    return (
        <div className="center-content">
            <h1>Settings</h1>

            <div style={{ marginTop: 20, padding: 30, background: '#222', borderRadius: 16, width: '100%', maxWidth: 500 }}>
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

                        <div style={{ width: '100%', borderTop: '1px solid #444', marginTop: 10, paddingTop: 10 }}>
                            <button onClick={fetchAlbums} style={{ ...btnStyle, background: '#10b981', width: '100%', marginBottom: 10 }}>
                                🧪 Test: Fetch My Albums
                            </button>

                            {error && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}

                            {albums.length > 0 && (
                                <div style={{ textAlign: 'left', maxHeight: 200, overflowY: 'auto', background: '#111', padding: 10, borderRadius: 5 }}>
                                    <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 5 }}>Found {albums.length} albums:</p>
                                    <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.9rem' }}>
                                        {albums.map(album => (
                                            <li key={album.id}>{album.title} ({album.mediaItemsCount} items)</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button onClick={handleLogout} style={{ ...btnStyle, background: '#ef4444', width: '100%' }}>Sign Out</button>
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
