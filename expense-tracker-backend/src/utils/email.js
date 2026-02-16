import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";

let transporter;

const isSmtpConfigured = () => Boolean(env.smtpUser && env.smtpPass);
const isBrevoConfigured = () => Boolean(env.brevoApiKey);
const isGmailApiConfigured = () =>
  Boolean(env.gmailClientId && env.gmailClientSecret && env.gmailRefreshToken && env.gmailSenderEmail);

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

const buildHeaderLines = (headers = {}) => {
  const lines = [];
  Object.entries(headers).forEach(([key, value]) => {
    if (!value) return;
    lines.push(`${key}: ${value}`);
  });
  return lines;
};

const buildGmailRaw = ({ to, subject, html, text, headers }) => {
  const sender = parseEmailFrom(env.emailFrom);
  const fromEmail = env.gmailSenderEmail || sender.email;
  const fromName = sender.name || "Expense Tracker";
  const fromHeader = `${fromName} <${fromEmail}>`;
  const content = html || text || "";
  const headerLines = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: ${html ? "text/html" : "text/plain"}; charset=UTF-8`,
    "Content-Transfer-Encoding: 7bit",
    ...buildHeaderLines(headers),
  ];

  const rawMessage = `${headerLines.join("\r\n")}\r\n\r\n${content}`;
  return Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const sendViaGmailApi = async ({ to, subject, html, text, headers }) => {
  const oauth2Client = new OAuth2Client(env.gmailClientId, env.gmailClientSecret);
  oauth2Client.setCredentials({ refresh_token: env.gmailRefreshToken });

  const tokenResponse = await oauth2Client.getAccessToken();
  const accessToken = tokenResponse?.token;
  if (!accessToken) {
    throw new Error("Unable to obtain Gmail access token");
  }

  const raw = buildGmailRaw({ to, subject, html, text, headers });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ raw }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gmail API error (${response.status}): ${errorText}`);
    }

    return await response.json().catch(() => ({}));
  } finally {
    clearTimeout(timeoutId);
  }
};

export const sendEmail = async ({ to, subject, html, text, headers }) => {
  if (isGmailApiConfigured()) {
    try {
      return await sendViaGmailApi({ to, subject, html, text, headers });
    } catch (error) {
      console.error("Email send failed (Gmail API):", error.message);
      return { error };
    }
  }

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
