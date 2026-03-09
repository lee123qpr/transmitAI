import express from 'express';
import { Webhook } from 'svix';
import { query } from '../db';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16' as any
});

// Use raw body for svix signature verification
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!SIGNING_SECRET) {
        console.error('[Clerk Webhook] Error: CLERK_WEBHOOK_SECRET is not set');
        return res.status(500).json({ error: 'Config error' });
    }

    // Get headers
    const svix_id = req.headers['svix-id'] as string;
    const svix_timestamp = req.headers['svix-timestamp'] as string;
    const svix_signature = req.headers['svix-signature'] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({ error: 'Error: Missing svix headers' });
    }

    // Get body
    const payload = req.body;
    const body = payload.toString('utf8');

    let evt: any;

    // Verify payload
    try {
        const wh = new Webhook(SIGNING_SECRET);
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        });
    } catch (err: any) {
        console.error('[Clerk Webhook] Error: Verification failed:', err.message);
        return res.status(400).json({ error: 'Error: Verification failed' });
    }

    // Handle event
    const { type, data } = evt;
    console.log(`[Clerk Webhook] Received event: ${type}`);

    if (type === 'user.deleted') {
        const clerkUserId = data.id;

        try {
            // 1. Find user in the database to get their email and clear data
            const userResult = await query('SELECT email FROM users WHERE clerk_id = $1', [clerkUserId]);

            if (userResult.rows.length > 0) {
                const email = userResult.rows[0].email;
                console.log(`[Clerk Webhook] User deleted in Clerk. Cleaning up Stripe and local DB for: ${email}`);

                // 2. Cancel Stripe Subscriptions
                if (email) {
                    const customers = await stripe.customers.list({ email });
                    for (const customer of customers.data) {
                        const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: 'active' });
                        for (const sub of subscriptions.data) {
                            await stripe.subscriptions.cancel(sub.id);
                            console.log(`[Clerk Webhook] Cancelled Stripe subscription: ${sub.id}`);
                        }
                    }
                }

                // 3. Delete Document references (Optional: if the DB has cascade it might be automatic, but let's be explicit)
                await query('DELETE FROM documents WHERE user_id = $1', [clerkUserId]);

                // 4. Delete the user from the database
                await query('DELETE FROM users WHERE clerk_id = $1', [clerkUserId]);

                console.log(`[Clerk Webhook] Successfully deleted user data and subscriptions for ${clerkUserId}`);
            } else {
                console.log(`[Clerk Webhook] User ${clerkUserId} not found in DB. Possibly already deleted.`);
            }
        } catch (error) {
            console.error('[Clerk Webhook] Error during user cleanup:', error);
            // Return 500 so Clerk retries this critical webhook
            return res.status(500).json({ error: 'Cleanup failed' });
        }
    }

    return res.status(200).json({ success: true });
});

export default router;
