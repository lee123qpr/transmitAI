
// Native fetch in Node 18+

const BASE_URL = 'http://localhost:3000/api';
const USER_ID = 'user_39g1NzSpQVvxuWZCrYbMjdXZBt4';

async function debugFrontendHelper() {
    try {
        console.log('--- Debugging User Status ---');
        const userRes = await fetch(`${BASE_URL}/user/${USER_ID}`);
        if (!userRes.ok) console.log('User Req Failed:', userRes.status);
        else {
            const user = await userRes.json();
            console.log('User Data:', JSON.stringify(user, null, 2));
        }

        console.log('\n--- Debugging Documents (Transmittals) ---');
        const docsRes = await fetch(`${BASE_URL}/documents?userId=${USER_ID}`);
        if (!docsRes.ok) console.log('Docs Req Failed:', docsRes.status);
        else {
            const docs = await docsRes.json();
            console.log(`Fetched ${docs.length} documents.`);

            // Group by Transmittal Title like frontend
            const groups = {};
            docs.forEach(doc => {
                const title = doc.transmittalTitle || 'Unsorted Uploads';
                if (!groups[title]) groups[title] = [];
                groups[title].push(doc.filename);
            });

            console.log('Frontend Groups would be:', JSON.stringify(groups, null, 2));
        }

    } catch (err) {
        console.error('Debug Script Error:', err);
    }
}

debugFrontendHelper();
