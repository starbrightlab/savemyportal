"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTier } from '@/context/TierContext';
import { supabase } from '@/lib/supabase';
import { TIER_LIMITS } from '@/lib/tier-limits';
import SourceCard from '@/components/dashboard/SourceCard';
import FeedCard from '@/components/dashboard/FeedCard';
import FeedEditor from '@/components/dashboard/FeedEditor';
import UpgradePrompt from '@/components/UpgradePrompt';
import ProBadge from '@/components/ProBadge';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parseJsonResponse } from '@/lib/fetch-helpers';
import { useFeeds, useCreateFeed, useDeleteFeed } from '@/hooks/useFeeds';
import { useAllSources, useDeleteSource } from '@/hooks/useSources';
import type { Feed } from '@/types/feed';

interface Message {
    type: 'success' | 'error' | 'info';
    text: string;
}

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const { isPro, refetchTier } = useTier();
    const searchParams = useSearchParams();
    const [newUrl, setNewUrl] = useState('');
    const [editingFeed, setEditingFeed] = useState<Feed | null>(null);
    const [message, setMessage] = useState<Message | null>(null);
    const [showNewFeedInput, setShowNewFeedInput] = useState(false);
    const [newFeedName, setNewFeedName] = useState('');
    const [addPhase, setAddPhase] = useState<'idle' | 'saving' | 'verifying'>('idle');
    const [showDangerZone, setShowDangerZone] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const deleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    const [upgradeSuccess, setUpgradeSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/onboarding');
        }
    }, [authLoading, user, router]);

    // Handle post-upgrade redirect from Stripe
    useEffect(() => {
        if (searchParams.get('upgrade') === 'success') {
            refetchTier();
            setUpgradeSuccess(true);
            // Poll briefly in case webhook hasn't fired yet
            const poll = setInterval(() => refetchTier(), 2000);
            const timeout = setTimeout(() => clearInterval(poll), 10000);
            return () => { clearInterval(poll); clearTimeout(timeout); };
        }
    }, [searchParams, refetchTier]);

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

            setAddPhase('saving');
            const { data: source, error } = await supabase
                .from('sources')
                .insert({ user_id: user?.id, url, type, status: 'pending' })
                .select()
                .single();
            if (error) throw error;

            // Validate the source by scraping (doesn't store items — just confirms URL works)
            setAddPhase('verifying');
            const response = await fetch('/api/scrape-urls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceIds: [source.id] }),
            });
            const scrapeData = await parseJsonResponse(response);
            if (!response.ok) throw new Error(scrapeData.error || 'Scrape failed');

            return { source, count: scrapeData.count };
        },
        onSuccess: (data) => {
            setAddPhase('idle');
            queryClient.invalidateQueries({ queryKey: ['sources'] });
            setNewUrl('');
            setMessage({ type: 'success', text: `Success! Found ${data.count || 0} photos.` });
        },
        onError: (error) => {
            setAddPhase('idle');
            console.error('Add source error:', error);
            setMessage({ type: 'error', text: (error as Error).message || 'Failed to add source. Please check the URL and try again.' });
        }
    });

    const syncSourceMutation = useMutation({
        mutationFn: async (id: string) => {
            // Health check — confirm source is still accessible and report photo count.
            // forceRefresh bypasses the server-side webstream cache so we always get live data.
            const response = await fetch('/api/scrape-urls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceIds: [id], forceRefresh: true }),
            });
            const scrapeData = await parseJsonResponse(response);
            if (!response.ok) throw new Error(scrapeData.error || 'Sync failed');
            return scrapeData;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sources'] });
            setMessage({ type: 'success', text: `Synced! Found ${data.count || 0} photos.` });
        },
        onError: (error) => {
            console.error('Sync source error:', error);
            setMessage({ type: 'error', text: (error as Error).message || 'Sync failed. The source may be temporarily unavailable.' });
        }
    });

    const identifySourceType = (rawUrl: string): 'google_photos' | 'icloud' | null => {
        try {
            const parsed = new URL(rawUrl);
            const host = parsed.hostname;
            if (host === 'photos.app.goo.gl' || host === 'photos.google.com' ||
                (host.endsWith('.google.com') && parsed.pathname.startsWith('/photos'))) {
                return 'google_photos';
            }
            if (host.endsWith('icloud.com') && parsed.pathname.includes('/sharedalbum')) {
                return 'icloud';
            }
            return null;
        } catch {
            return null;
        }
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
                    clock_position: 'top-right',
                    clock_size: 'medium',
                }
            });
            setNewFeedName('');
            setShowNewFeedInput(false);
        } catch (error: any) {
            console.error('Create feed error:', error);
            setMessage({ type: 'error', text: 'Failed to create feed. Please try again.' });
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
                        className="px-6 py-3.5 text-base font-medium text-white border border-white/20 rounded-full transition-all active:bg-white/10"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                        Back to Frame
                    </Link>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 pt-8 space-y-10">

                {/* ─── Upgrade Success Banner ─── */}
                {upgradeSuccess && isPro && (
                    <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-base font-bold text-green-300">Welcome to Pro!</p>
                            <p className="text-base text-green-300">All features are now unlocked. Enjoy unlimited feeds, sources, videos, and full customisation.</p>
                        </div>
                        <button onClick={() => setUpgradeSuccess(false)} className="text-green-300 active:text-green-200 text-xl p-2 -m-2">
                            &times;
                        </button>
                    </div>
                )}

                {/* ─── Sources ─── */}
                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-white">Sources</h2>
                        <p className="text-base text-gray-300 mt-0.5">Connected photo albums. Add a source, then assign it to one or more feeds.</p>
                    </div>

                    {/* Add Source Input */}
                    {sources.length < TIER_LIMITS[isPro ? 'pro' : 'free'].maxSources ? (
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <input
                                type="text"
                                placeholder="Paste a Google Photos or iCloud shared album link..."
                                className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-electric-blue transition-colors text-white placeholder-gray-500"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                            />
                            <button
                                onClick={handleAddSource}
                                disabled={addSourceMutation.isPending || !newUrl}
                                className="px-5 py-3.5 bg-white/[0.06] active:bg-white/10 border border-white/10 text-white rounded-lg text-base font-semibold transition-all disabled:opacity-40"
                            >
                                {addSourceMutation.isPending
                                    ? (addPhase === 'verifying' ? 'Verifying album…' : 'Saving…')
                                    : 'Add Source'}
                            </button>
                        </div>
                    ) : (
                    ''
                    )}

                    {addPhase === 'verifying' && (
                        <div className="mb-4 text-base font-medium px-4 py-3 rounded-lg text-blue-400 bg-blue-500/10 border border-blue-500/20">
                            Verifying album… Large albums may take up to a minute.
                        </div>
                    )}

                    {message && (
                        <div className={`mb-4 text-base font-medium px-4 py-3 rounded-lg ${
                            message.type === 'error' ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                            message.type === 'success' ? 'text-green-400 bg-green-500/10 border border-green-500/20' :
                            'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {sources.length === 0 ? (
                        <div className="text-center py-10 text-base text-gray-300 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
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

                {/* ─── Feeds ─── */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-white">Feeds</h2>
                            <p className="text-base text-gray-300 mt-0.5">Each feed is a collection of photo sources with its own display settings.</p>
                        </div>
                        {feeds.length > 0 && !showNewFeedInput && (
                            feeds.length < TIER_LIMITS[isPro ? 'pro' : 'free'].maxFeeds ? (
                                <button
                                    onClick={() => setShowNewFeedInput(true)}
                                    className="px-5 py-3.5 text-base font-semibold text-electric-blue border border-electric-blue/30 rounded-lg transition-all flex items-center gap-1.5 active:bg-electric-blue/10"
                                >
                                    <span className="text-lg leading-none">+</span> New Feed
                                </button>
                            ) : (
                                ''
                            )
                        )}
                    </div>

                    {showNewFeedInput && (
                        <div className="flex flex-col sm:flex-row gap-3 mb-5 p-4 rounded-xl border border-electric-blue/20 bg-electric-blue/5">
                            <input
                                type="text"
                                placeholder="Feed name (e.g. Living Room)"
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-electric-blue transition-colors text-white placeholder-gray-500"
                                value={newFeedName}
                                onChange={(e) => setNewFeedName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateFeed()}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreateFeed}
                                    disabled={!newFeedName.trim() || createFeedMutation.isPending}
                                    className="px-5 py-3.5 bg-electric-blue active:bg-blue-600 text-white rounded-lg text-base font-bold transition-all disabled:opacity-50"
                                >
                                    {createFeedMutation.isPending ? 'Creating...' : 'Create'}
                                </button>
                                <button
                                    onClick={() => { setShowNewFeedInput(false); setNewFeedName(''); }}
                                    className="px-4 py-3.5 text-base text-gray-300 active:text-white transition-colors border border-white/10 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {loadingFeeds ? (
                        <div className="text-center py-12 text-gray-300 text-base">Loading feeds...</div>
                    ) : feeds.length === 0 ? (
                        <div className="text-center py-14 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                            <h3 className="text-lg font-semibold text-white mb-1">No feeds yet</h3>
                            <p className="text-base text-gray-300 mb-5">Create a feed to start displaying your photos.</p>
                            <button
                                onClick={() => setShowNewFeedInput(true)}
                                className="px-6 py-3.5 bg-electric-blue text-white rounded-lg text-base font-bold active:bg-blue-600 transition-all"
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

                {/* ─── Divider ─── */}
                <div className="border-t border-white/5" />

                {/* ─── Pro Upgrade / Status ─── */}
                <section>
                    {isPro ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl border border-soft-gold/15 bg-soft-gold/5">
                            <div className="w-8 h-8 rounded-lg bg-soft-gold/10 flex items-center justify-center">
                                <svg className="w-4 h-4 text-soft-gold" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 3.456a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-3.456A1 1 0 0112 2z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-base font-bold text-soft-gold">Pro Active</p>
                                <p className="text-base text-gray-300">All features unlocked. Thank you for your support!</p>
                            </div>
                        </div>
                    ) : (
                        <UpgradePrompt />
                    )}
                </section>

                {/* ─── Account ─── */}
                <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                            Account
                            {isPro ? <ProBadge /> : (
                                <span className="inline-flex items-center px-2.5 py-1 text-sm font-bold uppercase tracking-wider text-gray-300 bg-white/5 border border-white/10 rounded">
                                    Free
                                </span>
                            )}
                        </h2>
                        <p className="text-base text-gray-300">Signed in as {user.email}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div>
                            <p className="text-base font-medium text-gray-300">Sign out</p>
                            <p className="text-base text-gray-300">You can sign back in anytime.</p>
                        </div>
                        <button
                            onClick={() => supabase.auth.signOut()}
                            className="px-5 py-3.5 text-base font-medium text-gray-200 border border-white/10 rounded-lg transition-all active:bg-white/10"
                        >
                            Sign Out
                        </button>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                        <button
                            onClick={() => setShowDangerZone(!showDangerZone)}
                            className="flex items-center justify-between w-full py-3.5"
                        >
                            <p className="text-base text-gray-300 transition-colors">Danger zone</p>
                            <svg
                                className={`w-5 h-5 text-gray-300 transition-all ${showDangerZone ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showDangerZone && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-red-500/10">
                                <div>
                                    <p className="text-base font-medium text-red-400">Delete account</p>
                                    <p className="text-base text-gray-300">Permanently removes all data. This cannot be undone.</p>
                                </div>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleting}
                                    className={`px-5 py-3.5 rounded-lg text-base font-semibold transition-all whitespace-nowrap ${
                                        deleting
                                            ? 'bg-red-500/10 text-red-300 opacity-50 cursor-not-allowed'
                                            : confirmingDelete
                                                ? 'bg-red-500/20 text-red-200 border border-red-500/40 animate-pulse'
                                                : 'text-red-400 border border-red-500/20 active:bg-red-500/10'
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
