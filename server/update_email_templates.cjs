const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_tZqGpnf8z5Ym@ep-floral-sun-ab6ip92h-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require' });

const newsletterHtml = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Transmit<span style="color: #2563eb;">.AI</span></h1>
        </div>
        
        <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; text-align: center;">Thanks for subscribing!</h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            You've successfully signed up for the <strong>Transmit AI</strong> newsletter. We are thrilled to have you join our community!
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            At Transmit AI, we are revolutionising document control for the construction industry. By combining powerful AI with seamless workflow automation, our platform empowers you to:
        </p>
        <ul style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Instantly extract intelligent data from thousands of complex engineering drawings and PDFs.</li>
            <li style="margin-bottom: 8px;">Auto-generate flawless Drawing Registers and transmittal logs in seconds.</li>
            <li style="margin-bottom: 8px;">Ensure perfect document version control without the manual data-entry headaches.</li>
        </ul>
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            We'll keep you updated with the latest construction insights, AI breakthroughs, and new features coming to the platform.
        </p>

        <div style="text-align: center; margin-top: 32px;">
            <a href="https://www.transmittal.co.uk/app" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 0 5px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                Go to App
            </a>
            <a href="https://www.transmittal.co.uk" style="display: inline-block; background: #f1f5f9; color: #334155; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 0 5px;">
                Visit Website
            </a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0 20px;" />
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://www.instagram.com/transmit_ai/" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 14px; font-weight: 600;">Instagram</a>
            <a href="https://www.linkedin.com/company/transmit-ai" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 14px; font-weight: 600;">LinkedIn</a>
            <a href="https://www.youtube.com/@Transmit_AI" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 14px; font-weight: 600;">YouTube</a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
            © 2026 Transmit AI Ltd. All rights reserved.
        </p>
    </div>
`.replace(/\n/g, '').replace(/\s{2,}/g, ' ');

const welcomeHtml = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Transmit<span style="color: #2563eb;">.AI</span></h1>
        </div>
        
        <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; text-align: center;">Welcome aboard!</h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Your account has been created successfully. Welcome to <strong>Transmit AI</strong>, the most intelligent document control platform built for modern engineering and construction.
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            With your new account, you can now:
        </p>
        <ul style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><strong>Upload PDFs blindly:</strong> Drop hundreds of complex drawings into Transmit AI.</li>
            <li style="margin-bottom: 8px;"><strong>Extract Intel instantly:</strong> Our AI will perfectly strip titles, revisions, and dates from Title Blocks.</li>
            <li style="margin-bottom: 8px;"><strong>Generate Document Logs:</strong> Export precise, ready-to-send Excel and PDF Drawing Registers in an instant.</li>
        </ul>

        <div style="text-align: center; margin-top: 32px;">
            <a href="https://www.transmittal.co.uk/app/upload" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 0 5px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                Start Uploading
            </a>
            <a href="https://www.transmittal.co.uk/app" style="display: inline-block; background: #f1f5f9; color: #334155; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 0 5px;">
                View Dashboard
            </a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0 20px;" />

        <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://www.instagram.com/transmit_ai/" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 14px; font-weight: 600;">Instagram</a>
            <a href="https://www.linkedin.com/company/transmit-ai" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 14px; font-weight: 600;">LinkedIn</a>
            <a href="https://www.youtube.com/@Transmit_AI" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 14px; font-weight: 600;">YouTube</a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
            Need help? Reply to this email or visit our <a href="https://www.transmittal.co.uk/faq" style="color: #2563eb; text-decoration: none; font-weight: 600;">FAQ</a>.
        </p>
    </div>
`.replace(/\n/g, '').replace(/\s{2,}/g, ' ');


async function run() {
    await client.connect();

    await client.query(
        "UPDATE system_settings SET value = $1 WHERE key = 'email_template_newsletter'",
        [JSON.stringify({ subject: 'Welcome to the Transmit AI Newsletter!', html: newsletterHtml })]
    );

    await client.query(
        "UPDATE system_settings SET value = $1 WHERE key = 'email_template_user_welcome'",
        [JSON.stringify({ subject: 'Welcome to Transmit AI!', html: welcomeHtml })]
    );

    console.log('Database email templates successfully stripped of broken CloudFront images.');
    await client.end();
}

run();
