import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface StepAuthProps {
    onNext: () => void;
}

const StepAuth = ({ onNext }: StepAuthProps) => {
    const { user, signInWithGoogle } = useAuth();
    const [accepted, setAccepted] = React.useState(false);

    // Auto-advance logic with Consent Recording
    React.useEffect(() => {
        const recordConsent = async () => {
            console.log(`[StepAuth] Checking user: ${user?.id}`);
            if (user) {
                // Check for pending consent from pre-redirect
                const pending = localStorage.getItem('savemyportal_pending_consent');
                console.log(`[StepAuth] Pending consent: ${pending}`);

                if (pending === 'true') {
                    try {
                        const { error } = await supabase
                            .from('user_consents')
                            .insert({
                                user_id: user.id,
                                agreed_to_terms: true,
                                agreed_to_privacy: true,
                                agreed_at: new Date().toISOString()
                            });

                        if (error) console.error('Error recording consent:', error);
                        localStorage.removeItem('savemyportal_pending_consent');
                    } catch (err) {
                        console.error('Consent recording failed:', err);
                    }
                }
                console.log("[StepAuth] User authenticated, calling onNext()");
                onNext();
            }
        };

        recordConsent();
    }, [user, onNext]);

    const handleSignIn = async () => {
        if (!accepted) return;
        console.log("[StepAuth] Initiating Google Sign-In");
        localStorage.setItem('savemyportal_pending_consent', 'true');
        await signInWithGoogle();
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-8 text-center animate-fade-in">
            <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">Welcome</h2>
                <p className="text-gray-300 text-lg max-w-md mx-auto leading-relaxed">
                    Turn your unused portal device into a beautiful, always-on digital picture frame.
                </p>
            </div>

            <div className="w-full max-w-sm mx-auto mb-6">
                <label className="flex items-start gap-3 text-left p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="relative flex items-center mt-1">
                        <input
                            type="checkbox"
                            className="peer h-4 w-4 appearance-none rounded border border-gray-600 bg-transparent checked:border-electric-blue checked:bg-electric-blue focus:outline-none transition-all"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                        />
                        <svg className="absolute w-3 h-3 text-black pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5 top-0.5" viewBox="0 0 14 14" fill="none">
                            <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors select-none">
                        I agree to the <a href="/terms" target="_blank" className="text-electric-blue hover:text-blue-400 underline decoration-blue-500/30">Terms</a> and <a href="/privacy" target="_blank" className="text-electric-blue hover:text-blue-400 underline decoration-blue-500/30">Privacy Policy</a>
                    </span>
                </label>
            </div>

            <div className={`p-1 rounded-xl transition-all duration-300 ${accepted ? 'bg-electric-blue' : 'bg-gray-800 opacity-50 cursor-not-allowed'}`}>
                <button
                    onClick={handleSignIn}
                    disabled={!accepted}
                    className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold text-lg transition-all flex items-center gap-3 w-full justify-center disabled:cursor-not-allowed"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                    </svg>
                    Sign in with Google
                </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
                Secure authentication powered by Supabase
            </p>
        </div>
    );
};

export default StepAuth;
