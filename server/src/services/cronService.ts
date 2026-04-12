import cron from 'node-cron';
import { query } from '../db';
import { sendSevenDayFollowUp, sendTrialGifted, sendTrialEnded } from './emailService';
import { giftTrial, updateUserTier } from './userService';

export const startCronJobs = () => {
    // Run every day at Midnight (00:00) server time
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Starting daily background jobs...');
        
        try {
            // Task 1: 7-Day Follow-Up
            // Find users created between 7 and 8 days ago
            const followUpRes = await query(`
                SELECT id, email FROM users 
                WHERE created_at >= NOW() - interval '8 days'
                AND created_at < NOW() - interval '7 days'
            `);
            for (const user of followUpRes.rows) {
                console.log(`[Cron] Sending 7-Day follow-up to ${user.email}`);
                await sendSevenDayFollowUp(user.email);
            }

            // Task 2: Gift 14-Day Trial on Day 14
            // Find users created between 14 and 15 days ago who are still on the 'free' tier
            const trialGiftRes = await query(`
                SELECT id, email FROM users 
                WHERE created_at >= NOW() - interval '15 days'
                AND created_at < NOW() - interval '14 days'
                AND subscription_tier = 'free'
            `);
            for (const user of trialGiftRes.rows) {
                console.log(`[Cron] Gifting 14-Day Pro Trial to ${user.email}`);
                await giftTrial(user.id);
                await sendTrialGifted(user.email);
            }

            // Task 3: Trial Expiry
            // Find users where trial_ends_at is in the past and they are still 'pro'
            const expiryRes = await query(`
                SELECT id, email FROM users 
                WHERE trial_ends_at < NOW()
                AND subscription_tier = 'pro'
            `);
            for (const user of expiryRes.rows) {
                console.log(`[Cron] Downgrading expired trial for ${user.email}`);
                // Move back to free with 10 documents limit.
                // updateUsertier also clears trial_ends_at to NULL automatically.
                await updateUserTier(user.id, 'free', 10);
                await sendTrialEnded(user.email);
            }

            console.log('[Cron] Daily background jobs completed successfully.');
        } catch (err) {
            console.error('[Cron] Error during daily background jobs:', err);
        }
    });

    console.log('[Cron] Background scheduling initialized.');
};
