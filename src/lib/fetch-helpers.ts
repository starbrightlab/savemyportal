/**
 * Safely parse a JSON response, catching cases where the server (e.g. Netlify)
 * returns an HTML error page instead of JSON (typically a function timeout).
 *
 * Returns the parsed body, or throws a user-friendly error.
 */
export async function parseJsonResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type') || '';

    // If the response isn't JSON at all (e.g. Netlify HTML timeout page), don't
    // try to parse it — surface a clear timeout message instead.
    if (!contentType.includes('application/json')) {
        // Netlify returns 502/504 with HTML when the function exceeds the 60s limit.
        if (response.status === 502 || response.status === 504 || response.status >= 500) {
            throw new Error(
                'This album is too large to load right now. Try using a smaller album with fewer photos.'
            );
        }
        throw new Error(`Unexpected response (${response.status})`);
    }

    return response.json();
}
