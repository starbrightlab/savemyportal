import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import type { Database } from '@/lib/database.types';

export async function POST() {
    try {
        // 1. Authenticate via cookies
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { allowed } = checkRateLimit(`delete:${user.id}`, { maxRequests: 1 });
        if (!allowed) {
            return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
        }

        console.log(`Deleting account for user: ${user.id}`);

        // 2. Delete user via admin API (requires service role key)
        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error('Failed to delete user:', deleteError);
            throw new Error('Failed to delete account');
        }

        console.log(`Account deleted successfully: ${user.id}`);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete Account Error:", error);
        return NextResponse.json(
            { error: 'Failed to delete account. Please try again.' },
            { status: 500 }
        );
    }
}
