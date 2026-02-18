"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import defaultPhotos from '@/data/photos.json';

export default function Hero() {
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
                    .limit(50);

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
        }, 10000);
        return () => clearInterval(interval);
    }, [photos.length]);

    return (
        <section className="relative w-full h-full flex items-center justify-center bg-black">
            {/* Background Slideshow */}
            {photos.map((photo, index) => (
                <div
                    key={photo.id || index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <img
                        src={photo.url}
                        alt="Background"
                        className="w-full h-full object-cover opacity-60"
                        referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-space via-transparent to-deep-space/40" />
                </div>
            ))}

            {/* Content Overlay */}
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in">
                <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-6 text-white text-glow">
                    <span className="text-electric-blue">Turn your Portal</span><br />
                    <span>into a Forever Frame.</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Repurpose your hardware. Display your memories. <br />
                    <span className="text-soft-gold font-medium">No forced deprecation.</span>
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/frame"
                        className="px-8 py-4 bg-electric-blue text-white rounded-full text-lg font-bold hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all transform hover:scale-105"
                    >
                        Start Frame
                    </Link>
                    <Link
                        href="/onboarding"
                        className="px-8 py-4 glass rounded-full text-lg font-medium hover:bg-white/10 transition-all border-white/20"
                    >
                        Setup / Onboard
                    </Link>
                </div>
            </div>

            {/* Photo Credit */}
            <div className="absolute bottom-6 right-6 text-xs text-white/40 z-20">
                Photo: {photos[currentIndex]?.credit || 'SaveMyPortal Collection'}
            </div>
        </section>
    );
}
