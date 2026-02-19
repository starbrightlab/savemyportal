import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';
import type { Database } from '@/lib/database.types';

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2026-01-28.clover',
    });
}

/**
 * POST /api/stripe/create-checkout
 *
 * Creates a Stripe Checkout Session for the one-time Pro upgrade.
 * Returns: { url: string } — the Checkout URL to redirect to.
 */
export async function POST(request: NextRequest) {
    try {
        const stripe = getStripe();

        // 0. Parse optional promo code from request body
        let promoCode: string | undefined;
        try {
            const body = await request.json();
            promoCode = body?.promoCode;
        } catch {
            // No body or invalid JSON — that's fine, proceed without promo code
        }

        // 1. Authenticate via cookies
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { allowed } = checkRateLimit(`checkout:${user.id}`, { maxRequests: 3 });
        if (!allowed) {
            return NextResponse.json({ error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
        }

        // 2. Check that user is currently on free tier
        const serviceClient = createServiceClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: profile } = await serviceClient
            .from('user_profiles')
            .select('tier')
            .eq('user_id', user.id)
            .single();

        if (profile?.tier === 'pro') {
            return NextResponse.json({ error: 'Already on Pro tier' }, { status: 400 });
        }

        // 3. Build the Checkout Session
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || '';

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [{
                price: process.env.STRIPE_PRO_PRICE_ID!,
                quantity: 1,
            }],
            metadata: {
                user_id: user.id,
            },
            success_url: `${origin}/dashboard?upgrade=success`,
            cancel_url: `${origin}/dashboard`,
        };

        // Apply discount: custom promo code takes priority, otherwise auto-apply launch coupon
        if (promoCode) {
            // Look up the promotion code to get its Stripe ID
            const promoCodes = await stripe.promotionCodes.list({
                code: promoCode,
                active: true,
                limit: 1,
            });
            if (promoCodes.data.length > 0) {
                sessionParams.discounts = [{ promotion_code: promoCodes.data[0].id }];
            } else {
                return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 400 });
            }
        } else if (process.env.STRIPE_LAUNCH_COUPON_ID) {
            sessionParams.discounts = [{ coupon: process.env.STRIPE_LAUNCH_COUPON_ID }];
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error('Create Checkout Error:', (error as Error).message || error);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
