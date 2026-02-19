"use client";

import { useState } from 'react';
import type { Feed } from '@/types/feed';

interface FeedCardProps {
    feed: Feed;
    sourceCount?: number;
    onDelete: () => void;
    onEdit: () => void;
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
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const config = feed.config || {};
    const interval = config.interval || 10;
    const transition = TRANSITION_LABELS[config.transition || 'crossfade'] || 'Crossfade';
    const fit = config.fit === 'contain' ? 'Fit' : 'Fill';

    const handleDelete = () => {
        if (confirmingDelete) {
            onDelete();
            setConfirmingDelete(false);
        } else {
            setConfirmingDelete(true);
            setTimeout(() => setConfirmingDelete(false), 4000);
        }
    };

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all">
            {/* Feed name */}
            <h3 className="font-semibold text-white text-lg leading-tight mb-3">{feed.name}</h3>

            {/* Config pills */}
            <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1.5 rounded-lg bg-white/[0.08] text-gray-200 text-base font-medium">{interval}s</span>
                <span className="px-3 py-1.5 rounded-lg bg-white/[0.08] text-gray-200 text-base font-medium">{transition}</span>
                <span className="px-3 py-1.5 rounded-lg bg-white/[0.08] text-gray-200 text-base font-medium">{fit}</span>
                {config.shuffle !== false && (
                    <span className="px-3 py-1.5 rounded-lg bg-white/[0.08] text-gray-200 text-base font-medium">Shuffle</span>
                )}
                {config.show_clock && (
                    <span className="px-3 py-1.5 rounded-lg bg-white/[0.08] text-gray-200 text-base font-medium">
                        Clock {config.clock_position ? `(${config.clock_position.replace('-', ' ')})` : ''}
                    </span>
                )}
            </div>

            {/* Sources count or empty nudge */}
            {sourceCount === 0 ? (
                <button
                    onClick={onEdit}
                    className="w-full py-3.5 text-base font-medium text-electric-blue border border-dashed border-electric-blue/30 rounded-lg transition-colors active:bg-electric-blue/10"
                >
                    + Add photos to this feed
                </button>
            ) : (
                <p className="text-base text-gray-300 mb-1">
                    {sourceCount} source{sourceCount !== 1 ? 's' : ''} connected
                </p>
            )}

            {/* Action buttons — always visible, labeled, large touch targets */}
            <div className="flex flex-col gap-2.5 mt-4">
                <a
                    href={`/?feedId=${feed.id || ''}`}
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-lg text-base font-bold bg-electric-blue/15 text-electric-blue border border-electric-blue/25 transition-colors active:bg-electric-blue/25"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                </a>
                <div className="flex gap-2.5">
                    <button
                        onClick={onEdit}
                        className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-lg text-base font-semibold border border-white/10 bg-white/[0.05] text-gray-200 transition-colors active:bg-white/10"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-lg text-base font-semibold transition-colors ${
                            confirmingDelete
                                ? 'bg-red-500/20 text-red-200 border border-red-500/40 animate-pulse'
                                : 'border border-white/10 bg-white/[0.05] text-gray-200 active:bg-red-500/10 active:text-red-300'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {confirmingDelete ? 'Tap to Confirm' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
