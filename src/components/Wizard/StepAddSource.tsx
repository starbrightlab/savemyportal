import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface StepAddSourceProps {
    feedId: string;
    onComplete: () => void;
}

const StepAddSource = ({ feedId, onComplete }: StepAddSourceProps) => {
    const [activeTab, setActiveTab] = useState('google'); // 'google' | 'icloud'
    const [url, setUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('idle'); // idle, validating, linking, success
    const [showHelp, setShowHelp] = useState(false);

    const handleAddSource = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!url.trim()) return;

        setIsSubmitting(true);
        setError(null);
        setStatus('validating');

        try {
            // 1. Create Source
            const type = activeTab === 'google' ? 'google_photos' : 'icloud';
            const { data: sourceData, error: sourceError } = await supabase
                .from('sources')
                .upsert([{
                    user_id: (await supabase.auth.getUser()).data.user!.id,
                    type,
                    url,
                    status: 'pending'
                }], { onConflict: 'user_id, url' })
                .select()
                .single();

            if (sourceError) throw sourceError;

            // 2. Link to Feed
            setStatus('linking');
            const { error: linkError } = await supabase
                .from('feed_sources')
                .insert([{ feed_id: feedId, source_id: sourceData.id }]);

            if (linkError) {
                // Ignore unique constraint violation if already linked
                if (linkError.code !== '23505') throw linkError;
            }

            // 3. Validate source by doing a quick scrape (doesn't store items — just confirms the URL works)
            setStatus('syncing');
            const scrapeResponse = await fetch('/api/scrape-urls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceIds: [sourceData.id] }),
            });
            const scrapeResult = await scrapeResponse.json();
            if (!scrapeResponse.ok) {
                throw new Error(scrapeResult.error || 'Validation failed');
            }
            if (!scrapeResult.items || scrapeResult.items.length === 0) {
                throw new Error('No photos found in this album. Please check the link and try again.');
            }

            setStatus('success');
            setTimeout(() => {
                onComplete();
            }, 1000);

        } catch (err) {
            console.error("Error adding source:", err);
            setError((err as Error).message || "Failed to add source");
            setStatus('idle');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-6 w-full max-w-lg mx-auto animate-fade-in">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Add Photos</h2>
                <p className="text-gray-400">
                    Connect a shared album to start your slideshow.
                </p>
            </div>

            {/* Tabs */}
            <div className="bg-gray-800/50 p-1 rounded-xl flex w-full">
                <button
                    onClick={() => setActiveTab('google')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'google'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                        }`}
                >
                    <span className="flex items-center justify-center gap-2">
                        Google Photos
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('icloud')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'icloud'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                        }`}
                >
                    <span className="flex items-center justify-center gap-2">
                        iCloud Shared
                    </span>
                </button>
            </div>

            <form onSubmit={handleAddSource} className="w-full space-y-6">
                <div>
                    <label htmlFor="url" className="block text-sm font-medium text-blue-400 mb-2 uppercase tracking-wider">
                        Album Link
                    </label>
                    <input
                        type="url"
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-5 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                {/* Instructions Accordion */}
                <div className="border border-gray-700 rounded-xl overflow-hidden bg-gray-800/30">
                    <button
                        type="button"
                        onClick={() => setShowHelp(!showHelp)}
                        className="w-full px-5 py-3 flex items-center justify-between text-left text-sm font-medium text-gray-300 hover:bg-gray-800/50 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            How do I get the link?
                        </span>
                        <svg className={`w-4 h-4 transition-transform ${showHelp ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showHelp && (
                        <div className="px-5 py-4 bg-gray-900/50 border-t border-gray-700 text-sm text-gray-400 space-y-3 animate-fade-in">
                            {activeTab === 'google' ? (
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Open <strong>Google Photos</strong> and go to the album.</li>
                                    <li>Click the <strong>Share</strong> icon (top right).</li>
                                    <li>Click <strong>Create Link</strong>.</li>
                                    <li>Copy the link and paste it above.</li>
                                </ol>
                            ) : (
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Open the <strong>Photos app</strong> on your iPhone/Mac.</li>
                                    <li>Select the <strong>Shared Album</strong>.</li>
                                    <li>Tap the <strong>People</strong> icon.</li>
                                    <li>Turn on <strong>Public Website</strong>.</li>
                                    <li>Tap <strong>Share Link</strong> and copy it.</li>
                                </ol>
                            )}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="text-red-400 text-sm bg-red-900/20 p-4 rounded-xl border border-red-900/50 flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {status !== 'idle' && status !== 'success' && (
                    <div className="flex items-center justify-center gap-2 text-blue-400 font-medium">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                        {status === 'validating' && 'Saving source...'}
                        {status === 'linking' && 'Linking to feed...'}
                        {status === 'syncing' && 'Starting initial sync...'}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!url.trim() || isSubmitting}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-blue-500/20"
                >
                    {isSubmitting ? 'Adding...' : 'Add Source'}
                </button>
            </form>

            <button
                type="button"
                onClick={onComplete}
                className="text-gray-500 hover:text-gray-300 text-sm hover:underline transition-colors"
            >
                Skip for now
            </button>
        </div>
    );
};

export default StepAddSource;
