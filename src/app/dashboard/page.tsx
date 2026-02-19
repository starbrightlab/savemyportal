"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import SourceCard from '@/components/dashboard/SourceCard';
import FeedCard from '@/components/dashboard/FeedCard';
import FeedEditor from '@/components/dashboard/FeedEditor';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFeeds, useCreateFeed, useDeleteFeed } from '@/hooks/useFeeds';
import { useAllSources, useDeleteSource } from '@/hooks/useSources';
import type { Feed } from '@/types/feed';

interface Message {
    type: 'success' | 'error' | 'info';
    text: string;
}

const DONATE_TIERS = [
    { amount: '$5', label: 'Coffee', url: 'https://buy.stripe.com/4gM14mgK081l4LYeUbenS02' },
    { amount: '$10', label: 'Server Month', url: 'https://buy.stripe.com/5kQ4gy8du3L50vI4fxenS01', highlighted: true },
    { amount: '$25', label: 'Champion', url: 'https://buy.stripe.com/00w28qeBS6XhemycM3enS00' },
];

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const [newUrl, setNewUrl] = useState('');
    const [editingFeed, setEditingFeed] = useState<Feed | null>(null);
    const [message, setMessage] = useState<Message | null>(null);
    const [showNewFeedInput, setShowNewFeedInput] = useState(false);
    const [newFeedName, setNewFeedName] = useState('');
    const [showDangerZone, setShowDangerZone] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/onboarding');
        }
    }, [authLoading, user, router]);

    const { data: sources = [] } = useAllSources(user?.id);
    const { data: feeds = [], isLoading: loadingFeeds } = useFeeds(user?.id);

    const { data: feedSourceCounts = {} } = useQuery({
        queryKey: ['feed-source-counts', user?.id],
        queryFn: async () => {
            if (!user?.id) return {};
            const { data } = await supabase
                .from('feed_sources')
                .select('feed_id');
            if (!data) return {};
            const counts: Record<string, number> = {};
            data.forEach(fs => {
                counts[fs.feed_id] = (counts[fs.feed_id] || 0) + 1;
            });
            return counts;
        },
        enabled: !!user?.id,
    });

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

            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceId: source.id }),
            });
            const scrapeData = await response.json();
            if (!response.ok) throw new Error(scrapeData.error || 'Scrape failed');

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
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceId: id }),
            });
            const scrapeData = await response.json();
            if (!response.ok) throw new Error(scrapeData.error || 'Sync failed');
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
                    transition: 'crossfade',
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

    const handleDeleteAccount = async () => {
        if (!confirmingDelete) {
            setConfirmingDelete(true);
            deleteTimeoutRef.current = setTimeout(() => setConfirmingDelete(false), 5000);
            return;
        }

        if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
        setDeleting(true);

        try {
            const response = await fetch('/api/delete-account', { method: 'POST' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to delete account');

            await supabase.auth.signOut();
            router.push('/');
        } catch (err: any) {
            console.error('Account deletion failed:', err);
            setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' });
            setDeleting(false);
            setConfirmingDelete(false);
        }
    };

    if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Settings...</div>;

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 border-b border-white/5" style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/savemyportal-logo-white.svg" alt="Logo" className="w-8 h-8" />
                        <h1 className="text-xl font-bold font-display text-white">Settings</h1>
                    </div>
                    <Link
                        href="/"
                        className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white border border-white/15 hover:border-white/30 rounded-full transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                        Back to Frame
                    </Link>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-8 space-y-10">

                {/* ─── Feeds ─── */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-white">Feeds</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Each feed is a collection of photo sources with its own display settings.</p>
                        </div>
                        {feeds.length > 0 && !showNewFeedInput && (
                            <button
                                onClick={() => setShowNewFeedInput(true)}
                                className="px-4 py-2 text-sm font-semibold text-electric-blue border border-electric-blue/25 hover:border-electric-blue/50 hover:bg-electric-blue/5 rounded-lg transition-all flex items-center gap-1.5"
                            >
                                <span className="text-lg leading-none">+</span> New Feed
                            </button>
                        )}
                    </div>

                    {showNewFeedInput && (
                        <div className="flex flex-col sm:flex-row gap-3 mb-5 p-4 rounded-xl border border-electric-blue/20 bg-electric-blue/5">
                            <input
                                type="text"
                                placeholder="Feed name (e.g. Living Room)"
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue transition-colors text-white placeholder-gray-600"
                                value={newFeedName}
                                onChange={(e) => setNewFeedName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateFeed()}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreateFeed}
                                    disabled={!newFeedName.trim() || createFeedMutation.isPending}
                                    className="px-5 py-2.5 bg-electric-blue hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                                >
                                    {createFeedMutation.isPending ? 'Creating...' : 'Create'}
                                </button>
                                <button
                                    onClick={() => { setShowNewFeedInput(false); setNewFeedName(''); }}
                                    className="px-3 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {loadingFeeds ? (
                        <div className="text-center py-12 text-gray-500 text-sm">Loading feeds...</div>
                    ) : feeds.length === 0 ? (
                        <div className="text-center py-14 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                            <h3 className="text-lg font-semibold text-white mb-1">No feeds yet</h3>
                            <p className="text-sm text-gray-500 mb-5">Create a feed to start displaying your photos.</p>
                            <button
                                onClick={() => setShowNewFeedInput(true)}
                                className="px-6 py-2.5 bg-electric-blue text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-all"
                            >
                                Create First Feed
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {feeds.map(feed => (
                                <FeedCard
                                    key={feed.id}
                                    feed={feed}
                                    sourceCount={feedSourceCounts[feed.id] ?? 0}
                                    onDelete={() => feed.id && deleteFeedMutation.mutate(feed.id)}
                                    onEdit={() => setEditingFeed(feed)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ─── Sources ─── */}
                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-white">Sources</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Connected photo albums. Add a source, then assign it to one or more feeds.</p>
                    </div>

                    {/* Add Source Input */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <input
                            type="text"
                            placeholder="Paste a Google Photos or iCloud shared album link..."
                            className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-electric-blue transition-colors text-white placeholder-gray-600"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                        />
                        <button
                            onClick={handleAddSource}
                            disabled={addSourceMutation.isPending || !newUrl}
                            className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                        >
                            {addSourceMutation.isPending ? 'Adding...' : 'Add Source'}
                        </button>
                    </div>

                    {message && (
                        <div className={`mb-4 text-sm font-medium px-4 py-2.5 rounded-lg ${
                            message.type === 'error' ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                            message.type === 'success' ? 'text-green-400 bg-green-500/10 border border-green-500/20' :
                            'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {sources.length === 0 ? (
                        <div className="text-center py-10 text-sm text-gray-500 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                            No sources connected yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                {/* ─── Divider ─── */}
                <div className="border-t border-white/5" />

                {/* ─── Support ─── */}
                <section>
                    <h2 className="text-lg font-bold text-white mb-1">Support SaveMyPortal</h2>
                    <p className="text-sm text-gray-500 mb-4">Help keep the project free and actively developed.</p>
                    <div className="flex flex-wrap gap-3">
                        {DONATE_TIERS.map((tier) => (
                            <a
                                key={tier.amount}
                                href={tier.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.03] ${
                                    tier.highlighted
                                        ? 'border border-soft-gold/40 bg-soft-gold/10 text-soft-gold'
                                        : 'border border-white/10 bg-white/[0.03] text-gray-300 hover:border-soft-gold/30 hover:text-soft-gold'
                                }`}
                            >
                                <span className="font-bold">{tier.amount}</span>
                                <span className="text-xs opacity-60">{tier.label}</span>
                            </a>
                        ))}
                    </div>
                </section>

                {/* ─── Account ─── */}
                <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-white mb-1">Account</h2>
                        <p className="text-sm text-gray-500">Signed in as {user.email}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div>
                            <p className="text-sm font-medium text-gray-300">Sign out</p>
                            <p className="text-xs text-gray-600">You can sign back in anytime.</p>
                        </div>
                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
                        >
                            Sign Out
                        </button>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                        <button
                            onClick={() => setShowDangerZone(!showDangerZone)}
                            className="flex items-center justify-between w-full py-1 group"
                        >
                            <p className="text-sm text-gray-600 group-hover:text-gray-400 transition-colors">Danger zone</p>
                            <svg
                                className={`w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-all ${showDangerZone ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showDangerZone && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-red-500/10">
                                <div>
                                    <p className="text-sm font-medium text-red-400">Delete account</p>
                                    <p className="text-xs text-gray-600">Permanently removes all data. This cannot be undone.</p>
                                </div>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleting}
                                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                                        deleting
                                            ? 'bg-red-500/10 text-red-300 opacity-50 cursor-not-allowed'
                                            : confirmingDelete
                                                ? 'bg-red-500/20 text-red-200 border border-red-500/40 animate-pulse'
                                                : 'text-red-400 border border-red-500/15 hover:border-red-500/30 hover:bg-red-500/5'
                                    }`}
                                >
                                    {deleting ? 'Deleting...' : confirmingDelete ? 'Tap Again' : 'Delete'}
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Editor Modal */}
            {editingFeed && (
                <FeedEditor
                    feed={editingFeed}
                    onClose={() => setEditingFeed(null)}
                    onUpdate={() => {
                        queryClient.invalidateQueries({ queryKey: ['feeds'] });
                    }}
                />
            )}
        </div>
    );
}
