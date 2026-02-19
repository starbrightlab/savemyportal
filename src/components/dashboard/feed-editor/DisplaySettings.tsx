import React from 'react';
import { FeedConfig } from './types';
import ProBadge from '@/components/ProBadge';

interface DisplaySettingsProps {
    config: FeedConfig;
    onChange: (config: FeedConfig) => void;
    isPro?: boolean;
}

export const DisplaySettings: React.FC<DisplaySettingsProps> = ({ config, onChange, isPro = true }) => {
    const handleChange = (key: keyof FeedConfig, value: any) => {
        if (!isPro) return;
        onChange({ ...config, [key]: value });
    };

    const lockedClass = !isPro ? 'opacity-40 pointer-events-none' : '';

    return (
        <div>
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                Display Settings
                {!isPro && <ProBadge />}
            </h3>
            {!isPro && (
                <p className="text-base text-gray-300 mb-4">Upgrade to Pro to customise display settings.</p>
            )}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${lockedClass}`}>

                {/* Interval */}
                <div>
                    <label className="block text-base font-bold text-gray-300 mb-2">
                        Speed: {config.interval}s
                    </label>
                    <input
                        type="range"
                        min="5" max="300" step="5"
                        className="w-full h-5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        value={config.interval}
                        onChange={(e) => handleChange('interval', parseInt(e.target.value))}
                        disabled={!isPro}
                    />
                </div>

                {/* Fit */}
                <div>
                    <label className="block text-base font-bold text-gray-300 mb-2">Image Fit</label>
                    <select
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white disabled:cursor-not-allowed"
                        value={config.fit}
                        onChange={(e) => handleChange('fit', e.target.value)}
                        disabled={!isPro}
                    >
                        <option value="cover">Fill Screen (Crop)</option>
                        <option value="contain">Fit Screen (Bars)</option>
                    </select>
                </div>

                {/* Transition */}
                <div>
                    <label className="block text-base font-bold text-gray-300 mb-2">Transition</label>
                    <select
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white disabled:cursor-not-allowed"
                        value={config.transition === 'fade' ? 'crossfade' : config.transition}
                        onChange={(e) => handleChange('transition', e.target.value)}
                        disabled={!isPro}
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
                    <label className="block text-base font-bold text-gray-300 mb-2 flex items-center gap-2">
                        Video Playback
                        {!isPro && <ProBadge />}
                    </label>
                    <select
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white disabled:cursor-not-allowed"
                        value={config.video_behavior || 'full'}
                        onChange={(e) => handleChange('video_behavior', e.target.value)}
                        disabled={!isPro}
                    >
                        <option value="full">Play Full Video</option>
                        <option value="interval">Cut at Slide Interval</option>
                    </select>
                </div>

                {/* Options */}
                <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer min-h-[48px]">
                        <input
                            type="checkbox"
                            className="w-6 h-6 rounded border-gray-600 bg-transparent text-electric-blue focus:ring-offset-gray-900"
                            checked={config.shuffle !== false}
                            onChange={(e) => handleChange('shuffle', e.target.checked)}
                            disabled={!isPro}
                        />
                        <span className="text-gray-200 text-base">Shuffle Order</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer min-h-[48px]">
                        <input
                            type="checkbox"
                            className="w-6 h-6 rounded border-gray-600 bg-transparent text-electric-blue focus:ring-offset-gray-900"
                            checked={config.show_clock}
                            onChange={(e) => handleChange('show_clock', e.target.checked)}
                            disabled={!isPro}
                        />
                        <span className="text-gray-200 text-base">Show Clock</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer min-h-[48px]">
                        <input
                            type="checkbox"
                            className="w-6 h-6 rounded border-gray-600 bg-transparent text-electric-blue focus:ring-offset-gray-900"
                            checked={config.video_sound || false}
                            onChange={(e) => handleChange('video_sound', e.target.checked)}
                            disabled={!isPro}
                        />
                        <span className="text-gray-200 text-base flex items-center gap-2">
                            Video Sound
                            {!isPro && <ProBadge />}
                        </span>
                    </label>
                </div>

                {/* Clock Position — only shown when clock is enabled */}
                {config.show_clock && (
                    <div>
                        <label className="block text-base font-bold text-gray-300 mb-2">Clock Position</label>
                        <select
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white disabled:cursor-not-allowed"
                            value={config.clock_position || 'top-right'}
                            onChange={(e) => handleChange('clock_position', e.target.value)}
                            disabled={!isPro}
                        >
                            <option value="top-right">Top Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                        </select>
                    </div>
                )}

                {/* Clock Size — only shown when clock is enabled */}
                {config.show_clock && (
                    <div>
                        <label className="block text-base font-bold text-gray-300 mb-2">Clock Size</label>
                        <select
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white disabled:cursor-not-allowed"
                            value={config.clock_size || 'medium'}
                            onChange={(e) => handleChange('clock_size', e.target.value)}
                            disabled={!isPro}
                        >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};
