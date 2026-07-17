import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fromCents } from "../utils/money.js";
import { ApiError } from "../utils/apiError.js";
import { buildReportSeries, monthRange, normalizeTimezone, reportBucketKey, yearRange } from "../utils/time.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const period = req.query.period || "monthly";
  const year = Number(req.query.year || new Date().getUTCFullYear());
  const month = typeof req.query.month === "string" && /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : `${year}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
  const timezone = normalizeTimezone(req.query.timezone);
  if (!["daily", "weekly", "monthly", "yearly"].includes(period)) throw new ApiError(400, "period must be daily, weekly, monthly, or yearly");

  let start;
  let end;
  if (period === "daily" || period === "weekly") {
    const range = monthRange(month, timezone);
    start = range.start;
    end = range.end;
  } else if (period === "monthly") {
    const range = yearRange(year, timezone);
    start = range.start;
    end = range.end;
  } else {
    const range = yearRange(year - 4, timezone, 5);
    start = range.start;
    end = range.end;
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id, date: { gte: start, lt: end } },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  const series = buildReportSeries(period, year, month, start, end, timezone);
  const categoryMap = new Map();

  for (const transaction of transactions) {
    const key = reportBucketKey(period, transaction.date, timezone);
    const row = series.find((item) => item.key === key);
    if (row && transaction.type === "INCOME") row.incomeCents += transaction.amountCents;
    if (row && transaction.type === "EXPENSE") row.expenseCents += transaction.amountCents;
    if (transaction.type === "EXPENSE") {
      const row = categoryMap.get(transaction.categoryId) || {
        categoryId: transaction.categoryId,
        categoryName: transaction.category.name,
        color: transaction.category.color,
        totalCents: 0,
      };
      row.totalCents += transaction.amountCents;
      categoryMap.set(transaction.categoryId, row);
    }
  }

  res.json({
    period,
    year,
    month,
    timezone,
    series: series.map((row) => ({
      key: row.key,
      label: row.label,
      income: fromCents(row.incomeCents),
      expense: fromCents(row.expenseCents),
      net: fromCents(row.incomeCents - row.expenseCents),
    })),
    monthly: period === "monthly" ? series.map((row) => ({
      month: row.key,
      income: fromCents(row.incomeCents),
      expense: fromCents(row.expenseCents),
      net: fromCents(row.incomeCents - row.expenseCents),
    })) : undefined,
    categories: [...categoryMap.values()].map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      color: row.color,
      total: fromCents(row.totalCents),
    })),
  });
}));

export default router;
