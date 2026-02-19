"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { TierName } from '@/lib/tier-limits';

interface TierContextType {
    tier: TierName;
    isPro: boolean;
    loading: boolean;
    refetchTier: () => void;
}

const TierContext = createContext<TierContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useTier = () => {
    const context = useContext(TierContext);
    if (context === undefined) {
        throw new Error('useTier must be used within a TierProvider');
    }
    return context;
};

interface TierProviderProps {
    children: ReactNode;
}

export const TierProvider = ({ children }: TierProviderProps) => {
    const { user } = useAuth();
    const [tier, setTier] = useState<TierName>('free');
    const [loading, setLoading] = useState(true);

    const fetchTier = useCallback(async (retries = 2) => {
        if (!user) {
            setTier('free');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('tier')
                .eq('user_id', user.id)
                .single();

            if (error) {
                // Profile might not exist yet (trigger hasn't fired, or race condition).
                // Retry briefly before defaulting to free.
                if (retries > 0) {
                    await new Promise(r => setTimeout(r, 1000));
                    return fetchTier(retries - 1);
                }
                console.warn('Could not fetch user profile, defaulting to free tier:', error.message);
                setTier('free');
            } else {
                setTier((data.tier as TierName) || 'free');
            }
        } catch (err) {
            console.error('Error fetching tier:', err);
            setTier('free');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTier();
    }, [fetchTier]);

    const value: TierContextType = {
        tier,
        isPro: tier === 'pro',
        loading,
        refetchTier: fetchTier,
    };

    return (
        <TierContext.Provider value={value}>
            {children}
        </TierContext.Provider>
    );
};
