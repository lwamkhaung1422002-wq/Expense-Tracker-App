import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toCents, fromCents } from "../utils/money.js";
import { validate } from "../utils/validators.js";

const router = Router();

const walletTypes = ["Cash", "Mobile Wallet", "Mobile Banking", "Card"];

const walletSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(walletTypes).default("Card"),
  maskedNumber: z.string().trim().max(20).optional().nullable(),
  balance: z.coerce.number().default(0),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B5BFF"),
}).superRefine((value, ctx) => {
  if (value.type === "Mobile Wallet" && !value.maskedNumber?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["maskedNumber"],
      message: "Phone number is required for a mobile wallet",
    });
  }
});

function serialize(wallet) {
  return { ...wallet, balance: fromCents(wallet.balanceCents), balanceCents: undefined };
}

function walletIdentifier(body) {
  return body.type === "Cash" ? null : body.maskedNumber || null;
}

router.get("/", asyncHandler(async (req, res) => {
  const wallets = await prisma.wallet.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "asc" } });
  res.json({ wallets: wallets.map(serialize) });
}));

router.post("/", validate(walletSchema), asyncHandler(async (req, res) => {
  const wallet = await prisma.wallet.create({
    data: {
      name: req.body.name,
      type: req.body.type,
      maskedNumber: walletIdentifier(req.body),
      balanceCents: toCents(req.body.balance),
      color: req.body.color,
      userId: req.user.id,
    },
  });
  res.status(201).json({ wallet: serialize(wallet) });
}));

router.put("/:id", validate(walletSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.wallet.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) throw new ApiError(404, "Wallet not found");
  const wallet = await prisma.wallet.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name,
      type: req.body.type,
      maskedNumber: walletIdentifier(req.body),
      balanceCents: toCents(req.body.balance),
      color: req.body.color,
    },
  });
  res.json({ wallet: serialize(wallet) });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.wallet.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) throw new ApiError(404, "Wallet not found");
  const transactionCount = await prisma.transaction.count({ where: { walletId: req.params.id, userId: req.user.id } });
  if (transactionCount > 0) {
    throw new ApiError(409, "Delete this wallet's transactions before deleting the wallet");
  }
  await prisma.wallet.delete({ where: { id: req.params.id } });
  res.status(204).send();
}));

export default router;
