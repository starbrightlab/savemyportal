"use client";

import { useAuth } from '@/context/AuthContext';
import Hero from '@/components/home/Hero';
import ReadyState from '@/components/home/ReadyState';

export default function Home() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-electric-blue border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    // New "Reduced Click" Logic
    if (user) {
        return <ReadyState />;
    }

    return <Hero />;
}
