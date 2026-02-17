
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Settings = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sources, setSources] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchSources();
            }
            setLoading(false);
        };
        checkUser();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setUser(session.user);
                fetchSources();
            }
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setSources([]);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchSources = async () => {
        const { data, error } = await supabase
            .from('sources')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setSources(data);
        if (error) console.error("Error fetching sources:", error);
    };

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                // No special scopes needed anymore
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const identifySourceType = (url) => {
        if (url.includes('photos.app.goo.gl') || url.includes('photos.google.com')) return 'google_photos';
        if (url.includes('icloud.com/sharedalbum')) return 'icloud';
        if (url.includes('dropbox.com')) return 'dropbox';
        return null;
    };

    const handleAddSource = async () => {
        if (!newUrl) return;
        setAdding(true);
        setMessage(null);

        const type = identifySourceType(newUrl);
        if (!type) {
            setMessage({ type: 'error', text: 'Invalid URL. Please provide a valid Google Photos or iCloud Shared Album link.' });
            setAdding(false);
            return;
        }

        try {
            // 1. Insert Source
            const { data: source, error } = await supabase
                .from('sources')
                .insert({
                    user_id: user.id,
                    url: newUrl,
                    type: type,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            console.log("Source added:", source);
            setNewUrl('');
            fetchSources(); // Refresh list immediately

            // 2. Trigger Scraper
            setMessage({ type: 'info', text: 'Source added. Syncing photos...' });

            const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('source-manager', {
                body: { sourceId: source.id }
            });

            if (scrapeError) throw scrapeError;

            console.log("Scrape result:", scrapeData);
            setMessage({ type: 'success', text: `Success! Found ${scrapeData.count || 0} photos.` });
            fetchSources(); // Refresh to show active status

        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: `Error: ${e.message}` });
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to remove this album?")) return;

        await supabase.from('sources').delete().eq('id', id);
        setSources(prev => prev.filter(s => s.id !== id));
    };

    const handleResync = async (id) => {
        setMessage({ type: 'info', text: 'Syncing...' });
        try {
            const { data: scrapeData, error } = await supabase.functions.invoke('source-manager', {
                body: { sourceId: id }
            });
            if (error) throw error;
            setMessage({ type: 'success', text: `Synced! Found ${scrapeData.count || 0} photos.` });
            fetchSources();
        } catch (e) {
            setMessage({ type: 'error', text: `Sync failed: ${e.message}` });
        }
    };

    // Helper for status icons
    const getStatusIcon = (status) => {
        if (status === 'active') return '✅';
        if (status === 'error') return '⚠️';
        return '⏳';
    };

    return (
        <div className="center-content">
            <h1>Settings</h1>

            <div style={{ marginTop: 20, padding: 30, background: '#222', borderRadius: 16, width: '100%', maxWidth: 600 }}>
                <h2>Connected Albums</h2>

                {loading ? (
                    <p>Loading...</p>
                ) : user ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid #444' }}>
                            {user.user_metadata?.avatar_url && (
                                <img src={user.user_metadata.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                            )}
                            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>{user.email}</span>
                            <button onClick={handleLogout} style={smallBtnStyle}>Sign Out</button>
                        </div>

                        {/* Add Source Form */}
                        <div>
                            <p style={{ marginBottom: 10 }}>Add a Shared Album URL (Google Photos or iCloud):</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input
                                    type="text"
                                    placeholder="https://photos.app.goo.gl/..."
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    style={{ flex: 1, padding: 10, borderRadius: 5, border: '1px solid #555', background: '#333', color: 'white' }}
                                />
                                <button
                                    onClick={handleAddSource}
                                    disabled={adding || !newUrl}
                                    style={{ ...btnStyle, opacity: adding ? 0.7 : 1 }}
                                >
                                    {adding ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                            {message && <p style={{
                                marginTop: 10,
                                color: message.type === 'error' ? '#ef4444' : message.type === 'success' ? '#10b981' : '#3b82f6',
                                fontSize: '0.9rem'
                            }}>{message.text}</p>}
                        </div>

                        {/* Sources List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {sources.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>No albums connected yet.</p>
                            ) : (
                                sources.map(source => (
                                    <div key={source.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#333', padding: 10, borderRadius: 8 }}>
                                        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginRight: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <span>{source.type === 'google_photos' ? '🖼️ Google' : source.type === 'icloud' ? '☁️ iCloud' : '📁 Dropbox'}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#999' }}>({getStatusIcon(source.status)})</span>
                                            </div>
                                            <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'none' }}>
                                                {source.url}
                                            </a>
                                            {source.error_message && <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>{source.error_message}</div>}
                                            {source.last_scraped_at && <div style={{ color: '#666', fontSize: '0.75rem' }}>Last synced: {new Date(source.last_scraped_at).toLocaleTimeString()}</div>}
                                        </div>
                                        <div style={{ display: 'flex', gap: 5 }}>
                                            <button onClick={() => handleResync(source.id)} style={{ ...smallBtnStyle, background: '#6366f1' }}>Sync</button>
                                            <button onClick={() => handleDelete(source.id)} style={{ ...smallBtnStyle, background: '#ef4444' }}>DEL</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ marginBottom: 20 }}>Sign in to manage your connected albums.</p>
                        <button onClick={handleLogin} style={btnStyle}>
                            Sign In with Google
                        </button>
                    </div>
                )}
            </div>

            <div style={{ marginTop: 40, textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>SaveMyPortal v0.2.0</p>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>Provided by Starbright Lab</p>
            </div>
        </div>
    );
};

const btnStyle = {
    padding: '10px 20px',
    borderRadius: 5,
    border: 'none',
    background: '#3b82f6',
    color: 'white',
    fontSize: '1rem',
    cursor: 'pointer'
};

const smallBtnStyle = {
    padding: '5px 10px',
    borderRadius: 4,
    border: 'none',
    background: '#444',
    color: 'white',
    fontSize: '0.8rem',
    cursor: 'pointer'
};

export default Settings;
