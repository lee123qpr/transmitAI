import { Resend } from 'resend';
import { query } from '../db';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

// Helper to get dynamic template or fallback
const getEmailTemplate = async (key: string, fallbackSubject: string, fallbackHtml: string) => {
    try {
        const res = await query('SELECT value FROM system_settings WHERE key = $1', [key]);
        if (res.rowCount && res.rows[0].value) {
            // value is stored as JSON in system_settings
            const template = typeof res.rows[0].value === 'string' ? JSON.parse(res.rows[0].value) : res.rows[0].value;
            return {
                subject: template.subject || fallbackSubject,
                html: template.html || fallbackHtml
            };
        }
    } catch (err) {
        console.error(`[EmailService] Failed to fetch template ${key}:`, err);
    }
    return { subject: fallbackSubject, html: fallbackHtml };
};

export const sendWelcomeNewsletter = async (email: string): Promise<boolean> => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[EmailService] Resend API key missing, skipping email');
        return false;
    }

    const defaultHtml = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <!-- Try to load site logo from public folder, fallback to stylized text -->
                <img src="https://www.transmittal.co.uk/favicon.ico" alt="Transmit AI Logo" style="max-height: 50px; display: block; margin: 0 auto; margin-bottom: 12px;" onerror="this.onerror=null; this.style.display='none';" />
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
    `;

    const template = await getEmailTemplate('email_template_newsletter', 'Welcome to the Transmit AI Newsletter!', defaultHtml);

    try {
        const { error } = await resend.emails.send({
            from: 'Transmit AI <support@transmittal.co.uk>',
            to: email,
            subject: template.subject,
            html: template.html
        });

        if (error) {
            console.error('[Resend Error]', error);
            return false;
        }

        console.log(`[EmailService] Newsletter welcome sent to ${email}`);
        return true;
    } catch (error) {
        console.error('[EmailService] Newsletter error:', error);
        return false;
    }
};

export const sendWelcomeUser = async (email: string): Promise<boolean> => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[EmailService] Resend API key missing, skipping email');
        return false;
    }

    const defaultHtml = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://www.transmittal.co.uk/favicon.ico" alt="Transmit AI Logo" style="max-height: 50px; display: block; margin: 0 auto; margin-bottom: 12px;" onerror="this.onerror=null; this.style.display='none';" />
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
    `;

    const template = await getEmailTemplate('email_template_user_welcome', 'Welcome to Transmit AI!', defaultHtml);

    try {
        const { error } = await resend.emails.send({
            from: 'Transmit AI <support@transmittal.co.uk>',
            to: email,
            subject: template.subject,
            html: template.html
        });

        if (error) {
            console.error('[Resend Error]', error);
            return false;
        }

        console.log(`[EmailService] User welcome sent to ${email}`);
        return true;
    } catch (error) {
        console.error('[EmailService] User welcome error:', error);
        return false;
    }
};

export const sendContactFormMessage = async (name: string, fromEmail: string, subject: string, message: string) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[EmailService] Resend API key missing, skipping contact form email');
        return false;
    }

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #1a1a1a;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${fromEmail}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #4a4a4a; line-height: 1.6; white-space: pre-wrap;">${message}</p>
        </div>
    `;

    try {
        const { error } = await resend.emails.send({
            from: 'Contact Form <support@transmittal.co.uk>',
            to: 'support@transmittal.co.uk',
            replyTo: fromEmail,
            subject: `[Contact Form] ${subject}`,
            html: html
        });

        if (error) {
            console.error('[Resend Error]', error);
            return false;
        }

        console.log(`[EmailService] Contact message from ${fromEmail} sent successfully.`);
        return true;
    } catch (error) {
        console.error('[EmailService] Contact form email error:', error);
        return false;
    }
};
