import bcrypt from "bcrypt";
import { env } from "../config/env.js";

export const hashPassword = async (password) => {
  const saltRounds = env.bcryptSaltRounds;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
