import { Database } from '@/lib/database.types';

export type Source = Database['public']['Tables']['sources']['Row'];

export interface FeedConfig {
    interval: number;
    transition: string;
    fit: string; // 'cover' | 'contain'
    show_clock: boolean;
    show_weather: boolean;
    sleep_schedule?: {
        enabled: boolean;
        start: string;
        end: string;
    };
}
