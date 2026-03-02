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

export const sendWelcomeNewsletter = async (email: string) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[EmailService] Resend API key missing, skipping email');
        return;
    }

    const defaultHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; width: 40px; height: 40px; background: #2563eb; border-radius: 8px; line-height: 44px; color: white; font-size: 24px; font-weight: bold; text-align: center;">T</div>
                <h1 style="color: #1e293b; margin-top: 10px; font-size: 24px; font-family: sans-serif;">Transmit<span style="color: #2563eb;">.AI</span></h1>
            </div>
            <h2 style="color: #1a1a1a;">Thanks for subscribing!</h2>
            <p style="color: #4a4a4a; line-height: 1.6;">
                You've successfully signed up for the Transmittal newsletter. We'll keep you updated with the latest news, 
                articles, and system updates.
            </p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://transmit.ai" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Visit our Website
                </a>
            </div>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">
                © 2026 Transmit.AI Ltd. All rights reserved.
            </p>
        </div>
    `;

    const template = await getEmailTemplate('email_template_newsletter', 'Welcome to our Newsletter!', defaultHtml);

    try {
        await resend.emails.send({
            from: 'Transmit.AI <admin@transmit.ai>',
            to: email,
            subject: template.subject,
            html: template.html
        });
        console.log(`[EmailService] Newsletter welcome sent to ${email}`);
    } catch (error) {
        console.error('[EmailService] Newsletter error:', error);
    }
};

export const sendWelcomeUser = async (email: string) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[EmailService] Resend API key missing, skipping email');
        return;
    }

    const defaultHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; width: 40px; height: 40px; background: #2563eb; border-radius: 8px; line-height: 44px; color: white; font-size: 24px; font-weight: bold; text-align: center;">T</div>
                <h1 style="color: #1e293b; margin-top: 10px; font-size: 24px; font-family: sans-serif;">Transmit<span style="color: #2563eb;">.AI</span></h1>
            </div>
            <h2 style="color: #1a1a1a;">Welcome aboard!</h2>
            <p style="color: #4a4a4a; line-height: 1.6;">
                Your account has been created successfully. You can now start uploading and analyzing your transmittals 
                with the power of AI.
            </p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://transmit.ai/app" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Go to Dashboard
                </a>
            </div>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">
                Need help? Reply to this email or visit our <a href="https://transmit.ai/faq" style="color: #2563eb; text-decoration: none;">FAQ</a>.
            </p>
        </div>
    `;

    const template = await getEmailTemplate('email_template_user_welcome', 'Welcome to Transmittal!', defaultHtml);

    try {
        await resend.emails.send({
            from: 'Transmit.AI <admin@transmit.ai>',
            to: email,
            subject: template.subject,
            html: template.html
        });
        console.log(`[EmailService] User welcome sent to ${email}`);
    } catch (error) {
        console.error('[EmailService] User welcome error:', error);
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
        await resend.emails.send({
            from: 'Contact Form <admin@transmit.ai>',
            to: 'support@transmittal.co.uk',
            replyTo: fromEmail,
            subject: `[Contact Form] ${subject}`,
            html: html
        });
        console.log(`[EmailService] Contact message from ${fromEmail} sent successfully.`);
        return true;
    } catch (error) {
        console.error('[EmailService] Contact form email error:', error);
        return false;
    }
};
