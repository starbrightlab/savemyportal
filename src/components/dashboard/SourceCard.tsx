"use client";

import { useState } from 'react';

import { Database } from '@/lib/database.types';

type Source = Database['public']['Tables']['sources']['Row'];

interface SourceCardProps {
    source: Source;
    onSync: (id: string) => Promise<void>;
    onDelete: (id: string) => void;
}

export default function SourceCard({ source, onSync, onDelete }: SourceCardProps) {
    const [loading, setLoading] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const handleSync = async () => {
        setLoading(true);
        await onSync(source.id);
        setLoading(false);
    };

    const handleDelete = () => {
        if (confirmingDelete) {
            onDelete(source.id);
            setConfirmingDelete(false);
        } else {
            setConfirmingDelete(true);
            // Auto-reset after 3 seconds if user doesn't confirm
            setTimeout(() => setConfirmingDelete(false), 3000);
        }
    };

    return (
        <div className="glass-card p-6 relative group border hover:border-electric-blue/50 transition-colors">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="text-2xl">
                            {source.type === 'google_photos' ? '🖼️' : source.type === 'icloud' ? '☁️' : '📁'}
                        </span>
                        <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
                            source.status === 'active' ? 'bg-green-400' :
                            source.status === 'error' ? 'bg-red-400' :
                            'bg-yellow-400'
                        }`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">
                            {source.name || (source.type === 'google_photos' ? 'Google Photos' : 'iCloud Album')}
                            <span className="text-xs font-normal text-gray-500 ml-2">#{source.id.slice(0, 4)}</span>
                        </h3>
                        <a className="text-xs text-electric-blue truncate max-w-[200px]" href={source.url} target="_blank" rel="noopener noreferrer">
                            View Album
                        </a>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${source.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    source.status === 'error' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                    }`}>
                    {(source.status || 'pending').toUpperCase()}
                </div>
            </div>

            <div className="text-xs text-gray-400" style={{ textAlign: "right" }}>
                <p>Last Sync: {source.last_scraped_at ? new Date(source.last_scraped_at).toLocaleTimeString() : 'Never'}</p>
                {source.error_message && (
                    <p className="text-red-400 text-xs">Error: {source.error_message}</p>
                )}
            </div>

            <div className="flex gap-3 mt-4">
                <button
                    onClick={handleSync}
                    disabled={loading}
                    className="flex-1 py-2 rounded-lg bg-electric-blue/10 hover:bg-electric-blue/20 text-electric-blue text-sm font-semibold transition-colors disabled:opacity-50"
                >
                    {loading ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                    onClick={handleDelete}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${confirmingDelete
                        ? 'bg-red-500/30 text-red-200 border border-red-500/50'
                        : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                    }`}
                >
                    {confirmingDelete ? 'Confirm?' : 'Delete'}
                </button>
            </div>
        </div >
    );
}
