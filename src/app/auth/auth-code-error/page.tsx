import Link from 'next/link';

export default function AuthCodeError() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white mb-2">Sign-in failed</h1>
                    <p className="text-sm text-gray-400">
                        Something went wrong during authentication. This can happen if the sign-in link expired or was already used.
                    </p>
                </div>
                <Link
                    href="/onboarding"
                    className="inline-block px-6 py-2.5 bg-electric-blue hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all"
                >
                    Try Again
                </Link>
            </div>
        </div>
    );
}
