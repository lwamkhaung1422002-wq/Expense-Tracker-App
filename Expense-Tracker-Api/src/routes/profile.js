import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../utils/validators.js";

const router = Router();

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  currency: z.string().trim().min(3).max(3).default("USD"),
  monthlyBudget: z.coerce.number().positive().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100).regex(/[A-Za-z]/, "Password must include a letter").regex(/\d/, "Password must include a number"),
});

router.get("/", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, currency: true, monthlyBudgetCents: true },
  });
  res.json({ user: { ...user, monthlyBudget: user.monthlyBudgetCents / 100, monthlyBudgetCents: undefined } });
}));

router.put("/", validate(profileSchema), asyncHandler(async (req, res) => {
  const data = {
    name: req.body.name,
    currency: req.body.currency.toUpperCase(),
  };
  if (req.body.monthlyBudget != null) data.monthlyBudgetCents = Math.round(req.body.monthlyBudget * 100);

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: { id: true, name: true, email: true, currency: true, monthlyBudgetCents: true },
  });
  res.json({ user: { ...user, monthlyBudget: user.monthlyBudgetCents / 100, monthlyBudgetCents: undefined } });
}));

router.put("/password", validate(passwordSchema), asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, passwordHash: true },
  });

  if (!user) throw new ApiError(404, "User not found");

  const passwordMatches = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(400, "Current password is incorrect");
  }

  const samePassword = await bcrypt.compare(req.body.newPassword, user.passwordHash);
  if (samePassword) {
    throw new ApiError(400, "New password must be different from the current password");
  }

  const passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      passwordHash,
      authVersion: { increment: 1 },
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });

  res.json({ message: "Password changed successfully. Please sign in again." });
}));

export default router;
