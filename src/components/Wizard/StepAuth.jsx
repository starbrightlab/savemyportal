import React from 'react';
import { useAuth } from '../../context/AuthContext';

const StepAuth = ({ onNext }) => {
    const { user, signInWithGoogle } = useAuth();

    // Auto-advance if already logged in
    React.useEffect(() => {
        if (user) {
            onNext();
        }
    }, [user, onNext]);

    return (
        <div className="flex flex-col items-center justify-center space-y-6">
            <h2 className="text-2xl font-bold text-white">Welcome to SaveMyPortal</h2>
            <p className="text-gray-300 text-center max-w-md">
                Turn your unused portal device into a beautiful, always-on digital picture frame.
            </p>
            <button
                onClick={signInWithGoogle}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
                Sign in with Google
            </button>
        </div>
    );
};

export default StepAuth;
