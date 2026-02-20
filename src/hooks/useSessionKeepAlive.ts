"use client";

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const DEBUG = process.env.NODE_ENV === 'development';

/** How often to proactively refresh the session (10 minutes). */
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Keeps the Supabase auth session alive during long-running slideshow playback.
 *
 * The Supabase JS client only refreshes tokens lazily — i.e. on the next API call
 * after the access token expires.  During a slideshow, no Supabase calls are made
 * (photos cycle from an in-memory array), so both the access token and eventually
 * the refresh token can expire, causing an involuntary sign-out.
 *
 * This hook runs a silent `getSession()` call every 10 minutes.  `getSession()`
 * checks the in-memory session and, if the access token is expired or close to
 * expiry, automatically uses the refresh token to obtain a new access token.
 * If the automatic refresh fails, we fall back to an explicit `refreshSession()`
 * call.  If that also fails the session is truly dead and we invoke `onExpired`
 * so the caller can decide how to handle it (e.g. show a re-auth prompt rather
 * than silently falling back to stock photos).
 *
 * @param active  - Only run the keepalive loop when `true` (i.e. the user has
 *                  photos loaded and isn't using fallback imagery).
 * @param onExpired - Callback fired when the session cannot be recovered.
 */
export function useSessionKeepAlive(
    active: boolean,
    onExpired?: () => void,
) {
    const onExpiredRef = useRef(onExpired);
    onExpiredRef.current = onExpired;

    useEffect(() => {
        if (!active) return;

        const refresh = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (session && !error) {
                    DEBUG && console.log('[SessionKeepAlive] Session valid, expires at',
                        new Date((session.expires_at ?? 0) * 1000).toLocaleTimeString());
                    return;
                }

                // Session missing or error — attempt an explicit refresh
                DEBUG && console.warn('[SessionKeepAlive] Session stale, attempting explicit refresh…');
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

                if (refreshData.session && !refreshError) {
                    DEBUG && console.log('[SessionKeepAlive] Session refreshed successfully.');
                    return;
                }

                // Both paths failed — session is unrecoverable
                console.error('[SessionKeepAlive] Session expired and could not be refreshed.');
                onExpiredRef.current?.();
            } catch (err) {
                console.error('[SessionKeepAlive] Unexpected error during session refresh:', err);
            }
        };

        // Run immediately on activation so we catch already-stale sessions
        refresh();

        const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [active]);
}
