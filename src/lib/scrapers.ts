const DEBUG = process.env.NODE_ENV === 'development';

// iCloud webstream scales roughly linearly with album size (~50s for 1000 photos).
// Netlify imposes a hard 60s limit on synchronous functions, so we set the fetch
// timeout to 55s to leave headroom for the 330 redirect + URL resolution + response.
const ICLOUD_FETCH_TIMEOUT_MS = 55_000;
// Max photo GUIDs per webasseturls request to avoid iCloud timeouts on huge albums.
const ICLOUD_ASSET_BATCH_SIZE = 200;

// ---------------------------------------------------------------------------
// Webstream response cache — avoids re-fetching the same 50s iCloud response
// when multiple consumers (slideshow, dashboard, onboarding) scrape the same
// album in quick succession.
// ---------------------------------------------------------------------------
interface WebstreamCacheEntry {
    data: any;           // Raw webstream JSON response ({ photos, items, locations, … })
    currentHost: string; // Resolved iCloud partition host (after any 330 redirect)
    cachedAt: number;    // Date.now() timestamp
}

const webstreamCache = new Map<string, WebstreamCacheEntry>();
const WEBSTREAM_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Periodically evict expired entries so the Map doesn't grow unbounded.
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of webstreamCache) {
        if (now - entry.cachedAt > WEBSTREAM_CACHE_TTL_MS) {
            webstreamCache.delete(key);
        }
    }
}, 10 * 60 * 1000).unref?.(); // .unref() so the timer doesn't keep the process alive

export interface ScrapedItem {
    external_id: string;
    url: string;
    width: number;
    height: number;
    captured_at: Date;
    media_type: 'image' | 'video';
    video_url: string | null;
}

export interface ScrapeResult {
    items: ScrapedItem[];
    albumName: string | null;
}

export async function scrapeGooglePhotos(url: string): Promise<ScrapeResult> {
    DEBUG && console.log("Scraping Google Photos URL:", url);

    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Google Photos album: ${response.status}`);
    }

    const html = await response.text();
    DEBUG && console.log(`Fetched HTML length: ${html.length}`);

    // Extract album name from <title>Album Name - Google Photos</title>
    let albumName: string | null = null;
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
        const raw = titleMatch[1].replace(/\s*-\s*Google Photos\s*$/, '').trim();
        if (raw && raw !== 'Google Photos') albumName = raw;
    }
    DEBUG && console.log(`Album name: ${albumName}`);

    // Strategy: robust manual parsing
    const callbackRegex = /AF_initDataCallback\s*\(/g;
    let match;
    let foundItems: any[] = [];

    while ((match = callbackRegex.exec(html)) !== null) {
        const start = match.index;

        // Scan a reasonable window for the 'key'
        const headerSection = html.substring(start, start + 300);
        const keyMatch = headerSection.match(/key\s*:\s*['"]([^'"]+)['"]/);
        const key = keyMatch ? keyMatch[1] : "unknown";

        // Find "data:" starting from the callback start
        const dataRegex = /data\s*:\s*(\[)/;
        const dataMatch = html.substring(start, start + 100000).match(dataRegex);

        if (!dataMatch) {
            continue;
        }

        // Calculate absolute start index of the first '['
        const relativeDataStart = dataMatch.index!;
        const matchedString = dataMatch[0];
        const openBracketIndex = start + relativeDataStart + matchedString.lastIndexOf('[');

        // Manual bracket balancing
        let bracketCount = 0;
        let dataEndIndex = -1;
        let inString = false;
        let escaped = false;
        let quoteChar = '';

        for (let i = openBracketIndex; i < html.length; i++) {
            const char = html[i];

            if (!inString) {
                if (char === '[') {
                    bracketCount++;
                } else if (char === ']') {
                    bracketCount--;
                } else if (char === '"' || char === "'") {
                    inString = true;
                    quoteChar = char;
                }
            } else {
                if (char === '\\' && !escaped) {
                    escaped = true;
                } else if (char === quoteChar && !escaped) {
                    inString = false;
                } else {
                    escaped = false;
                }
            }

            if (bracketCount === 0) {
                dataEndIndex = i + 1;
                break;
            }
        }

        if (dataEndIndex === -1) {
            continue;
        }

        const jsonString = html.substring(openBracketIndex, dataEndIndex);

        try {
            const data = JSON.parse(jsonString);

            // Heuristic check
            if (data && Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
                const candidateItems = data[1];
                const validPhotos = candidateItems.filter((item: any) => {
                    return Array.isArray(item) && item.length >= 2 &&
                        Array.isArray(item[1]) && typeof item[1][0] === 'string';
                });

                if (validPhotos.length > 0) {
                    DEBUG && console.log(`Found ${validPhotos.length} valid photos in callback key '${key}'`);
                    foundItems = validPhotos;
                    break;
                }
            }
        } catch {
            // Ignore parse errors
        }
    }

    if (foundItems.length === 0) {
        console.warn("Regex failed to find any valid photo data.");
        return { items: [], albumName };
    }

    const parsedItems: ScrapedItem[] = [];
    for (const item of foundItems) {
        const id = item[0];
        const baseUrl = item[1][0];
        const width = item[1][1];
        const height = item[1][2];

        // Timestamp
        let timestamp = new Date();
        if (item[2]) {
            timestamp = new Date(parseInt(item[2]) || item[2]);
        }

        // Detect videos — wrapped in try/catch so detection failures default to 'image'
        //
        // Video URL strategy: we use the =m22 streaming suffix (720p MP4)
        // instead of =dv (raw download).  =dv redirects (302) to a separate
        // video-downloads host, serves the original container (often huge MOV
        // files), has no Accept-Ranges support, and sets Content-Disposition:
        // attachment — all of which break <video> streaming.  =m22 redirects
        // to googlevideo.com which serves a transcoded MP4 with
        // Accept-Ranges: bytes for seeking, and is typically ~20× smaller.
        //
        // IMPORTANT: The googlevideo.com endpoint checks the Referer header
        // against an allowlist (earl param) that only includes Google domains.
        // The <video> element MUST set referrerPolicy="no-referrer" to omit
        // the Referer header, otherwise the request returns 403 Forbidden.
        //
        // Why =m22 over =m37 (1080p)?  Google only generates transcodes up to
        // the source resolution.  =m37 returns 404 for videos below 1080p
        // (e.g. 720×1280 phone videos), while =m22 works reliably for any
        // source ≥ 720p — which covers virtually all modern phone/camera video.
        // The Slideshow component also has an onError fallback from =m22 to
        // =m18 (360p) for the rare sub-720p edge case.
        let media_type: 'image' | 'video' = 'image';
        let video_url: string | null = null;
        try {
            // Heuristic 1: item[1][3] is a number (video duration in µs)
            const possibleDuration = item[1]?.[3];
            if (typeof possibleDuration === 'number' && possibleDuration > 0) {
                media_type = 'video';
                video_url = `${baseUrl}=m22`;
            }

            // Heuristic 2: item[6] or nested arrays contain "video/" mime
            if (media_type === 'image') {
                const itemStr = JSON.stringify(item);
                if (itemStr.includes('"video/') || itemStr.includes("'video/")) {
                    media_type = 'video';
                    video_url = `${baseUrl}=m22`;
                }
            }

            // Heuristic 3: item[9] metadata object contains key "76647426" which
            // holds video-specific data (duration at [0] in ms, dimensions, etc.).
            // This key is absent for photos.
            if (media_type === 'image' && item[9] && typeof item[9] === 'object') {
                const videoMeta = item[9]['76647426'];
                if (Array.isArray(videoMeta) && typeof videoMeta[0] === 'number' && videoMeta[0] > 0) {
                    media_type = 'video';
                    video_url = `${baseUrl}=m22`;
                }
            }
        } catch (e) {
            console.warn('Video detection failed for item, defaulting to image:', e);
        }

        parsedItems.push({
            external_id: id,
            url: baseUrl,
            width: width,
            height: height,
            captured_at: timestamp,
            media_type,
            video_url,
        });
    }

    DEBUG && console.log(`Total parsed items: ${parsedItems.length}`);
    return { items: parsedItems, albumName };
}


export interface ScrapeICloudOptions {
    /** Skip the in-memory cache and fetch fresh data from iCloud. */
    bypassCache?: boolean;
}

export async function scrapeICloud(url: string, options?: ScrapeICloudOptions): Promise<ScrapeResult> {
    DEBUG && console.log("Scraping iCloud URL:", url);

    // Extract token from URL (e.g. https://www.icloud.com/sharedalbum/#B0NGrq0zwGrap7)
    const tokenMatch = url.match(/#([a-zA-Z0-9]+)/);
    if (!tokenMatch || !tokenMatch[1]) {
        throw new Error("Invalid iCloud URL: Could not find album token");
    }
    const token = tokenMatch[1];

    // 1. Check cache first (unless bypass requested)
    let data: any;
    let currentHost: string;
    const cacheKey = token;
    const cached = webstreamCache.get(cacheKey);

    if (!options?.bypassCache && cached && (Date.now() - cached.cachedAt < WEBSTREAM_CACHE_TTL_MS)) {
        DEBUG && console.log(`webstream cache HIT for token ${token} (age: ${Math.round((Date.now() - cached.cachedAt) / 1000)}s)`);
        data = cached.data;
        currentHost = cached.currentHost;
    } else {
        if (options?.bypassCache && cached) {
            webstreamCache.delete(cacheKey);
            DEBUG && console.log(`webstream cache BYPASSED for token ${token}`);
        }

        // Default partition to start with
        const partition = 'p64';
        let streamUrl = `https://${partition}-sharedstreams.icloud.com/${token}/sharedstreams/webstream`;

        // Helper to fetch stream data
        const fetchStream = async (streamEndpoint: string) => {
            try {
                return await fetch(streamEndpoint, {
                    method: 'POST',
                    headers: {
                        'Origin': 'https://www.icloud.com',
                        'Content-Type': 'text/plain',
                        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    },
                    body: JSON.stringify({ streamCtag: null }),
                    signal: AbortSignal.timeout(ICLOUD_FETCH_TIMEOUT_MS),
                });
            } catch (err: any) {
                if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
                    throw new Error(
                        'This album is too large to load right now. Try using a smaller album with fewer photos.'
                    );
                }
                throw err;
            }
        };

        let response = await fetchStream(streamUrl);
        currentHost = `${partition}-sharedstreams.icloud.com`;

        // Handle 330 Redirect (wrong partition)
        if (response.status === 330 || (response.status >= 300 && response.status < 400)) {
            const newHost = response.headers.get('X-Apple-MMe-Host');
            if (newHost) {
                DEBUG && console.log(`Redirecting to new partition host: ${newHost}`);
                currentHost = newHost;
                streamUrl = `https://${newHost}/${token}/sharedstreams/webstream`;
                response = await fetchStream(streamUrl);
            }
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch iCloud stream: ${response.status}`);
        }

        data = await response.json();

        // Populate cache on success (only if we got photos — empty responses aren't worth caching)
        if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
            webstreamCache.set(cacheKey, { data, currentHost, cachedAt: Date.now() });
            DEBUG && console.log(`webstream cache SET for token ${token} (${data.photos.length} photos)`);
        }
    }

    // Extract album name from webstream response
    const albumName: string | null = (typeof data.streamName === 'string' && data.streamName) ? data.streamName : null;
    DEBUG && console.log(`Album name: ${albumName}`);

    const photos = data.photos;

    if (!photos || !Array.isArray(photos)) {
        DEBUG && console.log("No photos found in iCloud stream");
        return { items: [], albumName };
    }

    DEBUG && console.log(`Found ${photos.length} raw photos in stream.`);

    // 2. Resolve asset URLs
    // The webstream response often already includes items/locations, so use those
    // first and only call webasseturls for any unresolved checksums.
    const locations: Record<string, any> = { ...(data.locations || {}) };
    const items: Record<string, any> = { ...(data.items || {}) };

    DEBUG && console.log(`webstream included ${Object.keys(items).length} items and ${Object.keys(locations).length} locations inline.`);

    // Collect all checksums we need and figure out which are missing
    const allChecksums = new Set<string>();
    for (const photo of photos) {
        const derivs = photo.derivatives || {};
        for (const key of Object.keys(derivs)) {
            if (derivs[key].checksum) allChecksums.add(derivs[key].checksum);
        }
    }
    const missingGuids: string[] = [];
    for (const photo of photos) {
        const derivs = photo.derivatives || {};
        const hasUnresolved = Object.keys(derivs).some(k => derivs[k].checksum && !items[derivs[k].checksum]);
        if (hasUnresolved) missingGuids.push(photo.photoGuid);
    }

    if (missingGuids.length > 0) {
        const assetUrlEndpoint = `https://${currentHost}/${token}/sharedstreams/webasseturls`;
        DEBUG && console.log(`Fetching asset URLs for ${missingGuids.length} unresolved photos (batches of ${ICLOUD_ASSET_BATCH_SIZE})`);

        for (let i = 0; i < missingGuids.length; i += ICLOUD_ASSET_BATCH_SIZE) {
            const batch = missingGuids.slice(i, i + ICLOUD_ASSET_BATCH_SIZE);
            DEBUG && console.log(`  Batch ${Math.floor(i / ICLOUD_ASSET_BATCH_SIZE) + 1}: ${batch.length} GUIDs`);

            let assetResponse: Response;
            try {
                assetResponse = await fetch(assetUrlEndpoint, {
                    method: 'POST',
                    headers: {
                        'Origin': 'https://www.icloud.com',
                        'Content-Type': 'text/plain',
                        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    },
                    body: JSON.stringify({ photoGuids: batch }),
                    signal: AbortSignal.timeout(ICLOUD_FETCH_TIMEOUT_MS),
                });
            } catch (err: any) {
                if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
                    throw new Error(
                        'This album is too large to load right now. Try using a smaller album with fewer photos.'
                    );
                }
                throw err;
            }

            if (!assetResponse.ok) {
                throw new Error(`Failed to fetch asset URLs: ${assetResponse.status}`);
            }

            const assetData = await assetResponse.json();

            if (!assetData.locations || !assetData.items) {
                console.warn("Asset response missing locations or items:", Object.keys(assetData));
            }

            Object.assign(locations, assetData.locations || {});
            Object.assign(items, assetData.items || {});
        }
    } else {
        DEBUG && console.log('All asset URLs resolved from webstream — skipping webasseturls.');
    }

    // Map to common format
    const parsedItems: ScrapedItem[] = photos.map((photo: any) => {
        const derivatives = photo.derivatives;
        if (!derivatives) return null;

        // Detect video items via mediaAssetType
        let isVideo = false;
        let videoDeriv: any = null;
        try {
            isVideo = photo.mediaAssetType === 'video';
        } catch { /* default to image */ }

        // Find the best (largest) image derivative and optionally the video derivative.
        // For video items we must separate these: the image derivative is used for the
        // thumbnail / blurred background, while the video derivative provides the
        // playback URL.  Without this split, the "best by width" logic can pick the
        // video file as the thumbnail when the video is wider than the poster image,
        // which breaks <img> and CSS background-image rendering.
        let best: any = null;

        const derivKeys = Object.keys(derivatives);
        for (const key of derivKeys) {
            const d = derivatives[key];
            // Video derivative detection — wrapped safely.
            // iCloud uses Apple UTI types (e.g. "com.apple.quicktime-movie",
            // "public.mpeg-4") and sometimes raw MIME types.  We also check
            // the url_path in items for video file extensions as a fallback.
            let isVideoDeriv = false;
            if (isVideo && d.fileType) {
                try {
                    const ft = d.fileType.toLowerCase();
                    if (ft.includes('movie') || ft.includes('video') || ft.includes('mp4')
                        || ft.includes('mpeg') || ft.includes('quicktime') || ft.includes('m4v')) {
                        videoDeriv = d;
                        isVideoDeriv = true;
                    }
                } catch { /* ignore */ }
            }
            // Secondary check: if fileType didn't match, check if this derivative's
            // resolved URL points to a video file (some iCloud responses omit fileType).
            if (isVideo && !isVideoDeriv && d.checksum) {
                try {
                    const dItemInfo = items[d.checksum];
                    if (dItemInfo?.url_path) {
                        const lp = dItemInfo.url_path.toLowerCase();
                        if (lp.includes('.mp4') || lp.includes('.mov') || lp.includes('.m4v')) {
                            videoDeriv = d;
                            isVideoDeriv = true;
                        }
                    }
                } catch { /* ignore */ }
            }
            // Only consider non-video derivatives for the thumbnail
            if (!isVideoDeriv) {
                if (!best || parseInt(d.width || '0') > parseInt(best.width || '0')) {
                    best = d;
                }
            }
        }

        // If every derivative was a video (unlikely, but defensive), fall back to
        // the video derivative itself so we don't return null.
        if (!best && videoDeriv) best = videoDeriv;

        if (!best) return null;

        // Build URL for the image/thumbnail (always use best for the thumbnail)
        const checksum = best.checksum;
        const itemInfo = items[checksum];

        if (!itemInfo) {
            console.warn(`No asset info found for checksum: ${checksum}`);
            return null;
        }

        const locationKey = itemInfo.url_location;
        const locationInfo = locations[locationKey];

        if (!locationInfo || !locationInfo.hosts || locationInfo.hosts.length === 0) {
            console.warn(`No location info found for key: ${locationKey}`);
            return null;
        }

        const host = locationInfo.hosts[0];
        const scheme = locationInfo.scheme || 'https';
        const urlPath = itemInfo.url_path;
        const finalUrl = `${scheme}://${host}${urlPath}`;

        // Build video URL if applicable — wrapped safely
        let video_url: string | null = null;
        if (isVideo && videoDeriv) {
            try {
                const videoChecksum = videoDeriv.checksum;
                const videoItemInfo = items[videoChecksum];
                if (videoItemInfo) {
                    const videoLocKey = videoItemInfo.url_location;
                    const videoLocInfo = locations[videoLocKey];
                    if (videoLocInfo?.hosts?.length > 0) {
                        video_url = `${videoLocInfo.scheme || 'https'}://${videoLocInfo.hosts[0]}${videoItemInfo.url_path}`;
                    }
                }
            } catch (e) {
                console.warn('Video URL resolution failed:', e);
            }
        }
        // Fallback: if this is a video but we couldn't build a separate video_url
        // (e.g. no video derivative was detected, or URL resolution failed), and
        // the thumbnail URL itself is a video file, use it as the video_url.
        // The Slideshow component handles this case by showing a black placeholder
        // instead of trying to load the .mp4 as an <img>.
        if (isVideo && !video_url) {
            const lowerUrl = finalUrl.toLowerCase();
            if (lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('.m4v')) {
                video_url = finalUrl;
            }
        }

        return {
            external_id: photo.photoGuid,
            url: finalUrl,
            width: parseInt(best.width || '0') || 0,
            height: parseInt(best.height || '0') || 0,
            captured_at: photo.dateCreated ? new Date(photo.dateCreated) : new Date(),
            media_type: (isVideo ? 'video' : 'image') as 'image' | 'video',
            video_url,
        };
    }).filter((item: any): item is ScrapedItem => item !== null);

    DEBUG && console.log(`Successfully resolved URLs for ${parsedItems.length} photos.`);
    return { items: parsedItems, albumName };
}
