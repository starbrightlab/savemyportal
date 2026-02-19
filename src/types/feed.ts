import { Database } from '@/lib/database.types';

type FeedRow = Database['public']['Tables']['feeds']['Row'];

export type TransitionType = 'crossfade' | 'slide' | 'zoom-fade' | 'push' | 'none';

/** Controls whether videos play fully or cut at the normal slide interval. */
export type VideoBehavior = 'full' | 'interval';

/** Which corner the clock widget is positioned in. */
export type ClockPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/** Predefined clock size presets. */
export type ClockSize = 'small' | 'medium' | 'large';

export interface FeedConfig {
    interval?: number | string;
    transition?: TransitionType | 'fade'; // 'fade' kept for backwards compat → maps to 'crossfade'
    fit?: 'cover' | 'contain';
    shuffle?: boolean;
    show_clock?: boolean;
    clock_position?: ClockPosition; // default 'top-right'
    clock_size?: ClockSize; // default 'medium'
    video_behavior?: VideoBehavior; // default 'full'
    video_sound?: boolean; // default false (muted)
    sleep_schedule?: {
        enabled: boolean;
        start: string;
        end: string;
    };
}

export interface Feed extends Omit<FeedRow, 'config'> {
    config?: FeedConfig;
}
