import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toCents, fromCents } from "../utils/money.js";
import { validate } from "../utils/validators.js";

const router = Router();

const walletSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.string().trim().min(1).max(40).default("Card"),
  maskedNumber: z.string().trim().max(20).optional().nullable(),
  balance: z.coerce.number().default(0),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B5BFF"),
});

function serialize(wallet) {
  return { ...wallet, balance: fromCents(wallet.balanceCents), balanceCents: undefined };
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
      maskedNumber: req.body.maskedNumber || null,
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
      maskedNumber: req.body.maskedNumber || null,
      balanceCents: toCents(req.body.balance),
      color: req.body.color,
    },
  });
  res.json({ wallet: serialize(wallet) });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.wallet.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) throw new ApiError(404, "Wallet not found");
  await prisma.$transaction([
    prisma.transaction.updateMany({
      where: { walletId: req.params.id, userId: req.user.id },
      data: { walletId: null },
    }),
    prisma.wallet.delete({ where: { id: req.params.id } }),
  ]);
  res.status(204).send();
}));

export default router;
