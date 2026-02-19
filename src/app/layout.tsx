import './globals.css';
import { Inter, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from './providers';
import QueryProvider from './query-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['200', '300'], variable: '--font-clock' });

export const metadata = {
    title: 'SaveMyPortal',
    description: 'Repurpose your Facebook Portal as a premium photo frame.',
    icons: {
        icon: '/savemyportal-logo-white.ico',
        apple: '/savemyportal-logo-white.png',
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
