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
        <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white">Create Your First Feed</h2>
            <p className="text-gray-300 text-center">
                A "Feed" is a collection of photos that will play on your device. Give it a name like "Living Room" or "Grandma's Frame".
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div>
                    <label htmlFor="feedName" className="block text-sm font-medium text-gray-300 mb-1">
                        Feed Name
                    </label>
                    <input
                        type="text"
                        id="feedName"
                        value={feedName}
                        onChange={(e) => setFeedName(e.target.value)}
                        placeholder="e.g. Living Room"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!feedName.trim() || isSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                    {isSubmitting ? 'Creating...' : 'Create Feed'}
                </button>
            </form>
        </div>
    );
};

export default StepCreateFeed;
