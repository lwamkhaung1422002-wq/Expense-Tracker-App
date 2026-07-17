import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fromCents, toCents } from "../utils/money.js";
import { monthRange, parseOptionalTimestamp } from "../utils/time.js";
import { transactionTypeSchema, validate } from "../utils/validators.js";

const router = Router();

const baseTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: z.coerce.number().positive().max(999999999),
  description: z.string().trim().min(1).max(140),
  note: z.string().trim().max(500).optional().nullable(),
  categoryId: z.string().min(1),
  walletId: z.string().optional().nullable(),
});

const createTransactionSchema = baseTransactionSchema.extend({
  date: z.string().optional().nullable(),
});

const updateTransactionSchema = baseTransactionSchema.extend({
  date: z.string().optional().nullable(),
});

function serialize(transaction) {
  return {
    ...transaction,
    amount: fromCents(transaction.amountCents),
    amountCents: undefined,
    occurredAt: transaction.date,
  };
}

async function assertCategory(userId, categoryId, type) {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
      OR: [{ type }, { type: null }],
    },
  });
  if (!category) throw new ApiError(400, "Category is invalid for this transaction type");
  return category;
}

async function assertWallet(userId, walletId) {
  if (!walletId) return null;
  const wallet = await prisma.wallet.findFirst({ where: { id: walletId, userId } });
  if (!wallet) throw new ApiError(400, "Wallet is invalid");
  return wallet;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { month, type } = req.query;
    const where = { userId: req.user.id };

    if (type === "INCOME" || type === "EXPENSE") where.type = type;
    if (month) {
      const { start, end } = monthRange(month, req.query.timezone);
      where.date = { gte: start, lt: end };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true, wallet: true },
      orderBy: { date: "desc" },
    });
    res.json({ transactions: transactions.map(serialize) });
  }),
);

router.post(
  "/",
  validate(createTransactionSchema),
  asyncHandler(async (req, res) => {
    await assertCategory(req.user.id, req.body.categoryId, req.body.type);
    await assertWallet(req.user.id, req.body.walletId);
    const occurredAt = parseOptionalTimestamp(req.body.date) || new Date();

    const transaction = await prisma.transaction.create({
      data: {
        type: req.body.type,
        amountCents: toCents(req.body.amount),
        date: occurredAt,
        description: req.body.description,
        note: req.body.note || null,
        categoryId: req.body.categoryId,
        walletId: req.body.walletId || null,
        userId: req.user.id,
      },
      include: { category: true, wallet: true },
    });
    res.status(201).json({ transaction: serialize(transaction) });
  }),
);

router.put(
  "/:id",
  validate(updateTransactionSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) throw new ApiError(404, "Transaction not found");
    await assertCategory(req.user.id, req.body.categoryId, req.body.type);
    await assertWallet(req.user.id, req.body.walletId);
    const occurredAt = parseOptionalTimestamp(req.body.date);

    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        type: req.body.type,
        amountCents: toCents(req.body.amount),
        ...(occurredAt ? { date: occurredAt } : {}),
        description: req.body.description,
        note: req.body.note || null,
        categoryId: req.body.categoryId,
        walletId: req.body.walletId || null,
      },
      include: { category: true, wallet: true },
    });
    res.json({ transaction: serialize(transaction) });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) throw new ApiError(404, "Transaction not found");

    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

export default router;
