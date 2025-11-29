import { Resend } from "resend";
import { config } from "../config";
import { logger } from "./logger";

interface WaitlistNotificationData {
    instaId: string;
    userName?: string;
    userEmail?: string;
    userId: string;
    mediaKitId: string;
    queueNumber: number;
    createdAt: Date;
}

class EmailService {
    private resend: Resend;
    
    constructor() {
        // Initialize Resend with API key
        this.resend = new Resend(config.email.pass);
        
        // Log successful initialization
        logger.info("Resend email service initialized");
    }


    public async notifyAdminNewWaitlistRequest(
        data: WaitlistNotificationData
    ): Promise<boolean> {
        try {
            const {
                instaId,
                userName,
                userEmail,
                userId,
                mediaKitId,
                queueNumber,
                createdAt,
            } = data;

            const subject = `🚀 New Waitlist: ${instaId} (#${queueNumber})`;

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; margin-bottom: 20px;">🚀 New Waitlist Request</h2>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <tr><td style="padding: 5px 0; font-weight: bold;">User Name:</td><td>${
                            userName || "N/A"
                        }</td></tr>
                        <tr><td style="padding: 5px 0; font-weight: bold;">User ID:</td><td>${userId}</td></tr>
                        <tr><td style="padding: 5px 0; font-weight: bold;">MediaKit ID:</td><td>${mediaKitId}</td></tr>
                        <tr><td style="padding: 5px 0; font-weight: bold;">Instagram ID:</td><td>${instaId}</td></tr>
                        <tr><td style="padding: 5px 0; font-weight: bold;">Queue Number:</td><td>#${queueNumber}</td></tr>
                        <tr><td style="padding: 5px 0; font-weight: bold;">Registered:</td><td>${createdAt.toLocaleString()}</td></tr>
                    </table>
                    
                    <div style="margin: 20px 0;">
                        <a href="https://instagram.com/${instaId}" style="display: inline-block; margin: 5px 10px 5px 0; padding: 8px 15px; background: #E4405F; color: white; text-decoration: none; border-radius: 5px;">📱 Instagram</a>
                        <a href="https://socialblade.com/instagram/user/${instaId}" style="display: inline-block; margin: 5px 10px 5px 0; padding: 8px 15px; background: #1DA1F2; color: white; text-decoration: none; border-radius: 5px;">📊 SocialBlade</a>
                        <a href="https://api.dodoclub.in/api-docs/#/MediaKit/patch_api_v1_mediakit_update" style="display: inline-block; margin: 5px 0; padding: 8px 15px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;">🔧 Update API</a>
                    </div>
                </div>
            `;

            const textContent = `
New Waitlist Request

User Name: ${userName || "N/A"}
User ID: ${userId}
MediaKit ID: ${mediaKitId}
Instagram ID: ${instaId}
Queue Number: #${queueNumber}
Registered: ${createdAt.toLocaleString()}

Links:
- Instagram: https://instagram.com/${instaId}
- SocialBlade: https://socialblade.com/instagram/user/${instaId}
- Update API: https://api.dodoclub.in/api-docs/#/MediaKit/patch_api_v1_mediakit_update
            `;

            const mailOptions = {
                from: config.email.from,
                to: config.email.adminEmail,
                subject,
                text: textContent,
                html: htmlContent,
            };

            await this.resend.emails.send({
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject,
                text: mailOptions.text,
                html: mailOptions.html
            });

            logger.info(
                `Waitlist notification email sent successfully for ${instaId}`
            );
            return true;
        } catch (error) {
            logger.error("Failed to send waitlist notification email:", error);
            return false;
        }
    }

    public async sendTestEmail(): Promise<boolean> {
        try {
            const mailOptions = {
                from: config.email.from,
                to: config.email.adminEmail,
                subject: "🧪 Dodo Email Service Test",
                text: "This is a test email from Dodo backend email service.",
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>🧪 Email Service Test</h2>
                        <p>This is a test email from Dodo backend email service.</p>
                        <p>If you received this, the email service is working correctly! ✅</p>
                    </div>
                `,
            };

            await this.resend.emails.send({
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject,
                text: mailOptions.text,
                html: mailOptions.html
            });
            logger.info("Test email sent successfully");
            return true;
        } catch (error) {
            logger.error("Failed to send test email:", error);
            return false;
        }
    }
}

export const emailService = new EmailService();
