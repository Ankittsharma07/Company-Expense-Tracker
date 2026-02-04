import crypto from "crypto";
import { prisma } from "../../config/db.js";
import { OAuth2Client } from "google-auth-library";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { signToken } from "../../utils/jwt.js";
import { sendEmail } from "../../utils/email.js";
import { buildPasswordResetEmail } from "../../utils/emailTemplates.js";
import { env } from "../../config/env.js";

const PASSWORD_RESET_EXPIRY_MINUTES = 15;

const getAppBaseUrl = () => {
  const raw = env.appBaseUrl || "http://localhost:5173";
  if (raw === "*") {
    return "http://localhost:5173";
  }
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
};

const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
};

const getHighPriorityHeaders = () => ({
  "X-Priority": "1",
  Priority: "urgent",
  Importance: "high",
});

export const signupService = async ({ companyName, name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email already in use");
  }

  const company = await prisma.company.create({
    data: { name: companyName },
  });

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      name,
      email,
      role: "ADMIN",
      passwordHash,
    },
  });

  const token = signToken({ id: user.id, role: user.role, companyId: company.id });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      avatarUrl: user.avatarUrl || null,
    },
    company: {
      id: company.id,
      name: company.name,
      plan: company.plan,
    },
  };
};

export const loginService = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (!user.passwordHash) {
    throw new Error("Invalid credentials");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  const token = signToken({ id: user.id, role: user.role, companyId: user.companyId });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      avatarUrl: user.avatarUrl || null,
    },
    company: {
      id: user.company.id,
      name: user.company.name,
      plan: user.company.plan,
    },
  };


};

export const googleLoginService = async (token) => {
  let email, name, picture;

  try {
    // Try verifying as ID Token first
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    email = payload.email;
    name = payload.name;
    picture = payload.picture;
  } catch (error) {
    console.log('Google ID Token verification failed (expected for access tokens):', error.message);

    // Fallback: Verify as Access Token
    try {
      console.log('Attempting to verify as Access Token...');
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google UserInfo API Error:', response.status, response.statusText, errorText);
        throw new Error(`Invalid Access Token: ${response.status} ${response.statusText}`);
      }

      const userInfo = await response.json();
      console.log('Google UserInfo retrieved successfully for:', userInfo.email);
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
    } catch (innerError) {
      console.error('Google Access Token Verification Failed:', innerError);
      throw new Error(`Google Authentication Failed: ${innerError.message}`);
    }
  }

  let user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user) {
    // Create simple company for new user
    const company = await prisma.company.create({
      data: { name: `${name}'s Company` },
    });

    user = await prisma.user.create({
      data: {
        companyId: company.id,
        name,
        email,
        role: "EMPLOYEE",
        authProvider: "GOOGLE",
        googleAvatarUrl: picture,
        // passwordHash is optional, so we don't provide it
      },
      include: { company: true },
    });
  } else {
    const updates = {};
    if (!user.googleAvatarUrl && picture) {
      updates.googleAvatarUrl = picture;
    }
    if (user.authProvider === "LOCAL") {
      updates.authProvider = "LOCAL_GOOGLE";
    }
    if (Object.keys(updates).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updates,
        include: { company: true },
      });
    }
  }

  const jwtToken = signToken({ id: user.id, role: user.role, companyId: user.companyId });

  return {
    token: jwtToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      avatarUrl: user.avatarUrl || null,
      googleAvatarUrl: user.googleAvatarUrl || null,
    },
    company: {
      id: user.company.id,
      name: user.company.name,
      plan: user.company.plan,
    },
  };
};

export const forgotPasswordService = async ({ email }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return { message: "If that email exists, a reset link has been sent." };
  }

  const { token, tokenHash } = generateResetToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = "Reset your password";
  const html = buildPasswordResetEmail({
    name: user.name,
    resetUrl,
    expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
  });
  const text = `Hi ${user.name || "there"},\n\nWe received a request to reset your password. Use the link below within ${PASSWORD_RESET_EXPIRY_MINUTES} minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;

  try {
    await sendEmail({
      to: user.email,
      subject,
      html,
      text,
      headers: getHighPriorityHeaders(),
    });
  } catch (error) {
    console.error("Password reset email failed:", error.message);
  }

  return { message: "If that email exists, a reset link has been sent." };
};

export const resetPasswordService = async ({ token, password }) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    include: {
      user: true,
    },
  });

  if (!resetToken) {
    throw new Error("Invalid or expired reset token");
  }

  const newPasswordHash = await hashPassword(password);
  const currentProvider = resetToken.user.authProvider;
  const nextProvider = currentProvider === "GOOGLE" ? "LOCAL_GOOGLE" : currentProvider;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: newPasswordHash,
        authProvider: nextProvider,
      },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: resetToken.userId, usedAt: null },
      data: { usedAt: now },
    }),
  ]);

  return { message: "Password has been reset successfully." };
};

export const adminResetPasswordService = async ({ actorId, companyId, targetUserId }) => {
  const targetUser = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      companyId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  if (targetUser.role === "SUPER_ADMIN") {
    throw new Error("Not allowed");
  }

  const { token, tokenHash } = generateResetToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: targetUser.id,
      tokenHash,
      expiresAt,
    },
  });

  try {
    await prisma.passwordResetAuditLog.create({
      data: {
        companyId,
        actorId,
        targetUserId: targetUser.id,
      },
    });
  } catch (error) {
    console.error("Password reset audit log failed:", error.message);
  }

  const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = "Your password was reset by an admin";
  const html = buildPasswordResetEmail({
    name: targetUser.name,
    resetUrl,
    expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
  });
  const text = `Hi ${targetUser.name || "there"},\n\nAn admin requested a password reset for your account. Use the link below within ${PASSWORD_RESET_EXPIRY_MINUTES} minutes:\n${resetUrl}\n\nIf you did not request this, contact your admin.`;

  try {
    await sendEmail({
      to: targetUser.email,
      subject,
      html,
      text,
      headers: getHighPriorityHeaders(),
    });
  } catch (error) {
    console.error("Admin password reset email failed:", error.message);
  }

  return { message: "Password reset email sent." };
};
