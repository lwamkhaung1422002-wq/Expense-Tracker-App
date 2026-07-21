import { Router } from "express";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../utils/validators.js";

const router = Router();

const defaultCategories = [
  { name: "Salary", color: "#2E7D32", type: "INCOME" },
  { name: "Other Income", color: "#00897B", type: "INCOME" },
  { name: "Food", color: "#F57C00", type: "EXPENSE" },
  { name: "Transport", color: "#1976D2", type: "EXPENSE" },
  { name: "Bills", color: "#7B1FA2", type: "EXPENSE" },
  { name: "Shopping", color: "#C2185B", type: "EXPENSE" },
  { name: "Health", color: "#D32F2F", type: "EXPENSE" },
  { name: "Other", color: "#607D8B", type: null },
];

const defaultWallets = [
  { name: "Cash", type: "Cash", maskedNumber: null, balanceCents: 0, color: "#22C55E" },
  { name: "Mobile Wallet", type: "Mobile Wallet", maskedNumber: null, balanceCents: 0, color: "#2563EB" },
  { name: "Mobile Banking", type: "Mobile Banking", maskedNumber: null, balanceCents: 0, color: "#0F766E" },
  { name: "Card", type: "Card", maskedNumber: null, balanceCents: 0, color: "#3B5BFF" },
];

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(180).transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(100).regex(/[A-Za-z]/, "Password must include a letter").regex(/\d/, "Password must include a number"),
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(20),
  password: z.string().min(8).max(100).regex(/[A-Za-z]/, "Password must include a letter").regex(/\d/, "Password must include a number"),
});

function signToken(user) {
  return jwt.sign({ av: user.authVersion }, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.jwtExpiresIn,
  });
}

function authResponse(user) {
  return {
    user: { id: user.id, name: user.name, email: user.email },
    token: signToken(user),
  };
}

function hashResetToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const passwordHash = await bcrypt.hash(req.body.password, 12);

    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        passwordHash,
        authVersion: 0,
        categories: { create: defaultCategories },
        wallets: { create: defaultWallets },
      },
    });

    res.status(201).json(authResponse(user));
  }),
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!passwordMatches) {
      throw new ApiError(401, "Invalid email or password");
    }

    res.json(authResponse(user));
  }),
);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    const response = {
      message: "If an account exists for that email, a password reset link has been prepared.",
    };

    if (!user) {
      res.json(response);
      return;
    }

    const resetToken = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: hashResetToken(resetToken),
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    if (env.nodeEnv !== "production") {
      response.resetToken = resetToken;
    }

    res.json(response);
  }),
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const resetTokenHash = hashResetToken(req.body.token);
    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new ApiError(400, "Reset token is invalid or expired");
    }

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        authVersion: { increment: 1 },
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });

    res.json({ message: "Password has been reset. You can now log in." });
  }),
);

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
