import { Router } from "express";
import { DateTime } from "luxon";
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

function walletDeltaCents(transaction) {
  if (!transaction?.walletId) return 0;
  return transaction.type === "INCOME" ? transaction.amountCents : -transaction.amountCents;
}

function reverseWalletDeltaCents(transaction) {
  return -walletDeltaCents(transaction);
}

function assertTransactionEditable(transaction) {
  const lockedAt = DateTime.fromJSDate(transaction.date, { zone: "utc" }).plus({ months: 1 });
  if (lockedAt < DateTime.utc()) {
    throw new ApiError(409, "Transactions older than one month cannot be edited or deleted");
  }
}

function assertDateInEditableWindow(date) {
  const lockedAt = DateTime.fromJSDate(date, { zone: "utc" }).plus({ months: 1 });
  if (lockedAt < DateTime.utc()) {
    throw new ApiError(400, "Transaction date cannot be older than one month");
  }
}

async function assertWalletCanApply(tx, userId, ...transactions) {
  const balanceChanges = new Map();
  for (const transaction of transactions) {
    const delta = walletDeltaCents(transaction);
    if (!transaction?.walletId || delta === 0) continue;
    balanceChanges.set(transaction.walletId, (balanceChanges.get(transaction.walletId) || 0) + delta);
  }

  for (const [walletId, delta] of balanceChanges.entries()) {
    if (delta >= 0) continue;
    const wallet = await tx.wallet.findFirst({ where: { id: walletId, userId } });
    if (!wallet) throw new ApiError(400, "Wallet is invalid");
    if (wallet.balanceCents + delta < 0) {
      throw new ApiError(400, `Insufficient balance in ${wallet.name}. Increase the wallet balance before recording this expense.`);
    }
  }
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

    const amountCents = toCents(req.body.amount);
    const transaction = await prisma.$transaction(async (tx) => {
      await assertWalletCanApply(tx, req.user.id, {
        type: req.body.type,
        amountCents,
        walletId: req.body.walletId || null,
      });
      const created = await tx.transaction.create({
        data: {
          type: req.body.type,
          amountCents,
          date: occurredAt,
          description: req.body.description,
          note: req.body.note || null,
          categoryId: req.body.categoryId,
          walletId: req.body.walletId || null,
          userId: req.user.id,
        },
        include: { category: true, wallet: true },
      });
      if (created.walletId) {
        await tx.wallet.update({
          where: { id: created.walletId },
          data: { balanceCents: { increment: walletDeltaCents(created) } },
        });
      }
      return created;
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
    assertTransactionEditable(existing);
    await assertCategory(req.user.id, req.body.categoryId, req.body.type);
    await assertWallet(req.user.id, req.body.walletId);
    const occurredAt = parseOptionalTimestamp(req.body.date);
    if (occurredAt) assertDateInEditableWindow(occurredAt);

    const amountCents = toCents(req.body.amount);
    const transaction = await prisma.$transaction(async (tx) => {
      const rollbackExisting = {
        type: existing.type === "INCOME" ? "EXPENSE" : "INCOME",
        amountCents: existing.amountCents,
        walletId: existing.walletId,
      };
      const proposed = {
        type: req.body.type,
        amountCents,
        walletId: req.body.walletId || null,
      };
      await assertWalletCanApply(tx, req.user.id, rollbackExisting, proposed);

      if (existing.walletId) {
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: { balanceCents: { increment: reverseWalletDeltaCents(existing) } },
        });
      }

      const updated = await tx.transaction.update({
        where: { id: req.params.id },
        data: {
          type: req.body.type,
          amountCents,
          ...(occurredAt ? { date: occurredAt } : {}),
          description: req.body.description,
          note: req.body.note || null,
          categoryId: req.body.categoryId,
          walletId: req.body.walletId || null,
        },
        include: { category: true, wallet: true },
      });

      if (updated.walletId) {
        await tx.wallet.update({
          where: { id: updated.walletId },
          data: { balanceCents: { increment: walletDeltaCents(updated) } },
        });
      }
      return updated;
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
    assertTransactionEditable(existing);

    await prisma.$transaction(async (tx) => {
      if (existing.walletId) {
        await tx.wallet.update({
          where: { id: existing.walletId },
          data: { balanceCents: { increment: reverseWalletDeltaCents(existing) } },
        });
      }
      await tx.transaction.delete({ where: { id: req.params.id } });
    });
    res.status(204).send();
  }),
);

export default router;
