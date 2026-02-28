import 'dotenv/config';
import { clerkClient } from '@clerk/clerk-sdk-node';

async function purgeClerkUsers() {
    console.log('Fetching users from Clerk...');
    try {
        const users: any = await clerkClient.users.getUserList();
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            const email = user.emailAddresses[0]?.emailAddress;
            if (email === 'leekilcoyne1@gmail.com') {
                console.log(`Skipping admin user: ${email} (${user.id})`);
                continue;
            }

            console.log(`Deleting user: ${email} (${user.id})`);
            await clerkClient.users.deleteUser(user.id);
        }

        console.log('Clerk user purge complete!');
    } catch (error) {
        console.error('Error purging Clerk users:', error);
    }
}

purgeClerkUsers();
