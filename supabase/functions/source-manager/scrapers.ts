
export async function scrapeGooglePhotos(url: string) {
    console.log("Scraping Google Photos URL (Robust verified):", url);

    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Google Photos album: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Fetched HTML length: ${html.length}`);

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
                    console.log(`Found ${validPhotos.length} valid photos in callback key '${key}'`);
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
        return [];
    }

    const parsedItems = [];
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

        parsedItems.push({
            external_id: id,
            url: baseUrl,
            width: width,
            height: height,
            captured_at: timestamp
        });
    }

    console.log(`Total parsed items: ${parsedItems.length}`);
    return parsedItems;
}



export async function scrapeICloud(url: string) {
    console.log("Scraping iCloud URL (Robust):", url);

    // Extract token from URL (e.g. https://www.icloud.com/sharedalbum/#B0NGrq0zwGrap7)
    const tokenMatch = url.match(/#([a-zA-Z0-9]+)/);
    if (!tokenMatch || !tokenMatch[1]) {
        throw new Error("Invalid iCloud URL: Could not find album token");
    }
    const token = tokenMatch[1];

    // Default partition to start with
    const partition = 'p64';
    let streamUrl = `https://${partition}-sharedstreams.icloud.com/${token}/sharedstreams/webstream`;

    // Helper to fetch stream data
    const fetchStream = async (url: string) => {
        return await fetch(url, {
            method: 'POST',
            headers: {
                'Origin': 'https://www.icloud.com',
                'Content-Type': 'text/plain',
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            body: JSON.stringify({ streamCtag: null })
        });
    };

    let response = await fetchStream(streamUrl);
    let currentHost = `${partition}-sharedstreams.icloud.com`;

    // Handle 330 Redirect (wrong partition)
    if (response.status === 330 || (response.status >= 300 && response.status < 400)) {
        const newHost = response.headers.get('X-Apple-MMe-Host');
        if (newHost) {
            console.log(`Redirecting to new partition host: ${newHost}`);
            currentHost = newHost;
            streamUrl = `https://${newHost}/${token}/sharedstreams/webstream`;
            response = await fetchStream(streamUrl);
        }
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch iCloud stream: ${response.status}`);
    }

    const data = await response.json();
    const photos = data.photos;

    if (!photos || !Array.isArray(photos)) {
        console.log("No photos found in iCloud stream");
        return [];
    }

    console.log(`Found ${photos.length} raw photos in stream.`);

    // 2. Fetch Asset URLs
    const photoGuids = photos.map((p: any) => p.photoGuid);
    const assetUrlEndpoint = `https://${currentHost}/${token}/sharedstreams/webasseturls`;

    console.log(`Fetching asset URLs from: ${assetUrlEndpoint}`);

    const assetResponse = await fetch(assetUrlEndpoint, {
        method: 'POST',
        headers: {
            'Origin': 'https://www.icloud.com',
            'Content-Type': 'text/plain',
            'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: JSON.stringify({ photoGuids: photoGuids })
    });

    if (!assetResponse.ok) {
        throw new Error(`Failed to fetch asset URLs: ${assetResponse.status}`);
    }

    const assetData = await assetResponse.json();
    const locations = assetData.locations;
    const items = assetData.items;

    // Map to common format
    const parsedItems = photos.map((photo: any) => {
        const derivatives = photo.derivatives;
        if (!derivatives) return null;

        // Sort derivatives by width (descending) to get best quality
        const bestKey = Object.keys(derivatives).sort((a, b) => parseInt(b) - parseInt(a))[0];
        const best = derivatives[bestKey];

        if (!best) return null;

        // URL Construction using checksum lookup
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

        return {
            external_id: photo.photoGuid,
            url: finalUrl,
            width: parseInt(best.width),
            height: parseInt(best.height),
            captured_at: photo.dateCreated ? new Date(photo.dateCreated) : new Date()
        };
    }).filter((item: any) => item !== null);

    console.log(`Successfully resolved URLs for ${parsedItems.length} photos.`);
    return parsedItems;
}
