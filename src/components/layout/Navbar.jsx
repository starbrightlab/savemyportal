import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass-nav">
            <div className="flex items-center gap-2">
                <Link href="/" className="text-2xl font-bold font-display text-white text-glow tracking-tight hover:opacity-80 transition-opacity">
                    SaveMyPortal
                </Link>
            </div>
            <div className="hidden md:flex items-center gap-8">
                <Link href="/mission" className="text-sm font-medium hover:text-electric-blue transition-colors text-gray-300">
                    Mission
                </Link>
                <Link href="/donate" className="text-sm font-medium hover:text-soft-gold transition-colors text-gray-300">
                    Donate
                </Link>
                <Link href="/dashboard" className="px-5 py-2 text-sm font-semibold rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10 hover:border-electric-blue/50 shadow-lg hover:shadow-electric-blue/20">
                    Dashboard
                </Link>
            </div>
            {/* Mobile Menu Placeholder - Portal is usually landscape tablet but can be small */}
        </nav>
    );
}
