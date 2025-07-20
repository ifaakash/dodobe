import dotenv from "dotenv";
import { emailService } from "../utils/emailService";
import { logger } from "../utils/logger";

// Load environment variables
dotenv.config();

async function testEmail() {
    try {
        logger.info("🧪 Testing email service...");

        const success = await emailService.sendTestEmail();

        if (success) {
            logger.info("✅ Test email sent successfully!");
            logger.info("Check your admin email inbox.");
        } else {
            logger.error("❌ Failed to send test email.");
        }

        process.exit(success ? 0 : 1);
    } catch (error) {
        logger.error("❌ Error testing email:", error);
        process.exit(1);
    }
}

testEmail();
