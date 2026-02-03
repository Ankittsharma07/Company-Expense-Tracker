import { sendEmail } from "./src/utils/email.js";
import dotenv from "dotenv";

dotenv.config();

const testEmail = async () => {
    console.log("Testing email configuration...");
    console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`SMTP User: ${process.env.SMTP_USER}`);

    const result = await sendEmail({
        to: process.env.SMTP_USER, // Send to self
        subject: "Test Email from Expense Tracker",
        html: "<h1>It works!</h1><p>Your email configuration is correct.</p>",
        text: "It works! Your email configuration is correct.",
    });

    if (result.error) {
        console.error("❌ Email failed to send:", result.error);
    } else if (result.skipped) {
        console.warn("⚠️ Email skipped (configuration missing).");
    } else {
        console.log("✅ Email sent successfully!");
        console.log("Check your inbox (" + process.env.SMTP_USER + ")");
        console.log("Response:", result.response);
    }
};

testEmail();
