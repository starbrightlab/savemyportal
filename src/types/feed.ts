import { Database } from '@/lib/database.types';

type FeedRow = Database['public']['Tables']['feeds']['Row'];

export type TransitionType = 'crossfade' | 'slide' | 'zoom-fade' | 'push' | 'none';

/** Controls whether videos play fully or cut at the normal slide interval. */
export type VideoBehavior = 'full' | 'interval';

export interface FeedConfig {
    interval?: number | string;
    transition?: TransitionType | 'fade'; // 'fade' kept for backwards compat → maps to 'crossfade'
    fit?: 'cover' | 'contain';
    shuffle?: boolean;
    show_clock?: boolean;
    video_behavior?: VideoBehavior; // default 'full'
    sleep_schedule?: {
        enabled: boolean;
        start: string;
        end: string;
    };
}

export interface Feed extends Omit<FeedRow, 'config'> {
    config?: FeedConfig;
}
