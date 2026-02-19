"use client";

import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export default class FrameErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[FrameErrorBoundary] Caught error:', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 w-full h-full bg-deep-space flex flex-col items-center justify-center text-center px-8">
                    <p className="text-2xl text-gray-400 font-display mb-4">Something went wrong</p>
                    <p className="text-sm text-gray-600 mb-6">The frame encountered an error.</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-6 py-3 bg-electric-blue/20 text-electric-blue rounded-full font-medium hover:bg-electric-blue/30 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
