import React, { useState, useEffect } from 'react';
import photos from '../data/photos.json';

const Slideshow = ({ interval = 10000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Hardware Constraint: Chrome 98 WebView on low-memory device.
    // Strategy: Sliding Window. Only render Prev, Current, Next.
    // We use a modular arithmetic approach to determine if an image should be in the DOM.

    const totalImages = photos.length;

    useEffect(() => {
        if (totalImages <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % totalImages);
        }, interval);

        return () => clearInterval(timer);
    }, [totalImages, interval]);

    // Helper to check if an index is within the "window" of [current - 1, current, current + 1]
    const shouldRender = (index) => {
        if (totalImages < 3) return true; // Render all if few images

        const prev = (currentIndex - 1 + totalImages) % totalImages;
        const next = (currentIndex + 1) % totalImages;

        return index === currentIndex || index === prev || index === next;
    };

    if (!photos || photos.length === 0) {
        return <div style={{ color: 'white' }}>No photos available</div>;
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
            zIndex: 10 // As per requirements: Above Heartbeat, Below Overlay (managed by Layout parent usually, but explicit here for safety)
        }}>
            {photos.map((photo, index) => {
                // Garbage Collection: strictly remove nodes not in window
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
                            willChange: 'opacity', // Hint to browser for compositing
                            pointerEvents: 'none' // Let clicks pass through if needed (though Layout handles taps)
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
                Photo by {photos[currentIndex].credit}
            </div>
        </div>
    );
};

export default Slideshow;
