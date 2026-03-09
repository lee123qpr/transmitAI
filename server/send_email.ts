import { sendWelcomeUser, sendWelcomeNewsletter } from './src/services/emailService';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        console.log('Sending Test Welcome User Email to test@transmittal.co.uk...');
        const res1 = await sendWelcomeUser('test@transmittal.co.uk');
        console.log('Welcome User Result:', res1);

        console.log('Sending Test Newsletter Email to test@transmittal.co.uk...');
        const res2 = await sendWelcomeNewsletter('test@transmittal.co.uk');
        console.log('Newsletter Result:', res2);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
