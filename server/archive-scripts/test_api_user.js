// Simple curl test using child_process
const { execSync } = require('child_process');

const userId = 'user_39inMjBqBeyC1ki2ibNCrApSO0q';
const email = 'leeking1@live.co.uk';
const url = `http://localhost:3000/api/user/${userId}?email=${encodeURIComponent(email)}`;

console.log(`\n🔍 Testing API: ${url}\n`);

try {
    const output = execSync(`curl -s "${url}"`, { encoding: 'utf-8' });
    const data = JSON.parse(output);

    console.log('✅ API Response:');
    console.log('─────────────────────────────────────');
    console.log(JSON.stringify(data, null, 2));
    console.log('─────────────────────────────────────\n');

    console.log('📊 Frontend Interpretation:');
    console.log(`subscriptionTier: "${data.subscription_tier}"`);
    console.log(`isPro: ${data.subscription_tier !== 'free' || data.documents_limit > 20}`);
    console.log(`usage.current: ${data.documents_usage}`);
    console.log(`usage.limit: ${data.documents_limit}`);

} catch (error) {
    console.error('❌ Error:', error.message);
}
