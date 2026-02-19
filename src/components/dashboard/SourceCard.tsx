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
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-5 hover:border-white/15 transition-all group">
            {/* Top row */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} />
                    <div className="min-w-0">
                        <h3 className="font-semibold text-white text-sm leading-tight truncate">{label}</h3>
                        <a
                            className="text-xs text-gray-500 hover:text-electric-blue transition-colors"
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View album
                        </a>
                    </div>
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                    source.status === 'active' ? 'text-green-400/80 bg-green-500/10' :
                    source.status === 'error' ? 'text-red-400/80 bg-red-500/10' :
                    'text-yellow-400/80 bg-yellow-500/10'
                }`}>
                    {status.label}
                </span>
            </div>

            {/* Meta */}
            <div className="text-xs text-gray-600 mb-3">
                {source.last_scraped_at
                    ? `Synced ${new Date(source.last_scraped_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${new Date(source.last_scraped_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
                    : 'Never synced'
                }
            </div>

            {source.error_message && (
                <p className="text-xs text-red-400/80 bg-red-500/5 border border-red-500/10 rounded px-2.5 py-1.5 mb-3 truncate">
                    {source.error_message}
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={handleSync}
                    disabled={loading}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 border border-white/8 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white"
                >
                    {loading ? 'Syncing...' : 'Sync'}
                </button>
                <button
                    onClick={handleDelete}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${confirmingDelete
                        ? 'bg-red-500/20 text-red-200 border border-red-500/40'
                        : 'text-gray-500 border border-white/8 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5'
                    }`}
                >
                    {confirmingDelete ? 'Confirm?' : 'Remove'}
                </button>
            </div>
        </div>
    );
}
