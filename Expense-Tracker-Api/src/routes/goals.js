import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toCents, fromCents } from "../utils/money.js";
import { validate } from "../utils/validators.js";

const router = Router();

const goalSchema = z.object({
  name: z.string().trim().min(1).max(100),
  target: z.coerce.number().positive(),
  saved: z.coerce.number().min(0).default(0),
  deadline: z.coerce.date().optional().nullable(),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B5BFF"),
});

const contributionSchema = z.object({
  amount: z.coerce.number().positive(),
});

function serialize(goal) {
  return { ...goal, target: fromCents(goal.targetCents), saved: fromCents(goal.savedCents), targetCents: undefined, savedCents: undefined };
}

router.get("/", asyncHandler(async (req, res) => {
  const goals = await prisma.goal.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "asc" } });
  res.json({ goals: goals.map(serialize) });
}));

router.post("/", validate(goalSchema), asyncHandler(async (req, res) => {
  const targetCents = toCents(req.body.target);
  const savedCents = toCents(req.body.saved);
  if (savedCents > targetCents) throw new ApiError(400, "Saved amount cannot be greater than target amount");
  const goal = await prisma.goal.create({
    data: {
      name: req.body.name,
      targetCents,
      savedCents,
      deadline: req.body.deadline || null,
      color: req.body.color,
      userId: req.user.id,
    },
  });
  res.status(201).json({ goal: serialize(goal) });
}));

router.put("/:id", validate(goalSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) throw new ApiError(404, "Goal not found");
  const targetCents = toCents(req.body.target);
  const savedCents = toCents(req.body.saved);
  if (savedCents > targetCents) throw new ApiError(400, "Saved amount cannot be greater than target amount");
  const goal = await prisma.goal.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name,
      targetCents,
      savedCents,
      deadline: req.body.deadline || null,
      color: req.body.color,
    },
  });
  res.json({ goal: serialize(goal) });
}));

router.post("/:id/contributions", validate(contributionSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) throw new ApiError(404, "Goal not found");

  const amountCents = toCents(req.body.amount);
  if (existing.savedCents + amountCents > existing.targetCents) {
    throw new ApiError(400, "Contribution exceeds the remaining goal amount");
  }

  const goal = await prisma.goal.update({
    where: { id: req.params.id },
    data: { savedCents: { increment: amountCents } },
  });
  res.json({ goal: serialize(goal) });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.user.id } });
  if (!existing) throw new ApiError(404, "Goal not found");
  await prisma.goal.delete({ where: { id: req.params.id } });
  res.status(204).send();
}));

export default router;
