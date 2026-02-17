
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import defaultPhotos from '../data/photos.json';

const Slideshow = ({ interval = 10000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch photos on mount
    useEffect(() => {
        const loadPhotos = async () => {
            // 1. Fetch user's connected photos
            const { data: { session } } = await supabase.auth.getSession();

            let userPhotos = [];

            if (session?.user) {
                // Get all items from all active sources
                // We could filter by source status if needed, but source_items should only have valid ones?
                // Actually, source_items exist if they were scraped.

                const { data, error } = await supabase
                    .from('source_items')
                    .select('*')
                    .order('captured_at', { ascending: false })
                    .limit(100); // Limit for performance on low-end devices

                if (data && data.length > 0) {
                    userPhotos = data.map(item => ({
                        id: item.id,
                        url: item.url, // This assumes direct URL usage. 
                        // Note: Google Photos URLs might need size params, but usually work as is or we appened them in scraper.
                        // Scraper appended nothing, so we can append here if needed, or scraper stored full url.
                        // Cloud scraper stores full url. Google stores base url.
                        // If google, we might need to append =w2048-h2048.
                        // But we don't know the type here easily without a join. 
                        // However, appending =w... to a non-google url often does nothing or breaks.
                        // Safe bet: The scraper for google stored base url. 
                        // Let's assume we can try to detect or just use as is. 
                        // Actually, Google photos *require* params to render usually or they default to small?
                        // Base url usually redirects to a page or small image.
                        // Let's append =w1920-h1080 if it looks like a google url (lh3.googleusercontent...)

                        credit: 'Shared Album'
                    }));
                }
            }

            if (userPhotos.length > 0) {
                // Fix Google URLs if needed
                userPhotos = userPhotos.map(p => {
                    if (p.url.includes('googleusercontent.com') && !p.url.includes('=')) {
                        return { ...p, url: `${p.url}=w1920-h1080` };
                    }
                    return p;
                });
                setPhotos(userPhotos);
            } else {
                setPhotos(defaultPhotos);
            }
            setLoading(false);
        };

        loadPhotos();

        // Subscribe to changes? Maybe overkill for now.
    }, []);

    // Helper to check if an index is within the "window" of [current - 1, current, current + 1]
    const shouldRender = (index) => {
        if (photos.length < 3) return true; // Render all if few images

        const prev = (currentIndex - 1 + photos.length) % photos.length;
        const next = (currentIndex + 1) % photos.length;

        return index === currentIndex || index === prev || index === next;
    };

    const totalImages = photos.length;

    useEffect(() => {
        if (totalImages <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % totalImages);
        }, interval);

        return () => clearInterval(timer);
    }, [totalImages, interval]);

    if (loading) return <div style={{ backgroundColor: 'black', width: '100%', height: '100%' }} />;

    if (!photos || photos.length === 0) {
        return <div style={{ color: 'white', backgroundColor: 'black', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No photos available</div>;
    }

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: 'black',
            zIndex: 10
        }}>
            {photos.map((photo, index) => {
                if (!shouldRender(index)) return null;

                const isCurrent = index === currentIndex;

                return (
                    <img
                        key={photo.id}
                        src={photo.url}
                        alt={`Slide ${index}`}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: isCurrent ? 1 : 0,
                            transition: 'opacity 1s ease-in-out',
                            willChange: 'opacity',
                            pointerEvents: 'none'
                        }}
                    />
                );
            })}

            {/* Optional: Credit Overlay */}
            <div style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.8rem',
                zIndex: 20,
                textShadow: '0 1px 2px rgba(0,0,0,0.8)'
            }}>
                {photos[currentIndex].credit ? `Photo by ${photos[currentIndex].credit}` : ''}
            </div>
        </div>
    );
};

export default Slideshow;
