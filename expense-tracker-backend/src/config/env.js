import dotenv from "dotenv";

dotenv.config();

const missingKeys = [];

const readRequiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    missingKeys.push(key);
    return "";
  }
  return value;
};

const normalizeUrl = (value) => {
  if (!value) return "";
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: readRequiredEnv("DATABASE_URL"),
  directUrl: readRequiredEnv("DIRECT_URL"),
  jwtSecret: readRequiredEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  freePlanEmployeeLimit: Number(process.env.FREE_PLAN_EMPLOYEE_LIMIT || 5),
  frontendUrl: normalizeUrl(readRequiredEnv("FRONTEND_URL")),
  corsOrigin: normalizeUrl(readRequiredEnv("FRONTEND_URL")),
  cloudinaryCloudName: readRequiredEnv("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: readRequiredEnv("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: readRequiredEnv("CLOUDINARY_API_SECRET"),
  exchangeRateApiKey: process.env.EXCHANGERATE_API_KEY || process.env.FASTFOREX_API_KEY || "",
  exchangeRateApiBaseUrl:
    process.env.EXCHANGERATE_API_BASE_URL || "https://v6.exchangerate-api.com/v6",
  googleClientId: readRequiredEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: readRequiredEnv("GOOGLE_CLIENT_SECRET"),
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : true,
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  emailFrom: process.env.EMAIL_FROM || "Expense Tracker <no-reply@expense-tracker.com>",
  brevoApiKey: process.env.BREVO_API_KEY || "",
  gmailClientId: process.env.GMAIL_CLIENT_ID || "",
  gmailClientSecret: process.env.GMAIL_CLIENT_SECRET || "",
  gmailRefreshToken: process.env.GMAIL_REFRESH_TOKEN || "",
  gmailSenderEmail: process.env.GMAIL_SENDER_EMAIL || "",
};

if (!env.exchangeRateApiKey) {
  missingKeys.push("EXCHANGERATE_API_KEY");
}

export const validateEnv = () => {
  if (missingKeys.length === 0) {
    return;
  }
  const uniqueMissing = [...new Set(missingKeys)];
  throw new Error(`Missing required env var(s): ${uniqueMissing.join(", ")}`);
};
