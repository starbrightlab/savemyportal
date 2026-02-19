export const TIER_LIMITS = {
    free: {
        maxFeeds: 1,
        maxSources: 1,
        videosAllowed: false,
        configurable: false,
    },
    pro: {
        maxFeeds: Infinity,
        maxSources: Infinity,
        videosAllowed: true,
        configurable: true,
    },
} as const;

export const FREE_DEFAULT_CONFIG = {
    interval: 30,
    transition: 'crossfade',
    fit: 'cover',
    shuffle: true,
    show_clock: true,
} as const;

export type TierName = keyof typeof TIER_LIMITS;
