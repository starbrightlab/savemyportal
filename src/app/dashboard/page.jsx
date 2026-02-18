"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import SourceCard from '@/components/dashboard/SourceCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const [sources, setSources] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState(null);
    const router = useRouter();

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/onboarding');
        }
    }, [user, authLoading, router]);

    // Fetch sources
    useEffect(() => {
        if (user) {
            fetchSources();
        }
    }, [user]);

    const fetchSources = async () => {
        const { data } = await supabase.from('sources').select('*').order('created_at', { ascending: false });
        if (data) setSources(data);
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

            {/* Add Source Section */}
            <div className="glass-card p-8 mb-12 border border-white/10">
                <h2 className="text-2xl font-bold mb-6">Add New Source</h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Paste Google Photos or iCloud Shared Album Link..."
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-6 py-4 focus:outline-none focus:border-electric-blue transition-colors text-white placeholder-gray-600"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                    />
                    <button
                        onClick={handleAddSource}
                        disabled={adding || !newUrl}
                        className="px-8 py-4 bg-electric-blue text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                    >
                        {adding ? 'Adding...' : 'Add Source'}
                    </button>
                </div>
                {message && (
                    <div className={`mt-4 text-sm font-medium ${message.type === 'error' ? 'text-red-400' :
                        message.type === 'success' ? 'text-green-400' : 'text-blue-400'
                        }`}>
                        {message.text}
                    </div>
                )}
            </div>

            {/* Sources Grid */}
            <h2 className="text-2xl font-bold mb-6">Connected Albums</h2>
            {sources.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <p className="text-gray-500">No albums connected yet.</p>
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
        </div>
    );
}
