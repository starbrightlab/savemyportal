import React, { useState } from 'react';
import StepAuth from '../components/Wizard/StepAuth';
import StepCreateFeed from '../components/Wizard/StepCreateFeed';
import StepAddSource from '../components/Wizard/StepAddSource';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
    const [step, setStep] = useState(0);
    const [feedId, setFeedId] = useState(null);
    const navigate = useNavigate();

    const handleAuthDone = () => {
        setStep(1);
    };

    const handleFeedCreated = ({ feedId }) => {
        setFeedId(feedId);
        setStep(2);
    };

    const handleComplete = () => {
        // Navigate to the main dashboard or slideshow
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8 px-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm 
                                ${step >= i ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                {i + 1}
                            </div>
                            {i < 2 && (
                                <div className={`w-16 h-1 mx-2 ${step > i ? 'bg-blue-600' : 'bg-gray-700'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
                    {step === 0 && <StepAuth onNext={handleAuthDone} />}
                    {step === 1 && <StepCreateFeed onNext={handleFeedCreated} />}
                    {step === 2 && <StepAddSource feedId={feedId} onComplete={handleComplete} />}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
