
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
import { query } from './src/db';

async function checkStripeAndFix() {
    try {
        console.log('Checking Stripe interaction...');

        // 1. List recent checkout sessions to find the user's payment
        const sessions = await stripe.checkout.sessions.list({
            limit: 5,
            expand: ['data.customer']
        });

        console.log(`Found ${sessions.data.length} recent sessions.`);

        for (const session of sessions.data) {
            console.log(`\nSession ID: ${session.id}`);
            console.log(`Status: ${session.payment_status}`);
            console.log(`Customer Email: ${session.customer_details?.email}`);
            console.log(`Metadata:`, session.metadata);

            if (session.payment_status === 'paid') {
                const userId = session.metadata?.userId;
                if (!userId) {
                    console.log('⚠️ No userId in metadata. Cannot link to app user.');
                    continue;
                }

                // Check if user is updated in DB
                const res = await query('SELECT * FROM users WHERE id = $1', [userId]);
                const user = res.rows[0];

                if (user) {
                    console.log(`BD User Tier: ${user.subscription_tier}`);
                    if (user.subscription_tier !== 'pro') {
                        console.log(`❌ MISMATCH! User paid but is still ${user.subscription_tier}. Fixing now...`);

                        // FIX IT
                        await query(
                            `UPDATE users 
                             SET subscription_tier = 'pro', documents_limit = 500, updated_at = NOW() 
                             WHERE id = $1`,
                            [userId]
                        );
                        console.log('✅ User manually upgraded to PRO.');
                    } else {
                        console.log('✅ User is already PRO.');
                    }
                } else {
                    console.log('❌ User not found in DB!');
                }
            }
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

checkStripeAndFix();
