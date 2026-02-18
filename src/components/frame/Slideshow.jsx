"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import defaultPhotos from '@/data/photos.json';

export default function Slideshow({ user, feed }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Default Config
    const config = feed?.config || {};
    const intervalTime = (config.interval || 10) * 1000;
    const objectFit = config.fit || 'cover';
    const showClock = config.show_clock || false;
    const showWeather = config.show_weather || false;

    // Sleep Schedule Logic
    const isSleeping = () => {
        if (!config.sleep_schedule?.enabled) return false;
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const { start, end } = config.sleep_schedule;

        if (start > end) {
            // Spans midnight (e.g. 22:00 to 07:00)
            return currentTime >= start || currentTime < end;
        } else {
            // Standard (e.g. 09:00 to 17:00)
            return currentTime >= start && currentTime < end;
        }
    };

    const [sleeping, setSleeping] = useState(false);

    // Check sleep status every minute
    useEffect(() => {
        const checkSleep = () => setSleeping(isSleeping());
        checkSleep();
        const timer = setInterval(checkSleep, 60000);
        return () => clearInterval(timer);
    }, [feed]);

    // Fetch photos on mount
    useEffect(() => {
        const loadPhotos = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            let userPhotos = [];

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
                        // query = query.in('source_id', []); // This would return 0 items
                    }
                }

                const { data } = await query;

                if (data && data.length > 0) {
                    userPhotos = data.map(item => ({
                        id: item.id,
                        url: item.url,
                        credit: 'Shared Album'
                    }));
                }
            }

            if (userPhotos.length > 0) {
                // Optimize Google Photos URLs
                userPhotos = userPhotos.map(p => {
                    if (p.url && p.url.includes('googleusercontent.com') && !p.url.includes('=')) {
                        return { ...p, url: `${p.url}=w1920-h1080` };
                    }
                    return p;
                });
                setPhotos(userPhotos);
            }
            setLoading(false);
        };

        loadPhotos();
    }, [feed]);

    // Auto-advance slideshow
    useEffect(() => {
        if (photos.length <= 1 || sleeping) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % photos.length);
        }, intervalTime);

        return () => clearInterval(interval);
    }, [photos, intervalTime, sleeping]);

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
