"use client";

import { MouseEventHandler } from 'react';
import type { Feed } from '@/types/feed';

interface FeedCardProps {
    feed: Feed;
    sourceCount?: number;
    onDelete: MouseEventHandler<HTMLButtonElement>;
    onEdit: MouseEventHandler<HTMLButtonElement>;
}

export default function FeedCard({ feed, sourceCount, onDelete, onEdit }: FeedCardProps) {
    const config = feed.config || {};

    // Config Extraction
    const interval = config.interval || 10;
    const transition = config.transition || 'fade';
    const fit = config.fit || 'cover';
    const shuffleEnabled = config.shuffle !== false;
    const showClock = config.show_clock || false;

    return (
        <div className="glass-card p-6 relative group border border-white/10 hover:border-electric-blue/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">📺</span>
                    <div>
                        <h3 className="font-bold text-white text-xl">{feed.name}</h3>
                        <p className="text-xs text-gray-400">
                            {interval}s • {transition} • {fit}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <a
                        href={`/?feedId=${feed.id || ''}`}
                        className="text-electric-blue hover:text-blue-400 p-2"
                        title="Play on this device"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </a>
                    <button onClick={onEdit} className="text-gray-400 hover:text-white p-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button onClick={onDelete} className="text-red-400 hover:text-red-300 p-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Empty feed nudge */}
            {sourceCount === 0 && (
                <button
                    onClick={onEdit}
                    className="w-full mt-2 py-2 text-xs text-electric-blue/70 hover:text-electric-blue border border-dashed border-electric-blue/20 hover:border-electric-blue/40 rounded-lg transition-colors"
                >
                    + Tap to add photos
                </button>
            )}
        </div>
    );
}
