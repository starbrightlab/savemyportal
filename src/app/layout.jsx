import './globals.css';
import { Inter, Outfit } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
    title: 'SaveMyPortal',
    description: 'Repurpose your Facebook Portal as a premium photo frame.',
    icons: {
        icon: '/savemyportal-logo-white.ico',
        apple: '/savemyportal-logo-white.png',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${outfit.variable} font-sans bg-deep-space text-white antialiased overflow-hidden`}>
                <Providers>
                    <main className="relative w-screen h-screen overflow-hidden">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}
