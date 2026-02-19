"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import SourceCard from '@/components/dashboard/SourceCard';
import FeedCard from '@/components/dashboard/FeedCard';
import FeedEditor from '@/components/dashboard/FeedEditor';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFeeds, useCreateFeed, useDeleteFeed } from '@/hooks/useFeeds';
import { useAllSources, useDeleteSource } from '@/hooks/useSources';
import type { Feed } from '@/types/feed';

interface Message {
    type: 'success' | 'error' | 'info';
    text: string;
}

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const [newUrl, setNewUrl] = useState('');
    const [editingFeed, setEditingFeed] = useState<Feed | null>(null);
    const [message, setMessage] = useState<Message | null>(null);
    const [showNewFeedInput, setShowNewFeedInput] = useState(false);
    const [newFeedName, setNewFeedName] = useState('');
    const router = useRouter();
    const queryClient = useQueryClient();

    // Redirect if not logged in (in useEffect to avoid render-time side effects)
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/onboarding');
        }
    }, [authLoading, user, router]);

    const { data: sources = [] } = useAllSources(user?.id);

    const { data: feeds = [], isLoading: loadingFeeds } = useFeeds(user?.id);

    const createFeedMutation = useCreateFeed();
    const deleteFeedMutation = useDeleteFeed();
    const deleteSourceMutation = useDeleteSource();

    const addSourceMutation = useMutation({
        mutationFn: async (url: string) => {
            const type = identifySourceType(url);
            if (!type) throw new Error('Invalid URL');

            const { data: source, error } = await supabase
                .from('sources')
                .insert({ user_id: user?.id, url, type, status: 'pending' })
                .select()
                .single();
            if (error) throw error;

            const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('source-manager', {
                body: { sourceId: source.id }
            });
            if (scrapeError) throw scrapeError;

            return { source, count: scrapeData.count };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sources'] });
            setNewUrl('');
            setMessage({ type: 'success', text: `Success! Found ${data.count || 0} photos.` });
        },
        onError: (error) => {
            setMessage({ type: 'error', text: `Error: ${error.message}` });
        }
    });

    const syncSourceMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data: scrapeData, error } = await supabase.functions.invoke('source-manager', {
                body: { sourceId: id }
            });
            if (error) throw error;
            return scrapeData;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sources'] });
            setMessage({ type: 'success', text: `Synced! Found ${data.count || 0} photos.` });
        },
        onError: (error) => {
            setMessage({ type: 'error', text: `Sync failed: ${error.message}` });
        }
    });

    const identifySourceType = (url: string) => {
        if (url.includes('photos.app.goo.gl') || url.includes('photos.google.com')) return 'google_photos';
        if (url.includes('icloud.com/sharedalbum')) return 'icloud';
        if (url.includes('dropbox.com')) return 'dropbox';
        return null;
    };

    const handleAddSource = () => {
        if (!newUrl) return;
        setMessage(null);
        addSourceMutation.mutate(newUrl);
    };

    const handleCreateFeed = async () => {
        if (!newFeedName.trim() || !user?.id) return;

        try {
            await createFeedMutation.mutateAsync({
                user_id: user.id,
                name: newFeedName.trim(),
                config: {
                    interval: 10,
                    transition: 'fade',
                    fit: 'cover',
                    shuffle: true,
                    show_clock: true,
                }
            });
            setNewFeedName('');
            setShowNewFeedInput(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error creating feed: ' + error.message });
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
                    {feeds.length > 0 && !showNewFeedInput && (
                        <button
                            onClick={() => setShowNewFeedInput(true)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <span>+</span> New Feed
                        </button>
                    )}
                </div>

                {/* Inline New Feed Input */}
                {showNewFeedInput && (
                    <div className="glass-card p-6 mb-6 border border-electric-blue/30 flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Feed name (e.g. 'Living Room')"
                            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-electric-blue transition-colors text-white placeholder-gray-600"
                            value={newFeedName}
                            onChange={(e) => setNewFeedName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFeed()}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateFeed}
                                disabled={!newFeedName.trim() || createFeedMutation.isPending}
                                className="px-6 py-3 bg-electric-blue hover:bg-blue-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                                {createFeedMutation.isPending ? 'Creating...' : 'Create'}
                            </button>
                            <button
                                onClick={() => { setShowNewFeedInput(false); setNewFeedName(''); }}
                                className="px-4 py-3 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {loadingFeeds ? (
                    <div className="text-center py-12 text-gray-500">Loading feeds...</div>
                ) : feeds.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl bg-white/5">
                        <h3 className="text-xl font-bold text-white mb-2">No Feeds Configured</h3>
                        <p className="text-gray-400 mb-6">Create a feed to start displaying your photos.</p>
                        <button
                            onClick={() => setShowNewFeedInput(true)}
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
                                onDelete={() => feed.id && deleteFeedMutation.mutate(feed.id)}
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
                        disabled={addSourceMutation.isPending || !newUrl}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                    >
                        {addSourceMutation.isPending ? 'Adding...' : 'Add Source'}
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
                                onSync={() => syncSourceMutation.mutateAsync(source.id)}
                                onDelete={() => deleteSourceMutation.mutate(source.id)}
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
                            queryClient.invalidateQueries({ queryKey: ['feeds'] });
                        }}
                    />
                )
            }
        </div >
    );
}
