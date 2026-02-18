import React from 'react';
import { useAuth } from '@/context/AuthContext';

const StepAuth = ({ onNext }) => {
    const { user, signInWithGoogle } = useAuth();

    // Auto-advance if already logged in
    React.useEffect(() => {
        if (user) {
            onNext();
        }
    }, [user, onNext]);

    return (
        <div className="flex flex-col items-center justify-center space-y-8 text-center animate-fade-in">
            <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">Welcome</h2>
                <p className="text-gray-300 text-lg max-w-md mx-auto leading-relaxed">
                    Turn your unused portal device into a beautiful, always-on digital picture frame.
                </p>
            </div>

            <div className="p-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
                <button
                    onClick={signInWithGoogle}
                    className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold text-lg transition-all flex items-center gap-3 w-full justify-center"
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
