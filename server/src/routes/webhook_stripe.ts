import express from 'express';
import Stripe from 'stripe';
import { updateUserTier } from '../services/userService';
import { query } from '../db';

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
                    return res.status(500).json({ error: 'Database update failed' });
                }
            } else {
                console.warn('[Webhook] checkout.session.completed missing userId in metadata');
                // Fallback: search for customer by email if metadata is missing? 
                // Risky, better to log and fix the source.
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            try {
                const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                if (customer && customer.email) {
                    const userRes = await query('SELECT id FROM users WHERE email = $1', [customer.email]);
                    const userId = userRes.rows[0]?.id;

                    if (userId) {
                        console.log(`[Webhook] Subscription deleted. Downgrading user ${userId} to free plan`);
                        await updateUserTier(userId, 'free', 10);
                    } else {
                        console.warn(`[Webhook] Could not find user with email ${customer.email} to downgrade`);
                    }
                }
            } catch (err) {
                console.error(`[Webhook] Failed to handle subscription deletion:`, err);
                return res.status(500).json({ error: 'Database update failed' });
            }
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as Stripe.Invoice;
            console.warn(`[Webhook] Invoice payment failed for customer: ${invoice.customer}. They may lose access soon.`);
            // Usually, Stripe handles dunning (retries). If it completely fails, customer.subscription.deleted will fire.
            // We just log this for now.
            break;
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            const status = subscription.status;

            if (status === 'active' || status === 'trialing') {
                const priceId = subscription.items.data[0].price.id;

                let planType = 'pro';
                if (
                    priceId === process.env.STRIPE_PRICE_ID_BUSINESS_MONTHLY ||
                    priceId === process.env.STRIPE_PRICE_ID_BUSINESS_YEARLY
                ) {
                    planType = 'business';
                }

                try {
                    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                    if (customer && customer.email && typeof customer.email === 'string') {
                        const userRes = await query('SELECT id FROM users WHERE email = $1', [customer.email]);
                        const userId = userRes.rows[0]?.id;

                        if (userId) {
                            console.log(`[Webhook] Subscription updated. Syncing user ${userId} to ${planType}. Cancel at period end: ${subscription.cancel_at_period_end}`);
                            await processSubscription(userId, planType);
                            // Also sync the cancel_at_period_end flag
                            await query('UPDATE users SET cancel_at_period_end = $1 WHERE id = $2', [subscription.cancel_at_period_end, userId]);
                        }
                    }
                } catch (err) {
                    console.error(`[Webhook] Failed to handle subscription update:`, err);
                    return res.status(500).json({ error: 'Database update failed' });
                }
            } else if (status === 'unpaid') {
                try {
                    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                    if (customer && customer.email && typeof customer.email === 'string') {
                        const userRes = await query('SELECT id FROM users WHERE email = $1', [customer.email]);
                        const userId = userRes.rows[0]?.id;

                        if (userId) {
                            console.log(`[Webhook] Subscription unpaid. Downgrading user ${userId} to free plan`);
                            await updateUserTier(userId, 'free', 10);
                        }
                    }
                } catch (err) {
                    console.error(`[Webhook] Failed to handle unpaid downgrade:`, err);
                    return res.status(500).json({ error: 'Database update failed' });
                }
            }
            break;
        }

        default:
            console.log(`[Webhook] Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

export default router;
