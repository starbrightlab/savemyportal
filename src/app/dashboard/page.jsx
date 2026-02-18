"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import SourceCard from '@/components/dashboard/SourceCard';
import FeedCard from '@/components/dashboard/FeedCard';
import FeedEditor from '@/components/dashboard/FeedEditor';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const [sources, setSources] = useState([]);
    const [feeds, setFeeds] = useState([]);
    const [loadingFeeds, setLoadingFeeds] = useState(true);
    const [newUrl, setNewUrl] = useState('');
    const [adding, setAdding] = useState(false);
    const [editingFeed, setEditingFeed] = useState(null);
    const [message, setMessage] = useState(null);
    const router = useRouter();

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/onboarding');
        }
    }, [user, authLoading, router]);

    // Fetch data
    useEffect(() => {
        if (user) {
            fetchSources();
            fetchFeeds();
        }
    }, [user]);

    const fetchSources = async () => {
        const { data } = await supabase.from('sources').select('*').order('created_at', { ascending: false });
        if (data) setSources(data);
    };

    const fetchFeeds = async () => {
        setLoadingFeeds(true);
        const { data } = await supabase.from('feeds').select('*').order('created_at', { ascending: false });
        if (data) setFeeds(data);
        setLoadingFeeds(false);
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

            setNewUrl('');
            fetchSources();
            setMessage({ type: 'info', text: 'Source added. Syncing photos...' });

            const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('source-manager', {
                body: { sourceId: source.id }
            });

            if (scrapeError) throw scrapeError;

            setMessage({ type: 'success', text: `Success! Found ${scrapeData.count || 0} photos.` });
            fetchSources();

        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: `Error: ${e.message}` });
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id) => {
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

    const handleCreateFeed = async () => {
        const name = prompt("Enter a name for your new feed (e.g., 'Living Room'):");
        if (!name) return;

        const { data, error } = await supabase
            .from('feeds')
            .insert({
                user_id: user.id,
                name: name,
                config: {
                    interval: 10,
                    transition: 'fade',
                    fit: 'cover',
                    show_clock: true,
                    show_weather: false
                }
            })
            .select()
            .single();

        if (error) {
            alert('Error creating feed: ' + error.message);
        } else {
            console.log('Feed created:', data);
            fetchFeeds();
        }
    };

    if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen pt-24 px-6 max-w-7xl mx-auto pb-20 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <img src="/savemyportal-logo-white.svg" alt="Logo" className="w-12 h-12" />
                        <h1 className="text-4xl md:text-6xl font-bold font-display text-white">Dashboard</h1>
                    </div>
                    <p className="text-gray-400">Manage your connected albums and device settings.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="px-6 py-3 glass rounded-full hover:bg-white/10 transition-all text-sm font-medium text-red-400 hover:text-red-300"
                    >
                        Sign Out
                    </button>
                    <Link href="/" className="px-6 py-3 bg-electric-blue hover:bg-blue-600 rounded-full transition-all text-sm font-bold shadow-lg shadow-electric-blue/20">
                        View Frame
                    </Link>
                </div>
            </div>

            {/* My Feeds Section */}
            <section className="mb-16">
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-3xl font-bold text-white">My Feeds</h2>
                    {feeds.length > 0 && (
                        <button
                            onClick={handleCreateFeed}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <span>+</span> New Feed
                        </button>
                    )}
                </div>

                {loadingFeeds ? (
                    <div className="text-center py-12 text-gray-500">Loading feeds...</div>
                ) : feeds.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl bg-white/5">
                        <h3 className="text-xl font-bold text-white mb-2">No Feeds Configured</h3>
                        <p className="text-gray-400 mb-6">Create a feed to start displaying your photos.</p>
                        <button
                            onClick={handleCreateFeed}
                            className="px-8 py-3 bg-electric-blue text-white rounded-full font-bold hover:shadow-lg transition-all"
                        >
                            Create First Feed
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {feeds.map(feed => (
                            <FeedCard
                                key={feed.id}
                                feed={feed}
                                onDelete={() => { }}
                                onEdit={() => setEditingFeed(feed)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Sources Section (Secondary) */}
            <section className="opacity-80 hover:opacity-100 transition-opacity">
                <h2 className="text-2xl font-bold mb-6 text-gray-300">Sources Library</h2>

                {/* Add Source Input - Condensed */}
                <div className="glass-card p-6 mb-8 border border-white/10 flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Paste Google Photos or iCloud Shared Album Link..."
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-electric-blue transition-colors text-white placeholder-gray-600 text-sm"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                    />
                    <button
                        onClick={handleAddSource}
                        disabled={adding || !newUrl}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                    >
                        {adding ? 'Adding...' : 'Add Source'}
                    </button>
                </div>
                {message && (
                    <div className={`mb-6 text-sm font-medium ${message.type === 'error' ? 'text-red-400' :
                        message.type === 'success' ? 'text-green-400' : 'text-blue-400'
                        }`}>
                        {message.text}
                    </div>
                )}

                {sources.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-500 border border-dashed border-white/10 rounded-xl">
                        No sources connected.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sources.map(source => (
                            <SourceCard
                                key={source.id}
                                source={source}
                                onSync={() => handleResync(source.id)}
                                onDelete={() => handleDelete(source.id)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Editor Modal */}
            {
                editingFeed && (
                    <FeedEditor
                        feed={editingFeed}
                        onClose={() => setEditingFeed(null)}
                        onUpdate={() => {
                            fetchFeeds();
                            // fetchSources(); // Sources might change status if linked?
                        }}
                    />
                )
            }
        </div >
    );

}
