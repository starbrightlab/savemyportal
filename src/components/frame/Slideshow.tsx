"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useSessionKeepAlive } from '@/hooks/useSessionKeepAlive';
import type { Feed, TransitionType, VideoBehavior, ClockPosition, ClockSize } from '@/types/feed';

const DEBUG = process.env.NODE_ENV === 'development';

interface Photo {
    id: string;
    source_id: string;
    url: string;
    media_type: 'image' | 'video';
    video_url?: string | null;
    credit?: {
        name: string;
        username: string;
    };
}

// Curated fallback scenic images from Unsplash (free to hotlink per Unsplash terms).
// Displayed when no user is signed in, no photos are available, or on fetch error.
// Credit metadata per Unsplash attribution guidelines.
const FALLBACK_PHOTOS: Photo[] = [
    { id: 'fb-1', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80', credit: { name: 'Bailey Zindel', username: 'baileyzindel' } },
    { id: 'fb-2', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80', credit: { name: 'Urban Vintage', username: 'urban_vintage' } },
    { id: 'fb-3', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920&q=80', credit: { name: 'Tim Swaan', username: 'timswaanphotography' } },
    { id: 'fb-4', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80', credit: { name: 'Robert Lukeman', username: 'robertlukeman' } },
    { id: 'fb-5', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1920&q=80', credit: { name: 'Blake Verdoorn', username: 'lakeverdoorn' } },
    { id: 'fb-6', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80', credit: { name: 'Pietro De Grandi', username: 'peter_mc_greats' } },
    { id: 'fb-7', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80', credit: { name: 'v2osk', username: 'v2osk' } },
    { id: 'fb-8', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1771387925581-cb0e1d64f506?w=1920&q=80', credit: { name: 'Daniel Akselrod', username: 'daniel_akserlod' } },
    { id: 'fb-9', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=1920&q=80', credit: { name: 'Rachel Cook', username: 'grafixgurl247' } },
    { id: 'fb-10', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1920&q=80', credit: { name: 'Ivana Cajina', username: 'von_co' } },
    { id: 'fb-11', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1563824299647-a84d608d85b8?w=1920&q=80', credit: { name: 'Tim Swaan', username: 'timswaanphotography' } },
    { id: 'fb-12', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1428452971006-b3dff82e3ca4?w=1920&q=80', credit: { name: 'Blake Verdoorn', username: 'lakeverdoorn' } },
    { id: 'fb-13', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1433086994863-5f3136c18a58?w=1920&q=80', credit: { name: 'Blake Verdoorn', username: 'lakeverdoorn' } },
    { id: 'fb-14', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1770932536808-bd67e5809870?w=1920&q=80', credit: { name: 'Alexey O', username: 'ao__space' } },
    { id: 'fb-15', source_id: 'fallback', media_type: 'image', url: 'https://images.unsplash.com/photo-1770106678115-ec9aa241cdf6?w=1920&q=80', credit: { name: 'Leo_Visions', username: 'leo_visions_' } },
];

/** Fisher-Yates shuffle (returns a new array). */
function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/** Format time as 12-hour h:mm (e.g. "2:35") */
function formatClock(): string {
    const now = new Date();
    let hours = now.getHours() % 12;
    if (hours === 0) hours = 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

interface SlideshowProps {
    feed?: Feed | null;
}

export default function Slideshow({ feed }: SlideshowProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [sleeping, setSleeping] = useState(false);
    const [clockTime, setClockTime] = useState('');
    const [usingFallback, setUsingFallback] = useState(false);

    // Config
    const config = feed?.config || {};
    const intervalTime = (typeof config.interval === 'string' ? parseInt(config.interval) : config.interval || 10) * 1000;
    const objectFit = config.fit || 'cover';
    const showClock = config.show_clock || false;
    const clockPosition: ClockPosition = (config.clock_position as ClockPosition) || 'top-right';
    const clockSize: ClockSize = (config.clock_size as ClockSize) || 'medium';
    const shuffle = config.shuffle !== false; // default true
    const videoBehavior: VideoBehavior = (config.video_behavior as VideoBehavior) || 'full';
    const videoSound = config.video_sound || false;

    // Normalise transition value — map legacy 'fade' to 'crossfade'
    const transition: TransitionType = (() => {
        const raw = config.transition || 'crossfade';
        if (raw === 'fade') return 'crossfade';
        return raw as TransitionType;
    })();

    // Transition state — track which photo is "entering" vs "on stage"
    const [isTransitioning, setIsTransitioning] = useState(false);
    const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Video playback — when a video is the current item, let it play to completion
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    // Stale URL detection — track consecutive failures and trigger background re-scrape
    const failCountRef = useRef(0);               // consecutive load failures (resets on success)
    const lastRescrapeRef = useRef(0);             // timestamp (ms) of last re-scrape attempt
    const rescrapeAttemptRef = useRef(0);           // how many re-scrapes attempted (for backoff)
    const rescrapeInFlightRef = useRef(false);      // prevent concurrent re-scrapes
    const sourceIdsRef = useRef<string[]>([]);      // captured during loadPhotos for re-scrape

    // Wake Lock — keep the Portal screen alive while the slideshow runs
    useEffect(() => {
        let wakeLock: WakeLockSentinel | null = null;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                    // Re-acquire if the sentinel is released unexpectedly (e.g. power management)
                    wakeLock.addEventListener('release', () => {
                        requestWakeLock();
                    });
                }
            } catch {
                // Wake Lock request failed — device may not support it, or page isn't visible
            }
        };

        requestWakeLock();

        // Re-acquire wake lock when page becomes visible again (e.g. tab switch, screen unlock)
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            if (wakeLock) {
                wakeLock.release().catch(() => {});
            }
        };
    }, []); // Runs once on mount — completely independent of video/photo state

    // Clock — update every 30 seconds, 12-hour format
    useEffect(() => {
        if (!showClock && !usingFallback) return;

        const update = () => setClockTime(formatClock());
        update();
        const timer = setInterval(update, 30000);
        return () => clearInterval(timer);
    }, [showClock, usingFallback]);

    // Sleep schedule check — every minute
    useEffect(() => {
        const checkSleep = () => {
            if (!config.sleep_schedule?.enabled) {
                setSleeping(false);
                return;
            }
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            const { start, end } = config.sleep_schedule;

            if (start > end) {
                setSleeping(currentTime >= start || currentTime < end);
            } else {
                setSleeping(currentTime >= start && currentTime < end);
            }
        };

        checkSleep();
        const timer = setInterval(checkSleep, 60000);
        return () => clearInterval(timer);
    }, [config.sleep_schedule?.enabled, config.sleep_schedule?.start, config.sleep_schedule?.end]);

    // Track whether we've ever successfully loaded real user photos.
    // Once set, we never silently swap to fallback — the already-loaded CDN
    // URLs are not session-gated and will continue to work.
    const hasLoadedRealPhotosRef = useRef(false);

    // Fetch photos on mount — scrape fresh URLs per device session
    useEffect(() => {
        const loadPhotos = async () => {
            setLoading(true);
            setUsingFallback(false);

            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session?.user) {
                    // If we already have real photos loaded, keep them — the CDN
                    // URLs work independently of the Supabase session.  This
                    // prevents the silent swap to fallback that occurs when the
                    // auth token expires and onAuthStateChange triggers a re-render.
                    if (hasLoadedRealPhotosRef.current) {
                        DEBUG && console.log('[Slideshow] Session lost but real photos already loaded — keeping current photos.');
                        setLoading(false);
                        return;
                    }
                    setPhotos(shuffleArray(FALLBACK_PHOTOS));
                    setUsingFallback(true);
                    setLoading(false);
                    return;
                }

                // 1. Get source IDs for this feed
                let sourceIds: string[] = [];

                if (feed) {
                    const { data: feedSources } = await supabase
                        .from('feed_sources')
                        .select('source_id')
                        .eq('feed_id', feed.id);

                    if (feedSources && feedSources.length > 0) {
                        sourceIds = feedSources.map(fs => fs.source_id);
                    } else {
                        setPhotos(shuffleArray(FALLBACK_PHOTOS));
                        setUsingFallback(true);
                        setLoading(false);
                        return;
                    }
                } else {
                    // No feed specified — get all user sources
                    const { data: allSources } = await supabase
                        .from('sources')
                        .select('id');

                    if (allSources && allSources.length > 0) {
                        sourceIds = allSources.map(s => s.id);
                    } else {
                        setPhotos(shuffleArray(FALLBACK_PHOTOS));
                        setUsingFallback(true);
                        setLoading(false);
                        return;
                    }
                }

                // Save source IDs for potential re-scrape later
                sourceIdsRef.current = sourceIds;

                // 2. Call scrape-urls to get fresh CDN links for this device
                const response = await fetch('/api/scrape-urls', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourceIds }),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || `Scrape failed: ${response.status}`);
                }

                const { items } = await response.json();

                if (items && items.length > 0) {
                    const processedPhotos: Photo[] = items.map((item: any) => {
                        const isVideo = item.media_type === 'video';
                        let finalUrl = item.url;

                        if (item.url.includes('googleusercontent.com') && !item.url.includes('=')) {
                            finalUrl = `${item.url}=w1920-h1080`;
                        }

                        return {
                            id: item.external_id,
                            source_id: item.source_id,
                            media_type: (isVideo ? 'video' : 'image') as 'image' | 'video',
                            url: finalUrl,
                            video_url: isVideo ? (item.video_url || finalUrl) : null,
                        };
                    });

                    setPhotos(shuffle ? shuffleArray(processedPhotos) : processedPhotos);
                    hasLoadedRealPhotosRef.current = true;
                } else {
                    setPhotos(shuffleArray(FALLBACK_PHOTOS));
                    setUsingFallback(true);
                }
            } catch (err) {
                // If we already have real photos, keep them rather than swapping
                // to fallback mid-playback (the CDN URLs still work).
                if (hasLoadedRealPhotosRef.current) {
                    DEBUG && console.log('[Slideshow] Fetch failed but real photos already loaded — keeping current photos.');
                } else {
                    console.error('Failed to load photos, using fallback imagery:', err);
                    setPhotos(shuffleArray(FALLBACK_PHOTOS));
                    setUsingFallback(true);
                }
            }

            setLoading(false);
        };

        loadPhotos();
    }, [feed, shuffle]);

    // Transition duration in ms
    const TRANSITION_MS = transition === 'none' ? 0 : 1200;

    // Auto-advance with transition state
    const advance = useCallback(() => {
        if (photos.length <= 1) return;

        if (transition === 'none') {
            setCurrentIndex(prev => (prev + 1) % photos.length);
            return;
        }

        // Start the transition animation
        setIsTransitioning(true);

        // After animation completes, commit the index change
        transitionTimeoutRef.current = setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % photos.length);
            setIsTransitioning(false);
        }, TRANSITION_MS);
    }, [photos.length, transition, TRANSITION_MS]);

    // Background re-scrape — fetch fresh CDN URLs when stale URLs are detected
    const rescrape = useCallback(async () => {
        if (sourceIdsRef.current.length === 0) return;

        rescrapeInFlightRef.current = true;
        lastRescrapeRef.current = Date.now();
        rescrapeAttemptRef.current++;

        DEBUG && console.log(`[Slideshow] Re-scraping URLs (attempt ${rescrapeAttemptRef.current})...`);

        try {
            const response = await fetch('/api/scrape-urls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceIds: sourceIdsRef.current }),
            });

            if (!response.ok) throw new Error(`Re-scrape failed: ${response.status}`);

            const { items } = await response.json();

            if (items && items.length > 0) {
                const processedPhotos: Photo[] = items.map((item: any) => {
                    const isVideo = item.media_type === 'video';
                    let finalUrl = item.url;
                    if (item.url.includes('googleusercontent.com') && !item.url.includes('=')) {
                        finalUrl = `${item.url}=w1920-h1080`;
                    }
                    return {
                        id: item.external_id,
                        source_id: item.source_id,
                        media_type: (isVideo ? 'video' : 'image') as 'image' | 'video',
                        url: finalUrl,
                        video_url: isVideo ? (item.video_url || finalUrl) : null,
                    };
                });

                setPhotos(shuffle ? shuffleArray(processedPhotos) : processedPhotos);
                setCurrentIndex(0);
                failCountRef.current = 0;
                rescrapeAttemptRef.current = 0;
                DEBUG && console.log(`[Slideshow] Re-scrape succeeded — ${processedPhotos.length} fresh URLs loaded.`);
            }
        } catch (err) {
            console.warn('[Slideshow] Re-scrape failed, backoff will handle retry:', err);
        } finally {
            rescrapeInFlightRef.current = false;
        }
    }, [shuffle]);

    // Session keepalive — proactively refresh auth tokens so the slideshow never
    // gets logged out during long playback.  Active only when real user photos are
    // loaded (not fallback imagery).  If the session expires beyond recovery,
    // attempt a re-scrape to give the refresh-token path one more chance.  If that
    // also fails, photos stay on whatever was last loaded — no silent swap to
    // fallback mid-playback.
    const sessionExpiredReloadRef = useRef(false);
    useSessionKeepAlive(!loading && !usingFallback, () => {
        if (sessionExpiredReloadRef.current) return;
        sessionExpiredReloadRef.current = true;
        console.warn('[Slideshow] Session expired — attempting photo reload…');
        rescrape().finally(() => {
            sessionExpiredReloadRef.current = false;
        });
    });

    // Rate-limited re-scrape trigger — checks failure threshold + exponential backoff
    const maybeRescrape = useCallback(() => {
        // Don't re-scrape fallback images or if already in-flight
        if (usingFallback) return;
        if (rescrapeInFlightRef.current) return;
        if (failCountRef.current < 3) return;

        // Exponential backoff: 30s → 60s → 120s → 240s → 5min cap
        const backoffMs = Math.min(30_000 * Math.pow(2, rescrapeAttemptRef.current), 300_000);
        const elapsed = Date.now() - lastRescrapeRef.current;
        if (elapsed < backoffMs) return;

        rescrape();
    }, [usingFallback, rescrape]);

    // Preload the next item into browser cache (images only — videos stream on demand)
    // Also detects stale URLs one slide ahead so we can re-scrape before the user sees an error
    useEffect(() => {
        if (photos.length <= 1) return;
        const nextIdx = (currentIndex + 1) % photos.length;
        const nextItem = photos[nextIdx];
        if (nextItem.media_type !== 'video') {
            const img = new Image();
            img.referrerPolicy = 'no-referrer';
            img.onload = () => {
                failCountRef.current = 0;
            };
            img.onerror = () => {
                failCountRef.current++;
                maybeRescrape();
            };
            img.src = nextItem.url;
        }
    }, [currentIndex, photos, maybeRescrape]);

    // Cleanup transition timeout on unmount
    useEffect(() => {
        return () => {
            if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
        };
    }, []);

    // Reset video state and pause any playing video when the current item changes
    useEffect(() => {
        const current = photos[currentIndex];
        if (!current || current.media_type !== 'video') {
            setIsVideoPlaying(false);
        }
        // Pause the previous video if it's still playing (e.g. in 'interval' mode)
        if (videoRef.current && !current?.video_url) {
            videoRef.current.pause();
            videoRef.current = null;
        }
    }, [currentIndex, photos]);

    useEffect(() => {
        if (photos.length <= 1 || sleeping) return;
        // When a video is playing in 'full' mode, don't auto-advance — the video's onEnded handles it
        // In 'interval' mode, the timer keeps running and will cut the video at the normal interval
        if (isVideoPlaying && videoBehavior === 'full') return;

        const fallbackInterval = usingFallback ? 15000 : intervalTime;
        const timer = setInterval(advance, fallbackInterval);
        return () => clearInterval(timer);
    }, [photos.length, intervalTime, sleeping, advance, usingFallback, isVideoPlaying, videoBehavior]);

    // Current and next indices / photos
    const nextIdx = photos.length > 1 ? (currentIndex + 1) % photos.length : currentIndex;
    const currentPhoto = photos[currentIndex] || null;
    const nextPhoto = photos[nextIdx] || null;
    const showCredit = usingFallback && currentPhoto?.credit;
    const renderClock = (showClock && !usingFallback) || usingFallback;

    /**
     * Compute inline styles for the two layers based on transition type.
     * "current" = the photo on stage, "next" = the photo entering.
     * When isTransitioning is true, we animate from rest → active states.
     */
    const getLayerStyles = (layer: 'current' | 'next'): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'absolute',
            inset: 0,
            willChange: 'transform, opacity',
        };

        const dur = `${TRANSITION_MS}ms`;
        const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';

        switch (transition) {
            case 'crossfade':
                return {
                    ...base,
                    transition: `opacity ${dur} ${ease}`,
                    opacity: layer === 'current'
                        ? (isTransitioning ? 0 : 1)
                        : (isTransitioning ? 1 : 0),
                    zIndex: layer === 'next' ? 2 : 1,
                };

            case 'slide':
                if (layer === 'current') {
                    return {
                        ...base,
                        transition: `transform ${dur} ${ease}, opacity ${dur} ${ease}`,
                        transform: isTransitioning ? 'translateX(-100%)' : 'translateX(0)',
                        opacity: isTransitioning ? 0 : 1,
                        zIndex: 1,
                    };
                }
                return {
                    ...base,
                    transition: `transform ${dur} ${ease}, opacity ${dur} ${ease}`,
                    transform: isTransitioning ? 'translateX(0)' : 'translateX(100%)',
                    opacity: isTransitioning ? 1 : 0,
                    zIndex: 2,
                };

            case 'zoom-fade':
                if (layer === 'current') {
                    return {
                        ...base,
                        transition: `opacity ${dur} ${ease}`,
                        opacity: isTransitioning ? 0 : 1,
                        zIndex: 1,
                    };
                }
                return {
                    ...base,
                    transition: `transform ${dur} ${ease}, opacity ${dur} ${ease}`,
                    transform: isTransitioning ? 'scale(1)' : 'scale(1.15)',
                    opacity: isTransitioning ? 1 : 0,
                    zIndex: 2,
                };

            case 'push':
                if (layer === 'current') {
                    return {
                        ...base,
                        transition: `transform ${dur} ${ease}`,
                        transform: isTransitioning ? 'translateX(-100%)' : 'translateX(0)',
                        zIndex: 1,
                    };
                }
                return {
                    ...base,
                    transition: `transform ${dur} ${ease}`,
                    transform: isTransitioning ? 'translateX(0)' : 'translateX(100%)',
                    zIndex: 2,
                };

            case 'none':
            default:
                return {
                    ...base,
                    opacity: layer === 'current' ? 1 : 0,
                    zIndex: layer === 'current' ? 1 : 0,
                };
        }
    };

    if (loading) {
        return (
            <div className="absolute inset-0 w-full h-full bg-deep-space flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-electric-blue" />
            </div>
        );
    }

    /** Render a single photo/video layer (blurred bg + main content). */
    const renderPhotoLayer = (photo: Photo, isCurrent: boolean) => {
        const isVideo = photo.media_type === 'video' && photo.video_url;

        return (
            <>
                {/* Blurred Background Layer — use the thumbnail/image URL */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110"
                    style={{ backgroundImage: `url("${photo.url.replace(/["\\]/g, '\\$&')}")` }}
                />

                {isVideo ? (
                    /* Video element — streams directly from source (no proxy) */
                    <video
                        ref={isCurrent ? videoRef : undefined}
                        src={photo.video_url!}
                        className="absolute inset-0 w-full h-full z-10"
                        style={{ objectFit }}
                        autoPlay={isCurrent}
                        muted
                        playsInline
                        onPlay={(e) => {
                            if (isCurrent) {
                                failCountRef.current = 0; // successful load — reset stale detection
                                setIsVideoPlaying(true);
                                // Unmute after autoplay starts (browsers require muted for autoplay)
                                if (videoSound) {
                                    (e.target as HTMLVideoElement).muted = false;
                                }
                            }
                        }}
                        onEnded={() => {
                            if (isCurrent) {
                                setIsVideoPlaying(false);
                                // In 'full' mode, advance when video ends
                                // In 'interval' mode, the timer handles advancement
                                if (videoBehavior === 'full') advance();
                            }
                        }}
                        onError={() => {
                            if (isCurrent) {
                                failCountRef.current++;
                                maybeRescrape();
                                setIsVideoPlaying(false);
                                advance();
                            }
                        }}
                    />
                ) : (
                    /* Image element — loaded directly from source CDN */
                    <img
                        src={photo.url}
                        alt="Frame Content"
                        className="absolute inset-0 w-full h-full z-10"
                        style={{ objectFit }}
                        referrerPolicy="no-referrer"
                        onLoad={() => {
                            failCountRef.current = 0; // successful load — reset stale detection
                        }}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.dataset.retried) return;
                            target.dataset.retried = "true";
                            failCountRef.current++;
                            maybeRescrape();
                            advance();
                        }}
                    />
                )}
            </>
        );
    };

    return (
        <div className="absolute inset-0 w-full h-full bg-deep-space overflow-hidden z-0">
            {/* Current photo/video layer */}
            {currentPhoto && (
                <div style={getLayerStyles('current')} key={`current-${currentPhoto.id}`}>
                    {renderPhotoLayer(currentPhoto, true)}
                </div>
            )}

            {/* Next photo/video layer (only rendered when different from current) */}
            {nextPhoto && nextPhoto.id !== currentPhoto?.id && (
                <div style={getLayerStyles('next')} key={`next-${nextPhoto.id}`}>
                    {renderPhotoLayer(nextPhoto, false)}
                </div>
            )}

            {/* Clock Widget */}
            {renderClock && (
                <div
                    className="absolute z-40 pointer-events-none"
                    style={{
                        ...(clockPosition.includes('top') ? { top: '2rem' } : { bottom: '2rem' }),
                        ...(clockPosition.includes('right') ? { right: '2rem' } : { left: '2rem' }),
                        textAlign: clockPosition.includes('right') ? 'right' : 'left',
                    }}
                >
                    <div
                        className="font-clock text-white drop-shadow-lg"
                        style={{
                            fontSize: clockSize === 'small' ? '48px' : clockSize === 'large' ? '96px' : '72px',
                            fontWeight: 200,
                            letterSpacing: '0.04em',
                            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                        }}
                    >
                        {clockTime}
                    </div>
                </div>
            )}

            {/* Photo Credit — bottom-right, subtle */}
            {showCredit && currentPhoto.credit && (
                <div className="absolute top-6 left-6 z-40 pointer-events-none">
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(0,0,0,0.3)', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
                    >
                        <svg className="w-3 h-3 text-white/60 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                        </svg>
                        <span className="text-white/60 text-xs font-light tracking-wide">
                            {currentPhoto.credit.name}
                        </span>
                        <span className="text-white/30 text-xs font-light">
                            / Unsplash
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
