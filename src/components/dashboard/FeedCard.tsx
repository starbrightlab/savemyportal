"use client";

import { MouseEventHandler } from 'react';
import type { Feed } from '@/types/feed';

interface FeedCardProps {
    feed: Feed;
    sourceCount?: number;
    onDelete: MouseEventHandler<HTMLButtonElement>;
    onEdit: MouseEventHandler<HTMLButtonElement>;
}

const TRANSITION_LABELS: Record<string, string> = {
    crossfade: 'Crossfade',
    fade: 'Crossfade',
    slide: 'Slide',
    'zoom-fade': 'Zoom Fade',
    push: 'Push',
    none: 'Instant',
};

export default function FeedCard({ feed, sourceCount, onDelete, onEdit }: FeedCardProps) {
    const config = feed.config || {};
    const interval = config.interval || 10;
    const transition = TRANSITION_LABELS[config.transition || 'crossfade'] || 'Crossfade';
    const fit = config.fit === 'contain' ? 'Fit' : 'Fill';

    return (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 hover:border-white/15 transition-all group">
            {/* Top row: name + actions */}
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-white text-base leading-tight">{feed.name}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                        href={`/?feedId=${feed.id || ''}`}
                        className="text-electric-blue hover:text-blue-300 p-1.5 rounded-md hover:bg-white/5 transition-colors"
                        title="Play"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </a>
                    <button onClick={onEdit} className="text-gray-500 hover:text-white p-1.5 rounded-md hover:bg-white/5 transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button onClick={onDelete} className="text-gray-500 hover:text-red-400 p-1.5 rounded-md hover:bg-white/5 transition-colors" title="Delete">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Config pills */}
            <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="px-2 py-0.5 rounded bg-white/[0.06] text-gray-400">{interval}s</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.06] text-gray-400">{transition}</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.06] text-gray-400">{fit}</span>
                {config.shuffle !== false && (
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] text-gray-400">Shuffle</span>
                )}
                {config.show_clock && (
                    <span className="px-2 py-0.5 rounded bg-white/[0.06] text-gray-400">Clock</span>
                )}
            </div>

            {/* Sources count or empty nudge */}
            {sourceCount === 0 ? (
                <button
                    onClick={onEdit}
                    className="w-full mt-3 py-2 text-xs text-electric-blue/70 hover:text-electric-blue border border-dashed border-electric-blue/20 hover:border-electric-blue/40 rounded-lg transition-colors"
                >
                    + Add photos to this feed
                </button>
            ) : (
                <p className="mt-3 text-xs text-gray-600">
                    {sourceCount} source{sourceCount !== 1 ? 's' : ''} connected
                </p>
            )}
        </div>
    );
}
