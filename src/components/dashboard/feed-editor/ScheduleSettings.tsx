import React from 'react';
import { FeedConfig } from './types';
import ProBadge from '@/components/ProBadge';

interface ScheduleSettingsProps {
    schedule: FeedConfig['sleep_schedule'];
    onChange: (schedule: FeedConfig['sleep_schedule']) => void;
    isPro?: boolean;
}

export const ScheduleSettings: React.FC<ScheduleSettingsProps> = ({ schedule, onChange, isPro = true }) => {
    // Default fallback
    const currentSchedule = schedule || { enabled: false, start: '22:00', end: '07:00' };

    const handleChange = (key: keyof typeof currentSchedule, value: any) => {
        if (!isPro) return;
        onChange({ ...currentSchedule, [key]: value });
    };

    return (
        <div className={!isPro ? 'opacity-40 pointer-events-none' : ''}>
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex justify-between">
                <span className="flex items-center gap-2">
                    Sleep Schedule
                    {!isPro && <ProBadge />}
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-normal">
                    <input
                        type="checkbox"
                        checked={currentSchedule.enabled}
                        onChange={(e) => handleChange('enabled', e.target.checked)}
                        disabled={!isPro}
                    />
                    Enable
                </label>
            </h3>

            <div className={`grid grid-cols-2 gap-4 transition-opacity ${currentSchedule.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Sleep At</label>
                    <input
                        type="time"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                        value={currentSchedule.start}
                        onChange={(e) => handleChange('start', e.target.value)}
                        disabled={!isPro}
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Wake At</label>
                    <input
                        type="time"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white"
                        value={currentSchedule.end}
                        onChange={(e) => handleChange('end', e.target.value)}
                        disabled={!isPro}
                    />
                </div>
                <div className="col-span-2 text-xs text-gray-500">
                    * During sleep, the screen will turn black but the device will stay awake.
                </div>
            </div>
        </div>
    );
};
