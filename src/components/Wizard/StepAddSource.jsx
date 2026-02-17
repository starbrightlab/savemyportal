import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const StepAddSource = ({ feedId, onComplete }) => {
    const [activeTab, setActiveTab] = useState('google'); // 'google' | 'icloud'
    const [url, setUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, validating, linking, success

    const handleAddSource = async (e) => {
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
                    user_id: (await supabase.auth.getUser()).data.user.id,
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

            // 3. Trigger Initial Scrape (Optional, client-side trigger)
            // We can invoke the function or just let the heartbeat pick it up.
            // For better UX, let's invoke it.
            setStatus('syncing');
            await supabase.functions.invoke('source-manager', {
                body: { sourceId: sourceData.id }
            });

            setStatus('success');
            setTimeout(() => {
                onComplete();
            }, 1000);

        } catch (err) {
            console.error("Error adding source:", err);
            setError(err.message || "Failed to add source");
            setStatus('idle');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white">Add Your First Album</h2>
            <p className="text-gray-300 text-center">
                Paste a public link to a shared album.
            </p>

            {/* Tabs */}
            <div className="flex space-x-4 bg-gray-800 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('google')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'google' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Google Photos
                </button>
                <button
                    onClick={() => setActiveTab('icloud')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'icloud' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                >
                    iCloud Shared Album
                </button>
            </div>

            <form onSubmit={handleAddSource} className="w-full space-y-4">
                <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">
                        {activeTab === 'google' ? 'Google Photos Album Link' : 'iCloud Shared Album Link'}
                    </label>
                    <input
                        type="url"
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Make sure the album is public/shared via link.
                    </p>
                </div>

                {error && (
                    <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">
                        {error}
                    </div>
                )}

                {status !== 'idle' && status !== 'success' && (
                    <div className="text-blue-400 text-sm text-center">
                        {status === 'validating' && 'Saving source...'}
                        {status === 'linking' && 'Linking to feed...'}
                        {status === 'syncing' && 'Starting initial sync...'}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!url.trim() || isSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                    {isSubmitting ? 'Adding...' : 'Add Source & Finish'}
                </button>
            </form>

            <button
                type="button"
                onClick={onComplete}
                className="text-gray-500 hover:text-gray-300 text-sm underline"
            >
                Skip for now
            </button>
        </div>
    );
};

export default StepAddSource;
