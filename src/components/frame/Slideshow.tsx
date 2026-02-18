"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type FeedRow = Database['public']['Tables']['feeds']['Row'];

// Define locally what specific JSON config we expect
interface FeedConfig {
    interval?: number | string;
    fit?: 'cover' | 'contain';
    show_clock?: boolean;
    show_weather?: boolean;
    sleep_schedule?: {
        enabled: boolean;
        start: string;
        end: string;
    };
}

// Enhance the DB row with our parsed config type
export interface Feed extends Omit<FeedRow, 'config'> {
    config?: FeedConfig;
}

interface Photo {
    id: string;
    source_id: string;
    url: string;
    credit?: string;
}

interface SlideshowProps {
    user?: any; // To be strictly typed in next phase
    feed?: Feed | null;
}

export default function Slideshow({ feed }: SlideshowProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [photos, setPhotos] = useState<Photo[]>([]);

    // Default Config
    const config = feed?.config || {};
    const intervalTime = (typeof config.interval === 'string' ? parseInt(config.interval) : config.interval || 10) * 1000;
    const objectFit = config.fit || 'cover';
    const showClock = config.show_clock || false;
    const showWeather = config.show_weather || false;

    const [sleeping, setSleeping] = useState(false);

    // Check sleep status every minute
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
                // Spans midnight
                setSleeping(currentTime >= start || currentTime < end);
            } else {
                setSleeping(currentTime >= start && currentTime < end);
            }
        };

        checkSleep();
        const timer = setInterval(checkSleep, 60000);
        return () => clearInterval(timer);
    }, [config.sleep_schedule?.enabled, config.sleep_schedule?.start, config.sleep_schedule?.end]);

    // Fetch photos on mount
    useEffect(() => {
        const loadPhotos = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            let userPhotos: Photo[] = [];

            if (session?.user) {
                let query = supabase
                    .from('source_items')
                    .select('*')
                    .order('captured_at', { ascending: false })
                    .limit(100);

                // If a feed is provided, reject items not in this feed's sources
                if (feed) {
                    // 1. Get source IDs for this feed
                    const { data: feedSources } = await supabase
                        .from('feed_sources')
                        .select('source_id')
                        .eq('feed_id', feed.id);

                    if (feedSources && feedSources.length > 0) {
                        const sourceIds = feedSources.map(fs => fs.source_id);
                        query = query.in('source_id', sourceIds);
                    } else {
                        // Feed has no sources? Return empty or handle gracefully
                    }
                }

                const { data } = await query;

                if (data && data.length > 0) {
                    userPhotos = data.map(item => ({
                        id: item.id,
                        source_id: item.source_id,
                        url: item.url,
                        credit: 'Shared Album'
                    }));
                }
            }

            if (userPhotos.length > 0) {
                // Use Proxy for all images to avoid CORS/Referrer issues (especially iCloud/Google)
                // We construct the URL to point to our edge function
                const processedPhotos = userPhotos.map((p) => {
                    let finalUrl = p.url;

                    // Optimization for Google Photos (still useful even with proxy)
                    if (p.url.includes('googleusercontent.com') && !p.url.includes('=')) {
                        finalUrl = `${p.url}=w1920-h1080`;
                    }

                    return {
                        ...p,
                        // supabase.functions.invokeUrl is not directly exposed, so we build it manually
                        // standard format: https://[project-ref].supabase.co/functions/v1/proxy-image?url=[encoded_url]
                        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/proxy-image?url=${encodeURIComponent(finalUrl)}`
                    };
                });
                setPhotos(processedPhotos);
            }
        };

        loadPhotos();
    }, [feed]);

    // Auto-advance logic
    useEffect(() => {
        if (photos.length <= 1) return;
        if (sleeping) return; // Don't advance if sleeping

        const timer = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % photos.length);
        }, intervalTime);

        return () => clearInterval(timer);
    }, [photos.length, intervalTime, sleeping]);

    return (
        <div className="absolute inset-0 w-full h-full bg-deep-space overflow-hidden z-0">
            {photos.map((photo, index) => (
                <div
                    key={photo.id || index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                >
                    {/* Blurred Background Layer for Fill Effect */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110"
                        style={{ backgroundImage: `url(${photo.url})` }}
                    />

                    {/* Main Image */}
                    <img
                        src={photo.url}
                        alt="Frame Content"
                        className="absolute inset-0 w-full h-full z-10 transition-all duration-1000"
                        style={{ objectFit: objectFit }}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.log("Image failed to load:", photo.id);

                            // Prevent infinite loops on same image
                            if (target.dataset.retried) return;
                            target.dataset.retried = "true";

                            // Graceful degradation: Simply skip to the next slide
                            // This prevents the "white screen of death" or boot loops
                            const nextIndex = (currentImageIndex + 1) % photos.length;
                            setCurrentImageIndex(nextIndex);
                        }}
                    />
                </div>
            ))}

            {/* Widgets Layer */}
            <div className="absolute top-8 right-8 z-40 text-right pointer-events-none">
                {showClock && (
                    <div className="text-6xl font-bold text-white drop-shadow-lg font-display">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
                {showWeather && (
                    <div className="text-xl text-white/80 drop-shadow-md mt-1">
                        72°F Cloudy
                    </div>
                )}
            </div>
        </div>
    );
}
