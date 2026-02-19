import './globals.css';
import { Inter, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from './providers';
import QueryProvider from './query-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['200', '300'], variable: '--font-clock' });

export const metadata = {
    title: 'SaveMyPortal — Bring Your Portal Photo Frame Back to Life',
    description: 'Meta killed your Portal photo frame. We brought it back. Turn your Facebook Portal into a beautiful slideshow again with Google Photos or iCloud — no jailbreaking required.',
    keywords: ['Facebook Portal', 'Meta Portal', 'photo frame', 'digital photo frame', 'Portal photos', 'Portal alternative', 'SaveMyPortal'],
    authors: [{ name: 'Starbright Lab', url: 'https://starbrightlab.com' }],
    creator: 'Starbright Lab',
    publisher: 'Starbright Lab',
    icons: {
        icon: '/savemyportal-logo-white.ico',
        apple: '/savemyportal-logo-white.png',
    },
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://savemyportal.com',
        siteName: 'SaveMyPortal',
        title: 'Your Portal Isn\'t Dead. We Saved It.',
        description: 'Meta killed your Portal photo frame. We brought it back. Turn your Facebook Portal into a beautiful slideshow again — no jailbreaking, no technical knowledge needed.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'SaveMyPortal - Restore your Portal photo frame',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Your Portal Isn\'t Dead. We Saved It.',
        description: 'Meta killed your Portal photo frame. We brought it back. Turn your Facebook Portal into a beautiful slideshow again — free.',
        images: ['/og-image.png'],
        creator: '@starbrightlab',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
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
