import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const StepCreateFeed = ({ onNext }) => {
    const { user } = useAuth();
    const [feedName, setFeedName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedName.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('feeds')
                .insert([{ user_id: user.id, name: feedName }])
                .select()
                .single();

            if (error) throw error;

            // Pass the created feed ID to the next step
            onNext({ feedId: data.id, feedName: data.name });
        } catch (err) {
            console.error("Error creating feed:", err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-8 w-full max-w-md mx-auto animate-fadeIn">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Name Your Frame</h2>
                <p className="text-gray-400">
                    Give your collection a name like "Living Room" or "Grandma's Frame".
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div>
                    <label htmlFor="feedName" className="block text-sm font-medium text-blue-400 mb-2 uppercase tracking-wider">
                        Feed Name
                    </label>
                    <input
                        type="text"
                        id="feedName"
                        value={feedName}
                        onChange={(e) => setFeedName(e.target.value)}
                        placeholder="e.g. Living Room"
                        className="w-full px-5 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="text-red-400 text-sm bg-red-900/20 p-4 rounded-xl border border-red-900/50 flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!feedName.trim() || isSubmitting}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-blue-500/20"
                >
                    {isSubmitting ? 'Creating...' : 'Continue'}
                </button>
            </form>
        </div>
    );
};

export default StepCreateFeed;
