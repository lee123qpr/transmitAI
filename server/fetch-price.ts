import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY');
    process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15' as any, // Use an older API version to be safe, or just cast to any
});

async function main() {
    const productId = 'prod_TyodlIBsO3FJO8'; // Enterprise Plan
    console.log(`Fetching prices for product: ${productId}...`);
    try {
        const prices = await stripe.prices.list({
            product: productId,
            limit: 1,
        });
        if (prices.data.length > 0) {
            console.log('FOUND_PRICE_ID:', prices.data[0].id);
            console.log('Price info:', JSON.stringify(prices.data[0], null, 2));
        } else {
            console.log('No prices found for this product.');
        }
    } catch (error) {
        console.error('Error fetching prices:', error);
    }
}

main();
