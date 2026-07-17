import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toCents, fromCents } from "../utils/money.js";
import { validate } from "../utils/validators.js";

const router = Router();

const budgetSchema = z.object({
  name: z.string().trim().min(1).max(80),
  amount: z.coerce.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  categoryId: z.string().optional().nullable(),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B5BFF"),
});

function serialize(budget) {
  return { ...budget, amount: fromCents(budget.amountCents), amountCents: undefined };
}

async function assertCategory(userId, categoryId) {
  if (!categoryId) return null;
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId, OR: [{ type: "EXPENSE" }, { type: null }] } });
  if (!category) throw new ApiError(400, "Budget category is invalid");
  return category;
}

router.get("/", asyncHandler(async (req, res) => {
  const month = req.query.month;
  const where = { userId: req.user.id };
  if (month) where.month = month;
  const budgets = await prisma.budget.findMany({ where, include: { category: true }, orderBy: { createdAt: "asc" } });
  res.json({ budgets: budgets.map(serialize) });
}));

router.post("/", validate(budgetSchema), asyncHandler(async (req, res) => {
  await assertCategory(req.user.id, req.body.categoryId);
  const budget = await prisma.budget.create({
    data: {
      name: req.body.name,
      amountCents: toCents(req.body.amount),
      month: req.body.month,
      categoryId: req.body.categoryId || null,
      color: req.body.color,
      userId: req.user.id,
    },
    include: { category: true },
  });
  res.status(201).json({ budget: serialize(budget) });
}));

router.put("/:id", validate(budgetSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.budget.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) throw new ApiError(404, "Budget not found");
  await assertCategory(req.user.id, req.body.categoryId);
  const budget = await prisma.budget.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name,
      amountCents: toCents(req.body.amount),
      month: req.body.month,
      categoryId: req.body.categoryId || null,
      color: req.body.color,
    },
    include: { category: true },
  });
  res.json({ budget: serialize(budget) });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.budget.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) throw new ApiError(404, "Budget not found");
  await prisma.budget.delete({ where: { id: req.params.id } });
  res.status(204).send();
}));

export default router;
