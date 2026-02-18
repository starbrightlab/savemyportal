import React from 'react';
import { Source } from './types';

interface SourceSelectorProps {
    availableSources: Source[];
    selectedSourceIds: Set<string>;
    onToggle: (id: string) => void;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({ availableSources, selectedSourceIds, onToggle }) => {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-400 mb-3">Content Sources</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-white/5 rounded-lg p-2">
                {availableSources.length === 0 ? (
                    <p className="text-sm text-gray-500 p-2">No sources found. Add them in the library first.</p>
                ) : (
                    availableSources.map(source => (
                        <label key={source.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded border-gray-600 bg-transparent text-electric-blue focus:ring-offset-gray-900"
                                checked={selectedSourceIds.has(source.id)}
                                onChange={() => onToggle(source.id)}
                            />
                            <span className="text-sm text-gray-300 truncate">{source.name || source.url}</span>
                        </label>
                    ))
                )}
            </div>
        </div>
    );
};
