import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Authentication token is required");
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, authVersion: true, createdAt: true },
    });

    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    const tokenAuthVersion = typeof payload.av === "number" ? payload.av : 0;
    if (tokenAuthVersion !== user.authVersion) {
      throw new ApiError(401, "Session is no longer valid");
    }

    req.user = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Invalid or expired token");
  }
});
