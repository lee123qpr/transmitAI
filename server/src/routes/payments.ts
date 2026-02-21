import express from 'express';
import Stripe from 'stripe';
import pool from '../db';

const router = express.Router();
console.log('Payment routes module loaded');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any, // Cast to any to bypass strict type check if types are outdated
});

import { createUser, getUser } from '../services/userService';

// Create Checkout Session
router.post('/create-checkout-session', async (req, res) => {
    const { userId, email, returnUrl, planType } = req.body;

    if (!userId || !email) {
        res.status(400).json({ error: 'Missing userId or email' });
        return;
    }

    try {
        // Ensure user exists in DB before starting checkout
        // This prevents webhook failures where the user record doesn't exist yet
        let user = await getUser(userId);
        if (!user) {
            console.log(`[Payment] Creating missing user ${userId} before checkout`);
            user = await createUser(userId, email);
        }

        // Map plan type to correct Stripe price ID
        let priceId: string | undefined;
        if (planType === 'pro_monthly') {
            priceId = process.env.STRIPE_PRICE_ID_PRO_MONTHLY;
        } else if (planType === 'pro_yearly') {
            priceId = process.env.STRIPE_PRICE_ID_PRO_YEARLY;
        } else if (planType === 'business_monthly') {
            priceId = process.env.STRIPE_PRICE_ID_BUSINESS_MONTHLY;
        } else if (planType === 'business_yearly') {
            priceId = process.env.STRIPE_PRICE_ID_BUSINESS_YEARLY;
        }

        if (!priceId) {
            console.error('Price ID not configured for plan:', planType);
            res.status(500).json({ error: 'Price ID not configured' });
            return;
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${returnUrl}/app/payment/success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
            cancel_url: `${returnUrl}/app/payment/cancel`,
            metadata: {
                userId: userId,
                planType: planType || 'pro'
            },
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create Portal Session
router.post('/create-portal-session', async (req, res) => {
    const { userId, returnUrl } = req.body;

    if (!userId) {
        res.status(400).json({ error: 'Missing userId' });
        return;
    }

    try {
        // In a real app, look up customers by email if userId mapping isn't set up yet
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Missing email' });
            return;
        }

        const customers = await stripe.customers.list({
            email: email,
            limit: 1,
        });

        let customerId;
        if (customers.data.length > 0) {
            customerId = customers.data[0].id;
        } else {
            res.status(404).json({ error: 'No subscription found' });
            return;
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe Portal Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify Session & Upgrade User
// This is the RELIABLE approach in serverless - we pull directly from Stripe
// instead of waiting for a webhook push that may be dropped.
router.post('/verify-session', async (req, res) => {
    const { sessionId, userId } = req.body;

    if (!sessionId || !userId) {
        return res.status(400).json({ error: 'Missing sessionId or userId' });
    }

    // Guard: fail fast if Stripe key is missing
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('[Payment] CRITICAL: STRIPE_SECRET_KEY is not set!');
        return res.status(500).json({ error: 'Payment service not configured on server' });
    }

    try {
        console.log(`[Payment] Verifying session ${sessionId} for user ${userId}`);
        console.log(`[Payment] Stripe key prefix: ${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...`);

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        console.log(`[Payment] Session status: ${session.status}, payment_status: ${session.payment_status}, metadata: ${JSON.stringify(session.metadata)}`);

        // Only upgrade if payment was actually completed
        if (session.status !== 'complete' || session.payment_status !== 'paid') {
            return res.json({ success: false, message: `Payment not complete. Status: ${session.status}, payment_status: ${session.payment_status}` });
        }

        // Verify the session belongs to this user (security check)
        const sessionUserId = session.metadata?.userId;
        if (sessionUserId && sessionUserId !== userId) {
            console.warn(`[Payment] User mismatch: session=${sessionUserId}, requested=${userId}`);
            return res.status(403).json({ error: 'Session does not belong to this user' });
        }

        // Determine plan from metadata
        const planType = session.metadata?.planType || 'pro';
        let tier: 'pro' | 'business' = 'pro';
        let limit = 100;

        if (planType.toLowerCase().includes('business')) {
            tier = 'business';
            limit = 500;
        }

        // Idempotency: check if user is already on the correct tier
        const { getUser, updateUserTier } = await import('../services/userService');
        const existingUser = await getUser(userId);

        if (existingUser?.subscription_tier === tier) {
            console.log(`[Payment] User ${userId} is already on ${tier}. Returning success (idempotent).`);
            return res.json({
                success: true,
                tier: existingUser.subscription_tier,
                limit: existingUser.documents_limit,
                idempotent: true,
            });
        }

        console.log(`[Payment] Upgrading user ${userId} to ${tier} (limit: ${limit})`);
        const updatedUser = await updateUserTier(userId, tier, limit);
        console.log(`[Payment] Upgrade successful. New tier: ${updatedUser?.subscription_tier}`);

        return res.json({
            success: true,
            tier: updatedUser?.subscription_tier,
            limit: updatedUser?.documents_limit,
        });
    } catch (error: any) {
        console.error('[Payment] Verify session error:', error.message, error.type);
        return res.status(500).json({ error: error.message, type: error.type || 'unknown' });
    }
});

export default router;
