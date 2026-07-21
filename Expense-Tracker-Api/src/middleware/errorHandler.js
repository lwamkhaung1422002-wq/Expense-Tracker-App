import { Prisma } from "@prisma/client";
import { logError } from "../lib/logger.js";
import { ApiError } from "../utils/apiError.js";

export function notFound(_req, _res, next) {
  next(new ApiError(404, "Route not found"));
}

export function errorHandler(error, req, res, _next) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A record with this value already exists", requestId: req.id });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Record not found", requestId: req.id });
    }
  }

  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    logError("request_failed", {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      message: error.message,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });
  }

  const payload = {
    message: statusCode >= 500 ? "Internal server error" : error.message,
    requestId: req.id,
  };

  if (error.details) payload.details = error.details;
  if (process.env.NODE_ENV !== "production" && statusCode >= 500) payload.stack = error.stack;

  return res.status(statusCode).json(payload);
}
