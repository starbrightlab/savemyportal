"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import defaultPhotos from '@/data/photos.json';

export default function Slideshow({ speed = 10000 }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [photos, setPhotos] = useState(defaultPhotos);
    const [loading, setLoading] = useState(true);

    // Fetch photos on mount
    useEffect(() => {
        const loadPhotos = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            let userPhotos = [];

            if (session?.user) {
                const { data } = await supabase
                    .from('source_items')
                    .select('*')
                    .order('captured_at', { ascending: false })
                    .limit(100);

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
    }, []);

    // Rotation Timer
    useEffect(() => {
        if (photos.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % photos.length);
        }, speed);
        return () => clearInterval(interval);
    }, [photos.length, speed]);

    return (
        <div className="absolute inset-0 w-full h-full bg-deep-space overflow-hidden z-0">
            {photos.map((photo, index) => (
                <div
                    key={photo.id || index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                        }`}
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
                        className="absolute inset-0 w-full h-full object-contain z-10"
                        referrerPolicy="no-referrer"
                    />

                    {/* Photo Info (Optional - Can be hidden via props later) */}
                    {/* <div className="absolute bottom-6 right-6 text-white/60 text-sm font-medium z-20">
                        {photo.credit}
                    </div> */}
                </div>
            ))}
        </div>
    );
}
