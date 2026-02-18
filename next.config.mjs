/** @type {import('next').NextConfig} */
// CRITICAL: Must maintain compatibility with Chrome 98 (Portal Gen 2 Hardware).
// Do not upgrade to Next.js 15+ or React 19 until hardware support is verified.
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'vtobgufxfjhwrzmqqqtv.supabase.co',
            },
        ],
    },
};

export default nextConfig;
