"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FeedConfig {
    interval: number;
    transition: string;
    fit: string; // 'cover' | 'contain'
    show_clock: boolean;
    show_weather: boolean;
    sleep_schedule?: {
        enabled: boolean;
        start: string;
        end: string;
    };
}

interface Feed {
    id: string;
    name: string;
    config?: FeedConfig;
}

interface Source {
    id: string;
    name: string;
    url?: string;
    type?: string;
}

interface FeedEditorProps {
    feed: Feed;
    onClose: () => void;
    onUpdate: () => void;
}

export default function FeedEditor({ feed, onClose, onUpdate }: FeedEditorProps) {
    const [name, setName] = useState(feed.name);
    const [config, setConfig] = useState(feed.config || {
        interval: 10,
        transition: 'fade',
        fit: 'cover',
        show_clock: true,
        show_weather: false,
        sleep_schedule: { enabled: false, start: '22:00', end: '07:00' }
    });
    const [allSources, setAllSources] = useState<Source[]>([]);
    const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch available sources and current feed sources
    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch all sources
            const { data: sourcesData } = await supabase.from('sources').select('*');
            setAllSources(sourcesData || []);

            // 2. Fetch sources currently in this feed
            const { data: feedSourcesData } = await supabase
                .from('feed_sources')
                .select('source_id')
                .eq('feed_id', feed.id);

            const currentIds = new Set((feedSourcesData || []).map(fs => fs.source_id));
            setSelectedSourceIds(currentIds);
            setLoading(false);
        };
        fetchData();
    }, [feed.id]);

    const handleSave = async () => {
        setSaving(true);

        // 1. Update Feed Config
        const { error: feedError } = await supabase
            .from('feeds')
            .update({ name, config })
            .eq('id', feed.id);

        if (feedError) {
            alert('Error saving settings: ' + feedError.message);
            setSaving(false);
            return;
        }

        // 2. Update Feed Sources (Delete All + Insert New) 
        // Note: A smarter diff approach is better for large sets, but this is simple for now.
        await supabase.from('feed_sources').delete().eq('feed_id', feed.id);

        if (selectedSourceIds.size > 0) {
            const rows = Array.from(selectedSourceIds).map(sourceId => ({
                feed_id: feed.id,
                source_id: sourceId
            }));
            await supabase.from('feed_sources').insert(rows);
        }

        onUpdate();
        onClose();
        setSaving(false);
    };

    const toggleSource = (id: string) => {
        const newSet = new Set(selectedSourceIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedSourceIds(newSet);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Editor...</div>;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">

                {/* Header */}
                <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-white/10 p-6 flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold text-white">Edit Feed</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Feed Name</label>
                        <input
                            type="text"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-electric-blue outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Sources Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-3">Content Sources</label>
                        <div className="space-y-2 max-h-48 overflow-y-auto border border-white/5 rounded-lg p-2">
                            {allSources.length === 0 ? (
                                <p className="text-sm text-gray-500 p-2">No sources found. Add them in the library first.</p>
                            ) : (
                                allSources.map(source => (
                                    <label key={source.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-600 bg-transparent text-electric-blue focus:ring-offset-gray-900"
                                            checked={selectedSourceIds.has(source.id)}
                                            onChange={() => toggleSource(source.id)}
                                        />
                                        <span className="text-sm text-gray-300 truncate">{source.name || source.url}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Display Settings */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Display Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Interval */}
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">
                                    Speed: {config.interval}s
                                </label>
                                <input
                                    type="range"
                                    min="5" max="300" step="5"
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    value={config.interval}
                                    onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) })}
                                />
                            </div>

                            {/* Fit */}
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Image Fit</label>
                                <select
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    value={config.fit}
                                    onChange={(e) => setConfig({ ...config, fit: e.target.value })}
                                >
                                    <option value="cover">Fill Screen (Crop)</option>
                                    <option value="contain">Fit Screen (Bars)</option>
                                </select>
                            </div>

                            {/* Transition */}
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Transition</label>
                                <select
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    value={config.transition}
                                    onChange={(e) => setConfig({ ...config, transition: e.target.value })}
                                >
                                    <option value="fade">Fade</option>
                                    <option value="none">Instant</option>
                                </select>
                            </div>

                            {/* Widgets */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.show_clock}
                                        onChange={(e) => setConfig({ ...config, show_clock: e.target.checked })}
                                    />
                                    <span className="text-gray-300">Show Clock</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.show_weather}
                                        onChange={(e) => setConfig({ ...config, show_weather: e.target.checked })}
                                    />
                                    <span className="text-gray-300">Show Weather</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Sleep Schedule */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex justify-between">
                            <span>Sleep Schedule</span>
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-normal">
                                <input
                                    type="checkbox"
                                    checked={config.sleep_schedule?.enabled || false}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        sleep_schedule: { ...(config.sleep_schedule || { enabled: false, start: '22:00', end: '07:00' }), enabled: e.target.checked }
                                    })}
                                />
                                Enable
                            </label>
                        </h3>

                        <div className={`grid grid-cols-2 gap-4 transition-opacity ${config.sleep_schedule?.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Sleep At</label>
                                <input
                                    type="time"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    value={config.sleep_schedule?.start || '22:00'}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        sleep_schedule: { ...(config.sleep_schedule || { enabled: false, start: '22:00', end: '07:00' }), start: e.target.value }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Wake At</label>
                                <input
                                    type="time"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    value={config.sleep_schedule?.end || '07:00'}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        sleep_schedule: { ...(config.sleep_schedule || { enabled: false, start: '22:00', end: '07:00' }), end: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="col-span-2 text-xs text-gray-500">
                                * During sleep, the screen will turn black but the device will stay awake.
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-gray-300 hover:text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-3 bg-electric-blue hover:bg-blue-600 text-white rounded-full font-bold shadow-lg transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
