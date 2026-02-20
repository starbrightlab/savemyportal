import React from 'react';
import { Source } from './types';
import ProBadge from '@/components/ProBadge';

const SOURCE_LABELS: Record<string, string> = {
    google_photos: 'Google Photos',
    icloud: 'iCloud Album',
    dropbox: 'Dropbox',
};

interface SourceSelectorProps {
    availableSources: Source[];
    selectedSourceIds: Set<string>;
    onToggle: (id: string) => void;
    isPro?: boolean;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({ availableSources, selectedSourceIds, onToggle, isPro = true }) => {
    const maxSources = isPro ? Infinity : 1;
    const atLimit = selectedSourceIds.size >= maxSources;

    const handleToggle = (id: string) => {
        // Allow deselecting always; only block selecting if at limit
        if (!selectedSourceIds.has(id) && atLimit) return;
        onToggle(id);
    };

    return (
        <div>
            <label className="block text-base font-bold text-gray-300 mb-3 flex items-center gap-2">
                Albums
                {!isPro && atLimit && <ProBadge />}
            </label>
            <div className="space-y-1 max-h-64 overflow-y-auto border border-white/10 rounded-lg p-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                {availableSources.length === 0 ? (
                    <p className="text-base text-gray-300 p-3">No albums found. Add them from the dashboard first.</p>
                ) : (
                    availableSources.map(source => {
                        const isSelected = selectedSourceIds.has(source.id);
                        const isDisabled = !isSelected && atLimit;

                        return (
                            <label
                                key={source.id}
                                className={`flex items-center gap-3 p-3 rounded-lg min-h-[48px] ${
                                    isDisabled
                                        ? 'opacity-40 cursor-not-allowed'
                                        : 'active:bg-white/5 cursor-pointer'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="w-6 h-6 rounded border-gray-600 bg-transparent text-electric-blue focus:ring-offset-gray-900 flex-shrink-0"
                                    checked={isSelected}
                                    onChange={() => handleToggle(source.id)}
                                    disabled={isDisabled}
                                />
                                <span className="text-base text-gray-200 truncate">{source.name || SOURCE_LABELS[source.type] || 'Album'}</span>
                            </label>
                        );
                    })
                )}
            </div>
            {!isPro && atLimit && (
                <p className="text-base text-gray-300 mt-2">Free tier is limited to 1 album per feed. Upgrade to Pro for unlimited.</p>
            )}
        </div>
    );
};
