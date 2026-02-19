import React from 'react';
import { Source } from './types';
import ProBadge from '@/components/ProBadge';

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
            <label className="block text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                Content Sources
                {!isPro && atLimit && <ProBadge />}
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-white/5 rounded-lg p-2">
                {availableSources.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">No sources found. Add them in the library first.</p>
                ) : (
                    availableSources.map(source => {
                        const isSelected = selectedSourceIds.has(source.id);
                        const isDisabled = !isSelected && atLimit;

                        return (
                            <label
                                key={source.id}
                                className={`flex items-center gap-3 p-2 rounded ${
                                    isDisabled
                                        ? 'opacity-40 cursor-not-allowed'
                                        : 'hover:bg-white/5 cursor-pointer'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-600 bg-transparent text-electric-blue focus:ring-offset-gray-900"
                                    checked={isSelected}
                                    onChange={() => handleToggle(source.id)}
                                    disabled={isDisabled}
                                />
                                <span className="text-sm text-gray-300 truncate">{source.name || source.url}</span>
                            </label>
                        );
                    })
                )}
            </div>
            {!isPro && atLimit && (
                <p className="text-xs text-gray-500 mt-2">Free tier is limited to 1 source per feed. Upgrade to Pro for unlimited.</p>
            )}
        </div>
    );
};
