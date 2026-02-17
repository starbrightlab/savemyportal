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
                // Use FULL URLs for all scopes and include openid to match debug script exactly
                scopes: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
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

    const checkScopes = async () => {
        if (!session?.provider_token) {
            setError("No Access Token found.");
            return;
        }
        try {
            const res = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${session.provider_token}`);
            const data = await res.json();
            console.log("Token Info:", data);

            // Log the Project Number specifically
            const projectNumber = data.issued_to?.split('-')[0];
            console.log("Project Number (from Token):", projectNumber);

            if (data.scope) {
                const hasPickerScope = data.scope.includes('https://www.googleapis.com/auth/photospicker.mediaitems.readonly');
                const message = `Project #${projectNumber} | Has Picker Scope: ${hasPickerScope ? '✅ YES' : '❌ NO'}`;
                setError(message);
                console.log(message);
                // Also show the full scope list for debugging
                console.log("Full Scopes:", data.scope);
            } else {
                setError(`Token check failed: ${JSON.stringify(data)}`);
            }
        } catch (e) {
            setError(`Check failed: ${e.message}`);
        }
    };

    const testUserInfo = async () => {
        try {
            const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
                headers: { 'Authorization': `Bearer ${session.provider_token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert(`✅ User Info API Works! Hello ${data.name}`);
            } else {
                alert(`❌ User Info API Failed: ${data.error?.message}`);
            }
        } catch (e) {
            alert(`Error: ${e.message}`);
        }
    };

    const startPickerSession = async () => {
        if (!session?.provider_token) {
            setError("No Access Token found. Try logging out and back in.");
            return;
        }

        try {
            setError(null);
            console.log("Creating Picker Session...");

            // --- Pre-flight Check: Verify Scopes ---
            // We inspect the token first to ensure Supabase actually gave us the right scope.
            // This prevents the confusing 403 error from Google's API limit.
            try {
                const tokenRes = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${session.provider_token}`);
                const tokenData = await tokenRes.json();
                if (!tokenData.scope || !tokenData.scope.includes('https://www.googleapis.com/auth/photospicker.mediaitems.readonly')) {
                    const msg = `MISSING SCOPE. Got: ${tokenData.scope}`;
                    console.error(msg);
                    setError("Authenication Error: You are missing the 'photospicker' permission. Please Sign Out and Sign In again.");
                    return;
                }
            } catch (scopeErr) {
                console.warn("Could not verify scopes before request:", scopeErr);
            }
            // ----------------------------------------

            const response = await fetch('https://photospicker.googleapis.com/v1/sessions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.provider_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Full Error:", errorData);
                throw new Error(`Picker API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const pickerUri = data.pickerUri;

            if (pickerUri) {
                console.log("Picker URI:", pickerUri);
                // Open the picker in a new window
                window.open(pickerUri, '_blank', 'width=800,height=600');

                // Start polling for results
                pollPickerSession(data.id);
            } else {
                setError("Failed to get Picker URI.");
            }

        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    const pollPickerSession = async (sessionId) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.provider_token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Log the status
                    console.log("Polling Status:", JSON.stringify(data, null, 2));

                    if (data.mediaItemsSet === true) {
                        // User has selected items!
                        clearInterval(pollInterval);
                        console.log("Selection confirmed. Fetching media items...");
                        await fetchSessionMediaItems(sessionId);
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);

        // Stop polling after 5 minutes
        setTimeout(() => clearInterval(pollInterval), 300000);
    };

    const fetchSessionMediaItems = async (sessionId) => {
        try {
            console.log("Invoking Edge Function to fetch media items...");

            const { data, error } = await supabase.functions.invoke('fetch-google-photos', {
                body: {
                    sessionId: sessionId,
                    providerToken: session.provider_token
                }
            });

            if (error) {
                console.error("Edge Function Error:", error);
                throw new Error(`Edge Function failed: ${error.message}`);
            }

            console.log("Media Items:", data);

            if (data.mediaItems) {
                setAlbums(prev => [...prev, ...data.mediaItems]);
                alert(`✅ Success! Selected ${data.mediaItems.length} photos.`);
            } else {
                console.warn("No media items returned in the list.");
            }

        } catch (e) {
            console.error(e);
            setError(`Failed to load photos: ${e.message}`);
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
                            <button onClick={startPickerSession} style={{ ...btnStyle, background: '#10b981', width: '100%', marginBottom: 10 }}>
                                🖼️ Select Photos from Google
                            </button>
                            <button onClick={testUserInfo} style={{ ...btnStyle, background: '#3b82f6', width: '100%', marginBottom: 10 }}>
                                👤 Test User API
                            </button>
                            <button onClick={checkScopes} style={{ ...btnStyle, background: '#6366f1', width: '100%', marginBottom: 10 }}>
                                🕵️ Debug Scopes
                            </button>

                            {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', background: 'rgba(255,0,0,0.1)', padding: 10, borderRadius: 5, overflowWrap: 'break-word' }}>{error}</div>}

                            {albums.length > 0 && (
                                <div style={{ textAlign: 'left', maxHeight: 300, overflowY: 'auto', background: '#111', padding: 10, borderRadius: 5 }}>
                                    <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 5 }}>Selected {albums.length} photos:</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                                        {albums.map((item, idx) => (
                                            <div key={idx} style={{ aspectRatio: '1', overflow: 'hidden' }}>
                                                {/* Picker API returns baseUrl which needs params for size */}
                                                <GooglePhoto
                                                    session={session}
                                                    baseUrl={item.mediaFile.baseUrl}
                                                />
                                            </div>
                                        ))}
                                    </div>
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

// Internal component to fetch and display protected Google Photos
const GooglePhoto = ({ session, baseUrl }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;

        const fetchImage = async () => {
            if (!session?.provider_token || !baseUrl) return;

            try {
                // Determine size: w200-h200-c (crop)
                const targetUrl = `${baseUrl}=w200-h200-c`;

                const { data, error } = await supabase.functions.invoke('proxy-google-photo', {
                    body: {
                        url: targetUrl,
                        providerToken: session.provider_token
                    }
                });

                if (error) throw error;
                if (!active) return;

                if (data && data.data) {
                    // Create data URL from Base64
                    const src = `data:${data.contentType};base64,${data.data}`;
                    setImageUrl(src);
                } else {
                    console.warn("Proxy returned no data");
                    setError(true);
                }
                setLoading(false);

            } catch (e) {
                console.error("Error fetching image:", e);
                if (active) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        fetchImage();

        return () => {
            active = false;
        };
    }, [baseUrl, session]);

    if (loading) return <div style={{ width: '100%', height: '100%', background: '#333', borderRadius: 4 }} />;
    if (error) return <div style={{ width: '100%', height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', borderRadius: 4 }}>⚠️</div>;

    return <img src={imageUrl} alt="Picked" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
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
