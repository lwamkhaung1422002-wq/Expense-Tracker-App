import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fromCents } from "../utils/money.js";
import { localDateKey, monthRange } from "../utils/time.js";

const router = Router();

router.get(
  "/monthly",
  asyncHandler(async (req, res) => {
    const selectedMonth = req.query.month || new Date().toISOString().slice(0, 7);
    const { start, end, timezone } = monthRange(selectedMonth, req.query.timezone);

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id, date: { gte: start, lt: end } },
      include: { category: true, wallet: true },
      orderBy: { date: "asc" },
    });

    const totals = { incomeCents: 0, expenseCents: 0 };
    const categoryMap = new Map();
    const dailyMap = new Map();

    for (const transaction of transactions) {
      if (transaction.type === "INCOME") totals.incomeCents += transaction.amountCents;
      if (transaction.type === "EXPENSE") totals.expenseCents += transaction.amountCents;

      const categoryKey = `${transaction.categoryId}:${transaction.type}`;
      const categoryRow = categoryMap.get(categoryKey) || {
        categoryId: transaction.categoryId,
        categoryName: transaction.category.name,
        color: transaction.category.color,
        type: transaction.type,
        totalCents: 0,
      };
      categoryRow.totalCents += transaction.amountCents;
      categoryMap.set(categoryKey, categoryRow);

      const day = localDateKey(transaction.date, timezone);
      const dailyRow = dailyMap.get(day) || { date: day, incomeCents: 0, expenseCents: 0 };
      if (transaction.type === "INCOME") dailyRow.incomeCents += transaction.amountCents;
      if (transaction.type === "EXPENSE") dailyRow.expenseCents += transaction.amountCents;
      dailyMap.set(day, dailyRow);
    }

    res.json({
      month: selectedMonth,
      totals: {
        income: fromCents(totals.incomeCents),
        expense: fromCents(totals.expenseCents),
        net: fromCents(totals.incomeCents - totals.expenseCents),
      },
      categoryBreakdown: [...categoryMap.values()].map((row) => ({
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        color: row.color,
        type: row.type,
        total: fromCents(row.totalCents),
      })),
      dailyTrend: [...dailyMap.values()].map((row) => ({
        date: row.date,
        income: fromCents(row.incomeCents),
        expense: fromCents(row.expenseCents),
        net: fromCents(row.incomeCents - row.expenseCents),
      })),
      recentTransactions: transactions
        .slice()
        .reverse()
        .slice(0, 8)
        .map((transaction) => ({
          id: transaction.id,
          type: transaction.type,
          amount: fromCents(transaction.amountCents),
          date: transaction.date,
          occurredAt: transaction.date,
          description: transaction.description,
          category: transaction.category,
          wallet: transaction.wallet,
        })),
    });
  }),
);

export default router;
