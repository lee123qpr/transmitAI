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

export default router;
