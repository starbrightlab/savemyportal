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
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-black relative flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[100px]" />

            <div className="w-full max-w-2xl relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                        SaveMyPortal
                    </h1>
                    <p className="text-gray-400 text-sm tracking-wide uppercase">Setup Wizard</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8 px-12 relative">
                    {/* Line Background */}
                    <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-gray-800 -z-10" />

                    {[0, 1, 2].map((i) => (
                        <div key={i} className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                            ${step >= i
                                ? 'bg-black border-blue-500 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
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
                                ${step >= i ? 'text-blue-400' : 'text-gray-600'}`}>
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
                    {step === 2 && <StepAddSource feedId={feedId} onComplete={handleComplete} />}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
