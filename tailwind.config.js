/** @type {import('tailwindcss').Config} */
// CRITICAL: Keep Tailwind v3.4. Create-react-app / Next.js < 15 do not support v4 reliably,
// and v4 relies on CSS layers @layer (Chrome 99+) which breaks on Portal (Chrome 98).
export default {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'sans-serif'],
                display: ['var(--font-outfit)', 'sans-serif'],
            },
            colors: {
                'deep-space': '#050505',
                'electric-blue': '#3b82f6',
                'soft-gold': '#fbbf24',
                'starlight': '#f3f4f6',
                'space-gray': '#9ca3af',
                'surface': 'rgba(255, 255, 255, 0.05)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 4s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
