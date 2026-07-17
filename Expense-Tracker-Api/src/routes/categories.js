import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { transactionTypeSchema, validate } from "../utils/validators.js";

const router = Router();

const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).default("#607D8B"),
  type: transactionTypeSchema.nullable().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      where: { userId: req.user.id },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    res.json({ categories });
  }),
);

router.post(
  "/",
  validate(categorySchema),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.create({
      data: { ...req.body, userId: req.user.id },
    });
    res.status(201).json({ category });
  }),
);

router.put(
  "/:id",
  validate(categorySchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) throw new ApiError(404, "Category not found");

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ category });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { _count: { select: { transactions: true } } },
    });
    if (!existing) throw new ApiError(404, "Category not found");
    if (existing._count.transactions > 0) {
      throw new ApiError(409, "Category is used by transactions");
    }

    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

export default router;
