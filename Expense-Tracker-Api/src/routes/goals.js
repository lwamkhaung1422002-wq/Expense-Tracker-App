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

function serialize(goal) {
  return { ...goal, target: fromCents(goal.targetCents), saved: fromCents(goal.savedCents), targetCents: undefined, savedCents: undefined };
}

router.get("/", asyncHandler(async (req, res) => {
  const goals = await prisma.goal.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: "asc" } });
  res.json({ goals: goals.map(serialize) });
}));

router.post("/", validate(goalSchema), asyncHandler(async (req, res) => {
  const goal = await prisma.goal.create({
    data: {
      name: req.body.name,
      targetCents: toCents(req.body.target),
      savedCents: toCents(req.body.saved),
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
  const goal = await prisma.goal.update({
    where: { id: req.params.id },
    data: {
      name: req.body.name,
      targetCents: toCents(req.body.target),
      savedCents: toCents(req.body.saved),
      deadline: req.body.deadline || null,
      color: req.body.color,
    },
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
