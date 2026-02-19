import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Upgrade - SaveMyPortal',
    description: 'Upgrade to SaveMyPortal Pro for unlimited feeds, video support, and full customisation.',
};

// Redirect /donate to /upgrade for backward compatibility
export default function Donate() {
    redirect('/upgrade');
}
