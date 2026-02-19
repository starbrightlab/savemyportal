import { NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2026-01-28.clover',
    });
}

/**
 * GET /api/stripe/price
 *
 * Returns the current Pro upgrade price and any active launch discount.
 * Used by the UI to display accurate pricing without hardcoding amounts.
 */
export async function GET() {
    try {
        const stripe = getStripe();
        const priceId = process.env.STRIPE_PRO_PRICE_ID!;
        const couponId = process.env.STRIPE_LAUNCH_COUPON_ID;

        // Fetch the base price
        const price = await stripe.prices.retrieve(priceId);
        const baseAmount = price.unit_amount ?? 0; // in cents
        const currency = price.currency;

        let discountedAmount: number | null = null;
        let discountPercent: number | null = null;
        let discountActive = false;

        // Check if launch coupon exists and is still valid
        if (couponId) {
            try {
                const coupon = await stripe.coupons.retrieve(couponId);
                if (coupon.valid) {
                    discountActive = true;
                    discountPercent = coupon.percent_off ?? null;
                    if (discountPercent && baseAmount) {
                        discountedAmount = Math.round(baseAmount * (1 - discountPercent / 100));
                    } else if (coupon.amount_off) {
                        discountedAmount = baseAmount - coupon.amount_off;
                    }
                }
            } catch {
                // Coupon doesn't exist or is invalid — no discount
            }
        }

        return NextResponse.json({
            basePrice: baseAmount / 100,         // e.g. 9.99
            currency,                            // e.g. "usd"
            discountActive,
            discountPercent,                     // e.g. 50
            finalPrice: discountActive && discountedAmount !== null
                ? discountedAmount / 100         // e.g. 4.99
                : baseAmount / 100,
        });
    } catch (error) {
        const errorMsg = (error as Error).message || String(error);
        console.error('Price fetch error:', errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
