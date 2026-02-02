import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter;

const isEmailConfigured = () => Boolean(env.smtpUser && env.smtpPass);

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!isEmailConfigured()) {
    console.warn("Email skipped: SMTP not configured.");
    return { skipped: true };
  }

  try {
    const info = await getTransporter().sendMail({
      from: env.emailFrom,
      to,
      subject,
      html,
      text,
    });
    return info;
  } catch (error) {
    console.error("Email send failed:", error.message);
    return { error };
  }
};
