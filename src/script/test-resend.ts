import dotenv from "dotenv";
import { emailService } from "../utils/emailService";
import { logger } from "../utils/logger";
import { config } from "../config";

// Load environment variables
dotenv.config();

async function testResend() {
    try {
        logger.info("🧪 Testing Resend email service...");
        logger.info(`Using Resend API key: ${config.email.pass.substring(0, 5)}...`);
        logger.info(`Sending to admin email: ${config.email.adminEmail}`);
        logger.info(`Sending from: ${config.email.from}`);

        const success = await emailService.sendTestEmail();

        if (success) {
            logger.info("✅ Resend test email sent successfully!");
            logger.info("Check your admin email inbox.");
        } else {
            logger.error("❌ Failed to send Resend test email.");
        }

        process.exit(success ? 0 : 1);
    } catch (error) {
        logger.error("❌ Error testing Resend email:", error);
        process.exit(1);
    }
}

testResend();
