"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useUpdateFeed } from '@/hooks/useFeeds';
import { useAllSources } from '@/hooks/useSources';
import { useTier } from '@/context/TierContext';
import { Source } from '@/components/dashboard/feed-editor/types';
import { SourceSelector } from '@/components/dashboard/feed-editor/SourceSelector';
import { DisplaySettings } from '@/components/dashboard/feed-editor/DisplaySettings';
import { ScheduleSettings } from '@/components/dashboard/feed-editor/ScheduleSettings';
import type { Feed, FeedConfig } from '@/types/feed';

interface FeedEditorProps {
    feed: Feed;
    onClose: () => void;
    onUpdate: () => void;
}

export default function FeedEditor({ feed, onClose, onUpdate }: FeedEditorProps) {
    const { isPro } = useTier();
    const [name, setName] = useState(feed.name);
    const [config, setConfig] = useState<FeedConfig>((feed.config as FeedConfig) || {
        interval: 10,
        transition: 'fade',
        fit: 'cover',
        shuffle: true,
        show_clock: true,
        clock_position: 'top-right',
        clock_size: 'medium',
        sleep_schedule: { enabled: false, start: '22:00', end: '07:00' }
    });

    const { data: allSourcesData = [] } = useAllSources(feed.user_id);

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

            // Diff-based update: only remove deselected and add newly selected
            // This avoids the non-atomic delete-all + re-insert pattern
            const currentIds = new Set(feedSourcesData.map(fs => fs.source_id));
            const toRemove = [...currentIds].filter(id => !selectedSourceIds.has(id));
            const toAdd = [...selectedSourceIds].filter(id => !currentIds.has(id));

            if (toRemove.length > 0) {
                const { error } = await supabase
                    .from('feed_sources')
                    .delete()
                    .eq('feed_id', feed.id)
                    .in('source_id', toRemove);
                if (error) throw error;
            }

            if (toAdd.length > 0) {
                const rows = toAdd.map(sourceId => ({
                    feed_id: feed.id,
                    source_id: sourceId
                }));
                const { error } = await supabase.from('feed_sources').insert(rows);
                if (error) throw error;
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
                    <button onClick={onClose} className="text-gray-200 active:text-white p-4 rounded-lg active:bg-white/10 transition-colors text-2xl leading-none min-w-[48px] min-h-[48px] flex items-center justify-center">✕</button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Name */}
                    <div>
                        <label className="block text-base font-bold text-gray-300 mb-2">Feed Name</label>
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
                        isPro={isPro}
                    />

                    {/* Display Settings */}
                    <DisplaySettings
                        config={config}
                        onChange={setConfig}
                        isPro={isPro}
                    />

                    {/* Sleep Schedule */}
                    <ScheduleSettings
                        schedule={config.sleep_schedule}
                        onChange={(newSchedule) => setConfig({ ...config, sleep_schedule: newSchedule })}
                        isPro={isPro}
                    />

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button
                            onClick={onClose}
                            className="px-6 py-3.5 text-gray-200 font-medium transition-colors border border-white/10 rounded-lg active:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-3.5 bg-electric-blue active:bg-blue-600 text-white rounded-lg font-bold shadow-lg transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
