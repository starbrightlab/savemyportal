"use client";

import { useState } from 'react';

import { Database } from '@/lib/database.types';

type Source = Database['public']['Tables']['sources']['Row'];

interface SourceCardProps {
    source: Source;
    onSync: (id: string) => Promise<void>;
    onDelete: (id: string) => void;
}

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
    active: { dot: 'bg-green-400', label: 'Active' },
    error: { dot: 'bg-red-400', label: 'Error' },
    pending: { dot: 'bg-yellow-400', label: 'Pending' },
};

const SOURCE_LABELS: Record<string, string> = {
    google_photos: 'Google Photos',
    icloud: 'iCloud Album',
    dropbox: 'Dropbox',
};

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
            setTimeout(() => setConfirmingDelete(false), 3000);
        }
    };

    const status = STATUS_STYLES[source.status || 'pending'] || STATUS_STYLES.pending;
    const label = source.name || SOURCE_LABELS[source.type] || 'Album';

    return (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all">
            {/* Top row */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="min-w-0">
                        <h3 className="font-semibold text-white text-lg leading-tight truncate">{label}</h3>
                        <a
                            className="text-base text-gray-300 active:text-electric-blue transition-colors py-1.5 px-1 -mx-1 inline-block"
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View album &rarr;
                        </a>
                    </div>
                </div>
                <span className={`text-sm font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg ${
                    source.status === 'active' ? 'text-green-300 bg-green-500/10' :
                    source.status === 'error' ? 'text-red-300 bg-red-500/10' :
                    'text-yellow-300 bg-yellow-500/10'
                }`}>
                    {status.label}
                </span>
            </div>

            {/* Meta */}
            <div className="text-base text-gray-300 mb-3">
                {source.last_scraped_at
                    ? `Synced ${new Date(source.last_scraped_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${new Date(source.last_scraped_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
                    : 'Never synced'
                }
            </div>

            {source.error_message && (
                <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/15 rounded-lg px-3 py-2 mb-3 truncate">
                    {source.error_message}
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-2.5">
                <button
                    onClick={handleSync}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-lg text-base font-semibold transition-all disabled:opacity-50 border border-white/10 bg-white/[0.05] text-gray-200 active:bg-white/10"
                >
                    {loading ? 'Syncing...' : 'Sync'}
                </button>
                <button
                    onClick={handleDelete}
                    className={`flex-1 py-3.5 rounded-lg text-base font-semibold transition-all ${confirmingDelete
                        ? 'bg-red-500/20 text-red-200 border border-red-500/40 animate-pulse'
                        : 'text-gray-200 border border-white/10 bg-white/[0.05] active:text-red-300 active:bg-red-500/10'
                    }`}
                >
                    {confirmingDelete ? 'Tap to Confirm' : 'Remove'}
                </button>
            </div>
        </div>
    );
}
