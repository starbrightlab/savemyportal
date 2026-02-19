import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/scrape (DEPRECATED)
 *
 * This endpoint has been replaced by /api/scrape-urls which returns URLs
 * directly without storing them in the database. Kept as a compatibility
 * stub — forwards single-source requests to the new endpoint.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const sourceId = body.sourceId;

        if (!sourceId) {
            return NextResponse.json({ error: 'Missing sourceId' }, { status: 400 });
        }

        // Forward to the new endpoint
        const url = new URL('/api/scrape-urls', request.url);
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: request.headers,
            body: JSON.stringify({ sourceIds: [sourceId] }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        // Return in the old format for compatibility
        return NextResponse.json({ success: true, count: data.count || 0 });

    } catch (error) {
        const errorMsg = (error as Error).message || String(error);
        console.error('Legacy scrape endpoint error:', errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
