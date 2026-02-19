import { Database } from '@/lib/database.types';

type FeedRow = Database['public']['Tables']['feeds']['Row'];

export interface FeedConfig {
    interval?: number | string;
    transition?: string;
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
