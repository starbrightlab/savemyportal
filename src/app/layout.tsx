import './globals.css';
import { Inter, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from './providers';
import QueryProvider from './query-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['200', '300'], variable: '--font-clock' });

export const metadata = {
    metadataBase: new URL('https://savemyportal.com'),
    title: 'SaveMyPortal — Memories Live On. Your Device Should Too.',
    description: 'Turn any screen into a beautiful digital frame. Free forever, no tech skills needed. Works with Google Photos and iCloud.',
    keywords: ['digital photo frame', 'photo frame app', 'smart display', 'photo slideshow', 'SaveMyPortal'],
    authors: [{ name: 'Starbright Lab', url: 'https://starbrightlab.com' }],
    icons: {
        icon: '/savemyportal-logo-white.ico',
        apple: '/savemyportal-logo-white.png',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://savemyportal.com',
        siteName: 'SaveMyPortal',
        title: 'Memories Live On. Your Device Should Too.',
        description: 'Turn any screen into a beautiful digital frame. Free forever, no tech skills needed.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'SaveMyPortal - Digital photo frame for any screen',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Memories Live On. Your Device Should Too.',
        description: 'Turn any screen into a beautiful digital frame. Free forever.',
        images: ['/og-image.png'],
    },
};

import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${outfit.variable} ${jakarta.variable} font-sans bg-deep-space text-white antialiased`}>
                <Providers>
                    <QueryProvider>
                        <main className="relative min-h-screen">
                            {children}
                        </main>
                    </QueryProvider>
                </Providers>
            </body>
        </html>
    );
}
