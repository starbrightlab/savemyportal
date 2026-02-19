import React from 'react';
import { FeedConfig } from './types';

interface DisplaySettingsProps {
    config: FeedConfig;
    onChange: (config: FeedConfig) => void;
}

export const DisplaySettings: React.FC<DisplaySettingsProps> = ({ config, onChange }) => {
    const handleChange = (key: keyof FeedConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Display Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Interval */}
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">
                        Speed: {config.interval}s
                    </label>
                    <input
                        type="range"
                        min="5" max="300" step="5"
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        value={config.interval}
                        onChange={(e) => handleChange('interval', parseInt(e.target.value))}
                    />
                </div>

                {/* Fit */}
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Image Fit</label>
                    <select
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                        value={config.fit}
                        onChange={(e) => handleChange('fit', e.target.value)}
                    >
                        <option value="cover">Fill Screen (Crop)</option>
                        <option value="contain">Fit Screen (Bars)</option>
                    </select>
                </div>

                {/* Transition */}
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Transition</label>
                    <select
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                        value={config.transition === 'fade' ? 'crossfade' : config.transition}
                        onChange={(e) => handleChange('transition', e.target.value)}
                    >
                        <option value="crossfade">Crossfade</option>
                        <option value="slide">Slide</option>
                        <option value="zoom-fade">Zoom Fade</option>
                        <option value="push">Push</option>
                        <option value="none">Instant</option>
                    </select>
                </div>

                {/* Video Playback */}
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Video Playback</label>
                    <select
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                        value={config.video_behavior || 'full'}
                        onChange={(e) => handleChange('video_behavior', e.target.value)}
                    >
                        <option value="full">Play Full Video</option>
                        <option value="interval">Cut at Slide Interval</option>
                    </select>
                </div>

                {/* Options */}
                <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.shuffle !== false}
                            onChange={(e) => handleChange('shuffle', e.target.checked)}
                        />
                        <span className="text-gray-300">Shuffle Order</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.show_clock}
                            onChange={(e) => handleChange('show_clock', e.target.checked)}
                        />
                        <span className="text-gray-300">Show Clock</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
