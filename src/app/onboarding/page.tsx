"use client";

import React, { useState } from 'react';
import StepAuth from '@/components/Wizard/StepAuth';
import StepCreateFeed from '@/components/Wizard/StepCreateFeed';
import StepAddSource from '@/components/Wizard/StepAddSource';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const Onboarding = () => {
    const [step, setStep] = useState(0);
    const [feedId, setFeedId] = useState<string | null>(null);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth(); // Assuming useAuth exposes loading

    // Check for existing configuration
    React.useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setStep(0);
            return;
        }

        const checkConfig = async () => {
            // Check if user has any feeds
            const { data: feeds } = await supabase.from('feeds').select('id').eq('user_id', user.id).limit(1);

            if (feeds && feeds.length > 0) {
                // User has feeds, they are "onboarded". Redirect to home/dashboard.
                console.log("[Onboarding] User has existing configuration. Redirecting to home.");
                router.replace('/');
            } else {
                // User has no feeds, move to Step 1 (Create Feed)
                setStep(1);
            }
        };

        checkConfig();
    }, [user, authLoading, router]);

    const handleAuthDone = () => {
        // This might be redundant now if the useEffect handles it, but good for explicit "Next" clicks
        setStep(1);
    };

    const handleFeedCreated = (data: { feedId: string }) => {
        setFeedId(data.feedId);
        setStep(2);
    };

    const handleComplete = () => {
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-black relative flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-electric-blue/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-soft-gold/5 rounded-full blur-[100px]" />

            <div className="w-full max-w-2xl relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <img
                            src="/savemyportal-logo-white.svg"
                            alt="SaveMyPortal Logo"
                            className="w-24 h-24 drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                        />
                    </div>
                    <p className="text-gray-400 text-sm tracking-wide uppercase">Setup Wizard</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8 px-12 relative">
                    {/* Line Background */}
                    <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-gray-800 -z-10" />

                    {[0, 1, 2].map((i) => (
                        <div key={i} className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                            ${step >= i
                                ? 'bg-deep-space border-electric-blue text-electric-blue shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                : 'bg-black border-gray-700 text-gray-700'}`}>
                            {step > i ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <span className="font-semibold">{i + 1}</span>
                            )}

                            {/* Step Label */}
                            <div className={`absolute -bottom-8 text-xs font-medium whitespace-nowrap transition-colors duration-300
                                ${step >= i ? 'text-electric-blue' : 'text-space-gray'}`}>
                                {i === 0 && 'Account'}
                                {i === 1 && 'Create Feed'}
                                {i === 2 && 'Add Photos'}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Step Content Card */}
                <div className="bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-800/50 min-h-[400px] flex flex-col justify-center">
                    {step === 0 && <StepAuth onNext={handleAuthDone} />}
                    {step === 1 && <StepCreateFeed onNext={handleFeedCreated} />}
                    {step === 2 && feedId && <StepAddSource feedId={feedId} onComplete={handleComplete} />}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
