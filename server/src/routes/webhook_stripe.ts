import express from 'express';
import Stripe from 'stripe';
import { updateUserTier } from '../services/userService';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Shared logic for upgrading user tier
 */
async function processSubscription(userId: string, planType: string) {
    console.log(`[Subscription] Updating user ${userId} to ${planType}...`);

    let limit = 500;
    let tier: 'pro' | 'business' = 'pro';

    if (planType.toLowerCase().includes('business')) {
        tier = 'business';
        limit = 2500;
    }

    await updateUserTier(userId, tier, limit);
    console.log(`[Subscription] User ${userId} successfully upgraded to ${tier}`);
}

// SIMULATION ENDPOINT (Localhost only)
// Uses JSON parser, not raw
router.post('/simulate', express.json(), async (req, res) => {
    // Only allow simulation on localhost
    const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    if (!isLocal) {
        return res.status(403).json({ error: 'Simulation only allowed on localhost' });
    }

    const { userId, planType } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        await processSubscription(userId, planType || 'pro');
        res.json({ success: true, message: 'Simulation processed' });
    } catch (err: any) {
        console.error(`[Simulation] Error:`, err);
        res.status(500).json({ error: err.message });
    }
});

// REAL WEBHOOK ENDPOINT
// Uses RAW parser for signature verification
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    console.log('[Webhook] Incoming Stripe event at:', new Date().toISOString());
    console.log('[Webhook] Headers:', JSON.stringify(req.headers));

    const sig = req.headers['stripe-signature'];
    const hasSecret = !!endpointSecret;
    console.log(`[Webhook] Secret Configured: ${hasSecret}, Signature Present: ${!!sig}`);

    let event: Stripe.Event;

    try {
        if (endpointSecret && sig) {
            // Stripe expects the raw body for signature verification
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
            console.log(`[Webhook] Signature verified: ${event.type}`);
        } else {
            // Fallback for local testing if secret is missing (e.g. CLI not used)
            console.warn('[Webhook] No endpoint secret or signature found. Falling back to JSON parsing (Insecure - Local only)');
            const bodyString = req.body.toString();
            console.log('[Webhook] Raw body string (start):', bodyString.substring(0, 100));
            event = JSON.parse(bodyString);
        }
    } catch (err: any) {
        console.error(`[Webhook] ERROR: Signature verification failed: ${err.message}`);
        // Log the body type to help debug Vercel issues
        console.log(`[Webhook] Body type: ${typeof req.body}, IsBuffer: ${Buffer.isBuffer(req.body)}`);
        if (req.body) console.log(`[Webhook] Body Sample: ${req.body.toString().substring(0, 50)}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    console.log(`[Webhook] Processing event type: ${event.type}`);

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;
            const planType = session.metadata?.planType || 'pro';

            console.log(`[Webhook] Session metadata: userId=${userId}, planType=${planType}`);

            if (userId) {
                try {
                    await processSubscription(userId, planType);
                } catch (dbError) {
                    console.error(`[Webhook] Failed to update user tier in DB:`, dbError);
                }
            } else {
                console.warn('[Webhook] checkout.session.completed missing userId in metadata');
                // Fallback: search for customer by email if metadata is missing? 
                // Risky, better to log and fix the source.
            }
            break;
        }

        default:
            console.log(`[Webhook] Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

export default router;
