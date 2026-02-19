"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Feed } from '@/types/feed';

interface Photo {
    id: string;
    source_id: string;
    url: string;
}

// Curated fallback scenic images from Unsplash (free to hotlink per Unsplash terms).
// Displayed when no user is signed in, no photos are available, or on fetch error.
const FALLBACK_PHOTOS: Photo[] = [
    { id: 'fb-1', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80' },
    { id: 'fb-2', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80' },
    { id: 'fb-3', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920&q=80' },
    { id: 'fb-4', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80' },
    { id: 'fb-5', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1920&q=80' },
    { id: 'fb-6', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80' },
    { id: 'fb-7', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80' },
    { id: 'fb-8', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1465056836900-8f1e940b3b67?w=1920&q=80' },
    { id: 'fb-9', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=1920&q=80' },
    { id: 'fb-10', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1920&q=80' },
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
    const shuffle = config.shuffle !== false; // default true

    // Clock — update every 30 seconds
    useEffect(() => {
        if (!showClock) return;

        const update = () => {
            setClockTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        update();
        const timer = setInterval(update, 30000);
        return () => clearInterval(timer);
    }, [showClock]);

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

    // Fetch photos on mount — fall back to stock imagery if nothing is available
    useEffect(() => {
        const loadPhotos = async () => {
            setLoading(true);
            setUsingFallback(false);

            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session?.user) {
                    // No user — show fallback scenic imagery
                    setPhotos(shuffleArray(FALLBACK_PHOTOS));
                    setUsingFallback(true);
                    setLoading(false);
                    return;
                }

                let query = supabase
                    .from('source_items')
                    .select('*')
                    .order('captured_at', { ascending: false })
                    .limit(100);

                if (feed) {
                    const { data: feedSources } = await supabase
                        .from('feed_sources')
                        .select('source_id')
                        .eq('feed_id', feed.id);

                    if (feedSources && feedSources.length > 0) {
                        const sourceIds = feedSources.map(fs => fs.source_id);
                        query = query.in('source_id', sourceIds);
                    } else {
                        // Feed exists but has no sources — show fallback
                        setPhotos(shuffleArray(FALLBACK_PHOTOS));
                        setUsingFallback(true);
                        setLoading(false);
                        return;
                    }
                }

                const { data, error } = await query;

                if (error) throw error;

                if (data && data.length > 0) {
                    const processedPhotos = data.map(item => {
                        let finalUrl = item.url;

                        if (item.url.includes('googleusercontent.com') && !item.url.includes('=')) {
                            finalUrl = `${item.url}=w1920-h1080`;
                        }

                        return {
                            id: item.id,
                            source_id: item.source_id,
                            url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/proxy-image?url=${encodeURIComponent(finalUrl)}`
                        };
                    });

                    setPhotos(shuffle ? shuffleArray(processedPhotos) : processedPhotos);
                } else {
                    // Authenticated but no photos — show fallback
                    setPhotos(shuffleArray(FALLBACK_PHOTOS));
                    setUsingFallback(true);
                }
            } catch (err) {
                console.error('Failed to load photos, using fallback imagery:', err);
                setPhotos(shuffleArray(FALLBACK_PHOTOS));
                setUsingFallback(true);
            }

            setLoading(false);
        };

        loadPhotos();
    }, [feed, shuffle]);

    // Preload the next image into browser cache
    useEffect(() => {
        if (photos.length <= 1) return;
        const nextIdx = (currentIndex + 1) % photos.length;
        const img = new Image();
        img.src = photos[nextIdx].url;
    }, [currentIndex, photos]);

    // Auto-advance
    const advance = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % photos.length);
    }, [photos.length]);

    useEffect(() => {
        if (photos.length <= 1 || sleeping) return;

        const fallbackInterval = usingFallback ? 15000 : intervalTime;
        const timer = setInterval(advance, fallbackInterval);
        return () => clearInterval(timer);
    }, [photos.length, intervalTime, sleeping, advance, usingFallback]);

    // Indices to render — only current and next (2 DOM nodes instead of 100)
    const nextIdx = photos.length > 1 ? (currentIndex + 1) % photos.length : currentIndex;
    const visibleIndices = photos.length > 0
        ? (currentIndex === nextIdx ? [currentIndex] : [currentIndex, nextIdx])
        : [];

    if (loading) {
        return (
            <div className="absolute inset-0 w-full h-full bg-deep-space flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-electric-blue" />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full bg-deep-space overflow-hidden z-0">
            {visibleIndices.map((index) => {
                const photo = photos[index];
                return (
                    <div
                        key={photo.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {/* Blurred Background Layer */}
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110"
                            style={{ backgroundImage: `url(${photo.url})` }}
                        />

                        {/* Main Image */}
                        <img
                            src={photo.url}
                            alt="Frame Content"
                            className="absolute inset-0 w-full h-full z-10 transition-all duration-1000"
                            style={{ objectFit }}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.dataset.retried) return;
                                target.dataset.retried = "true";
                                advance();
                            }}
                        />
                    </div>
                );
            })}

            {/* Clock Widget */}
            {showClock && !usingFallback && (
                <div className="absolute top-8 right-8 z-40 text-right pointer-events-none">
                    <div className="text-6xl font-bold text-white drop-shadow-lg font-display">
                        {clockTime}
                    </div>
                </div>
            )}
        </div>
    );
}
