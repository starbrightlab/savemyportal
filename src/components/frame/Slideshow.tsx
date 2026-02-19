"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Feed } from '@/types/feed';

interface Photo {
    id: string;
    source_id: string;
    url: string;
    credit?: {
        name: string;
        username: string;
    };
}

// Curated fallback scenic images from Unsplash (free to hotlink per Unsplash terms).
// Displayed when no user is signed in, no photos are available, or on fetch error.
// Credit metadata per Unsplash attribution guidelines.
const FALLBACK_PHOTOS: Photo[] = [
    { id: 'fb-1', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80', credit: { name: 'Bailey Zindel', username: 'baileyzindel' } },
    { id: 'fb-2', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80', credit: { name: 'Urban Vintage', username: 'urban_vintage' } },
    { id: 'fb-3', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920&q=80', credit: { name: 'Tim Swaan', username: 'timswaanphotography' } },
    { id: 'fb-4', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80', credit: { name: 'Robert Lukeman', username: 'robertlukeman' } },
    { id: 'fb-5', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1920&q=80', credit: { name: 'Blake Verdoorn', username: 'lakeverdoorn' } },
    { id: 'fb-6', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80', credit: { name: 'Pietro De Grandi', username: 'peter_mc_greats' } },
    { id: 'fb-7', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80', credit: { name: 'v2osk', username: 'v2osk' } },
    { id: 'fb-8', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1771387925581-cb0e1d64f506?w=1920&q=80', credit: { name: 'Daniel Akselrod', username: 'daniel_akserlod' } },
    { id: 'fb-9', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=1920&q=80', credit: { name: 'Rachel Cook', username: 'grafixgurl247' } },
    { id: 'fb-10', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1920&q=80', credit: { name: 'Ivana Cajina', username: 'von_co' } },
    { id: 'fb-11', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1563824299647-a84d608d85b8?w=1920&q=80', credit: { name: 'Tim Swaan', username: 'timswaanphotography' } },
    { id: 'fb-12', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1428452971006-b3dff82e3ca4?w=1920&q=80', credit: { name: 'Blake Verdoorn', username: 'lakeverdoorn' } },
    { id: 'fb-13', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1433086994863-5f3136c18a58?w=1920&q=80', credit: { name: 'Blake Verdoorn', username: 'lakeverdoorn' } },
    { id: 'fb-14', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1770932536808-bd67e5809870?w=1920&q=80', credit: { name: 'Alexey O', username: 'ao__space' } },
    { id: 'fb-15', source_id: 'fallback', url: 'https://images.unsplash.com/photo-1770106678115-ec9aa241cdf6?w=1920&q=80', credit: { name: 'Leo_Visions', username: 'leo_visions_' } },
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
    const shuffle = config.shuffle !== false; // default true

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

    // Fetch photos on mount — fall back to stock imagery if nothing is available
    useEffect(() => {
        const loadPhotos = async () => {
            setLoading(true);
            setUsingFallback(false);

            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session?.user) {
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
                        setPhotos(shuffleArray(FALLBACK_PHOTOS));
                        setUsingFallback(true);
                        setLoading(false);
                        return;
                    }
                }

                const { data, error } = await query;

                if (error) throw error;

                if (data && data.length > 0) {
                    const processedPhotos: Photo[] = data.map(item => {
                        let finalUrl = item.url;

                        if (item.url.includes('googleusercontent.com') && !item.url.includes('=')) {
                            finalUrl = `${item.url}=w1920-h1080`;
                        }

                        return {
                            id: item.id,
                            source_id: item.source_id,
                            url: `${process.env.NEXT_PUBLIC_IMAGE_CDN_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/proxy-image?url=${encodeURIComponent(finalUrl)}`
                        };
                    });

                    setPhotos(shuffle ? shuffleArray(processedPhotos) : processedPhotos);
                } else {
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

    // Current photo for credit overlay
    const currentPhoto = photos[currentIndex] || null;
    const showCredit = usingFallback && currentPhoto?.credit;
    const renderClock = (showClock && !usingFallback) || usingFallback;

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
            {renderClock && (
                <div className="absolute top-8 right-8 z-40 text-right pointer-events-none">
                    <div
                        className="font-clock text-white drop-shadow-lg"
                        style={{
                            fontSize: 'clamp(3rem, 8vw, 6rem)',
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
                <div className="absolute bottom-6 left-6 z-40 pointer-events-none">
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
