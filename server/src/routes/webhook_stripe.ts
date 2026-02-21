import express from 'express';
import Stripe from 'stripe';
import { updateUserTier } from '../services/userService';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
        if (endpointSecret && sig) {
            // Stripe expects the raw body for signature verification
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else {
            // Fallback for local testing if secret is missing
            event = req.body;
        }
    } catch (err: any) {
        console.error(`[Webhook] Signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;
            const planType = session.metadata?.planType || 'pro';

            if (userId) {
                console.log(`[Webhook] Payment successful for user ${userId}. Upgrading to ${planType}...`);

                // Determine limits based on plan
                let limit = 100;
                let tier: 'pro' | 'business' = 'pro';

                if (planType.includes('business')) {
                    tier = 'business';
                    limit = 500;
                }

                try {
                    await updateUserTier(userId, tier, limit);
                    console.log(`[Webhook] User ${userId} successfully upgraded to ${tier}`);
                } catch (dbError) {
                    console.error(`[Webhook] Failed to update user tier in DB:`, dbError);
                }
            } else {
                console.warn('[Webhook] checkout.session.completed missing userId in metadata');
            }
            break;
        }

        default:
            console.log(`[Webhook] Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

export default router;
