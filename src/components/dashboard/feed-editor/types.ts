import { Database } from '@/lib/database.types';

export type Source = Database['public']['Tables']['sources']['Row'];

// Re-export from canonical location
export type { Feed, FeedConfig } from '@/types/feed';
