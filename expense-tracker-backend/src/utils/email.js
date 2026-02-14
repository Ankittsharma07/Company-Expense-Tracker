import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter;

const isSmtpConfigured = () => Boolean(env.smtpUser && env.smtpPass);
const isBrevoConfigured = () => Boolean(env.brevoApiKey);

const parseEmailFrom = (value) => {
  if (!value) {
    return { name: "Expense Tracker", email: "no-reply@expense-tracker.com" };
  }
  const match = value.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };
  }
  if (value.includes("@")) {
    return { name: "Expense Tracker", email: value.trim() };
  }
  return { name: value.trim(), email: "no-reply@expense-tracker.com" };
};

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

const sendViaBrevo = async ({ to, subject, html, text, headers }) => {
  const sender = parseEmailFrom(env.emailFrom);
  const payload = {
    sender,
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
    headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": env.brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API error (${response.status}): ${errorText}`);
    }

    return await response.json().catch(() => ({}));
  } finally {
    clearTimeout(timeoutId);
  }
};

export const sendEmail = async ({ to, subject, html, text, headers }) => {
  if (isBrevoConfigured()) {
    try {
      return await sendViaBrevo({ to, subject, html, text, headers });
    } catch (error) {
      console.error("Email send failed (Brevo):", error.message);
      return { error };
    }
  }

  if (!isSmtpConfigured()) {
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
      headers,
    });
    return info;
  } catch (error) {
    console.error("Email send failed (SMTP):", error.message);
    return { error };
  }
};
