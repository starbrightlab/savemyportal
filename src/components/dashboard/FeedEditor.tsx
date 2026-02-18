"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useUpdateFeed } from '@/hooks/useFeeds';
import { Source } from '@/components/dashboard/feed-editor/types';
import { SourceSelector } from '@/components/dashboard/feed-editor/SourceSelector';
import { DisplaySettings } from '@/components/dashboard/feed-editor/DisplaySettings';
import { ScheduleSettings } from '@/components/dashboard/feed-editor/ScheduleSettings';
import { Database } from '@/lib/database.types';
import { FeedConfig } from '@/components/dashboard/feed-editor/types';

type FeedRow = Database['public']['Tables']['feeds']['Row'];

interface Feed extends Omit<FeedRow, 'config'> {
    config?: FeedConfig;
}

interface FeedEditorProps {
    feed: Feed;
    onClose: () => void;
    onUpdate: () => void;
}

export default function FeedEditor({ feed, onClose, onUpdate }: FeedEditorProps) {
    const [name, setName] = useState(feed.name);
    const [config, setConfig] = useState<FeedConfig>((feed.config as FeedConfig) || {
        interval: 10,
        transition: 'fade',
        fit: 'cover',
        show_clock: true,
        show_weather: false,
        sleep_schedule: { enabled: false, start: '22:00', end: '07:00' }
    });

    const { data: allSourcesData = [] } = useQuery({
        queryKey: ['sources'],
        queryFn: async () => {
            const { data, error } = await supabase.from('sources').select('*');
            if (error) throw error;
            return data as Source[];
        }
    });

    const { data: feedSourcesData = [] } = useQuery({
        queryKey: ['feed_sources', feed.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('feed_sources')
                .select('source_id')
                .eq('feed_id', feed.id);
            if (error) throw error;
            return data;
        }
    });

    // Initialize selection state once data loads
    useEffect(() => {
        if (feedSourcesData) {
            const currentIds = new Set(feedSourcesData.map(fs => fs.source_id));
            setSelectedSourceIds(currentIds);
        }
    }, [feedSourcesData]);

    const updateFeedMutation = useUpdateFeed();
    const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateFeedMutation.mutateAsync({
                id: feed.id,
                name,
                config: config as any
            });

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
        } catch (error: any) {
            alert('Error saving settings: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleSource = (id: string) => {
        const newSet = new Set(selectedSourceIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedSourceIds(newSet);
    };

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
                    <SourceSelector
                        availableSources={allSourcesData}
                        selectedSourceIds={selectedSourceIds}
                        onToggle={toggleSource}
                    />

                    {/* Display Settings */}
                    <DisplaySettings
                        config={config}
                        onChange={setConfig}
                    />

                    {/* Sleep Schedule */}
                    <ScheduleSettings
                        schedule={config.sleep_schedule}
                        onChange={(newSchedule) => setConfig({ ...config, sleep_schedule: newSchedule })}
                    />

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
