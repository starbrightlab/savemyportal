import { Database } from '@/lib/database.types';

type FeedRow = Database['public']['Tables']['feeds']['Row'];

export type TransitionType = 'crossfade' | 'slide' | 'zoom-fade' | 'push' | 'none';

export interface FeedConfig {
    interval?: number | string;
    transition?: TransitionType | 'fade'; // 'fade' kept for backwards compat → maps to 'crossfade'
    fit?: 'cover' | 'contain';
    shuffle?: boolean;
    show_clock?: boolean;
    sleep_schedule?: {
        enabled: boolean;
        start: string;
        end: string;
    };
}

export interface Feed extends Omit<FeedRow, 'config'> {
    config?: FeedConfig;
}
