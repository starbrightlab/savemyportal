import Link from 'next/link';

export const metadata = {
    title: 'Mission - SaveMyPortal',
    description: 'Why we are saving Facebok Portal devices from e-waste.',
};

export default function Mission() {
    return (
        <div className="min-h-screen pt-24 px-6 md:px-20 max-w-7xl mx-auto overflow-y-auto pb-20">
            <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-8">
                <span className="text-electric-blue">The Mission</span>
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
                    <p>
                        <strong className="text-white">The problem:</strong> Perfectly good hardware is being artificially obsoleted.
                        Meta's Portal devices feature high-quality screens, good speakers, and capable processors.
                        Yet, they are being turned into paperweights.
                    </p>
                    <p>
                        <strong className="text-white">Our goal:</strong> To provide a second life for these devices.
                        By repurposing them as premium, always-on photo frames and smart dashboards, we generate value
                        from what would otherwise be e-waste.
                    </p>
                    <p>
                        We are also advocating for the <strong className="text-soft-gold">Right to Repair</strong>.
                        We call on Meta to unlock the bootloaders of these devices so the community can maintain them forever.
                    </p>
                </div>

                <div className="glass-card p-8 flex flex-col items-center text-center justify-center space-y-6">
                    <h2 className="text-3xl font-bold font-display">Free The Hardware</h2>
                    <p className="text-gray-400">Join the campaign to pressure big tech into unlocking abandoned hardware.</p>
                    <div className="flex flex-col w-full gap-4">
                        <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all border border-white/10">
                            Sign the Petition (Coming Soon)
                        </button>
                        <Link href="/donate" className="w-full py-4 bg-soft-gold text-black rounded-xl font-bold hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all">
                            Support Development
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
