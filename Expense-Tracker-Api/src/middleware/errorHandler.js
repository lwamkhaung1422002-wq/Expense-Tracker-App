import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/apiError.js";

export function notFound(_req, _res, next) {
  next(new ApiError(404, "Route not found"));
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A record with this value already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Record not found" });
    }
  }

  const statusCode = error.statusCode || 500;
  const payload = {
    message: statusCode >= 500 ? "Internal server error" : error.message,
  };

  if (error.details) payload.details = error.details;
  if (process.env.NODE_ENV !== "production" && statusCode >= 500) payload.stack = error.stack;

  return res.status(statusCode).json(payload);
}
