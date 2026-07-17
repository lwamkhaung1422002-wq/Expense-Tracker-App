import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import budgetRoutes from "./routes/budgets.js";
import categoryRoutes from "./routes/categories.js";
import goalRoutes from "./routes/goals.js";
import profileRoutes from "./routes/profile.js";
import reportRoutes from "./routes/reports.js";
import summaryRoutes from "./routes/summary.js";
import transactionRoutes from "./routes/transactions.js";
import walletRoutes from "./routes/wallets.js";

export const app = express();

app.set("etag", false);
app.disable("x-powered-by");
if (env.trustProxy) app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many password reset attempts. Please try again later." },
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.json({
    name: "Expense Tracker API",
    status: "ok",
    health: "/health",
  });
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", passwordResetLimiter);
app.use("/api/auth/reset-password", passwordResetLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/categories", requireAuth, categoryRoutes);
app.use("/api/transactions", requireAuth, transactionRoutes);
app.use("/api/summary", requireAuth, summaryRoutes);
app.use("/api/wallets", requireAuth, walletRoutes);
app.use("/api/budgets", requireAuth, budgetRoutes);
app.use("/api/goals", requireAuth, goalRoutes);
app.use("/api/profile", requireAuth, profileRoutes);
app.use("/api/reports", requireAuth, reportRoutes);

app.use(notFound);
app.use(errorHandler);
