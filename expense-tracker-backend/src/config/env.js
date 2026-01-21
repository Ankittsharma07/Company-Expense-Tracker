import dotenv from "dotenv";

dotenv.config();

const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  freePlanEmployeeLimit: Number(process.env.FREE_PLAN_EMPLOYEE_LIMIT || 5),
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
