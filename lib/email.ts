import nodemailer from 'nodemailer';

// Create transporter using SMTP config from environment
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
    try {
        // Check if SMTP is configured
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('SMTP not configured. Email details:');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('---');
            return true; // Return true for development
        }

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            html,
        });

        console.log(`Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

export function generatePasswordResetEmail(name: string, resetLink: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 28px;">🤖 Snowky</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">AI-Powered Chat Widget</p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 32px;">
                                <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 22px;">Reset Your Password</h2>
                                <p style="color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">Hi ${name},</p>
                                <p style="color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
                                    We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.
                                </p>
                                
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" style="padding: 16px 0;">
                                            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="color: #6b7280; margin: 24px 0 0 0; font-size: 14px; line-height: 1.6;">
                                    If you didn't request this, you can safely ignore this email. Your password won't be changed.
                                </p>
                                
                                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
                                
                                <p style="color: #9ca3af; margin: 0; font-size: 12px; line-height: 1.5;">
                                    If the button doesn't work, copy and paste this link into your browser:<br>
                                    <a href="${resetLink}" style="color: #6366f1; word-break: break-all;">${resetLink}</a>
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background: #f9fafb; padding: 24px 32px; text-align: center;">
                                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                    © ${new Date().getFullYear()} Snowky. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}
