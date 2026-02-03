import { prisma } from "../../config/db.js";
import { OAuth2Client } from "google-auth-library";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { signToken } from "../../utils/jwt.js";

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
    // Fallback: Verify as Access Token
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Invalid Access Token');
      }

      const userInfo = await response.json();
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
    } catch (innerError) {
      throw new Error('Google Authentication Failed');
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
    // Update avatar if missing
    if (!user.googleAvatarUrl && picture) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleAvatarUrl: picture },
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
