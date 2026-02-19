import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2026-01-28.clover',
    });
}

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events. Specifically listens for
 * `checkout.session.completed` to upgrade users to Pro tier.
 */
export async function POST(request: NextRequest) {
    const stripe = getStripe();
    let event: Stripe.Event;

    try {
        const body = await request.text();
        const sig = request.headers.get('stripe-signature');

        if (!sig) {
            return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
        }

        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        const errorMsg = (err as Error).message || String(err);
        console.error('Webhook signature verification failed:', errorMsg);
        return NextResponse.json({ error: `Webhook Error: ${errorMsg}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (!userId) {
            console.error('Webhook: checkout.session.completed missing user_id in metadata');
            return NextResponse.json({ error: 'Missing user_id in session metadata' }, { status: 400 });
        }

        // Update user profile to Pro
        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPERBASE_SERVICE_ROLE_KEY!
        );

        // Upsert instead of update — creates the row if the signup trigger
        // didn't fire (e.g. user signed up before the migration was applied)
        const { error: updateError } = await serviceClient
            .from('user_profiles')
            .upsert({
                user_id: userId,
                tier: 'pro',
                stripe_payment_id: session.id,
                upgraded_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (updateError) {
            console.error('Webhook: Failed to update user profile:', updateError);
            return NextResponse.json({ error: 'Failed to update user tier' }, { status: 500 });
        }

        console.log(`User ${userId} upgraded to Pro via Stripe session ${session.id}`);
    }

    return NextResponse.json({ received: true });
}
