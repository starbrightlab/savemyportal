"use client";

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { TierProvider } from '@/context/TierContext';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <AuthProvider>
            <TierProvider>
                {children}
            </TierProvider>
        </AuthProvider>
    );
}
