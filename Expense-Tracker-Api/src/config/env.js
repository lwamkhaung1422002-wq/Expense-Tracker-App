import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const weakJwtSecrets = new Set([
  "change-this-long-random-secret-before-production",
  "replace-with-a-long-random-production-secret",
  "secret",
  "password",
  "changeme",
]);

const nodeEnv = process.env.NODE_ENV || "development";
const defaultClientOrigins =
  nodeEnv === "production"
    ? "https://expense-tracker-lkjaden.netlify.app"
    : "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5190,http://127.0.0.1:5190";
const rawClientOrigins =
  nodeEnv === "production"
    ? process.env.CLIENT_ORIGIN || defaultClientOrigins
    : [process.env.CLIENT_ORIGIN, defaultClientOrigins].filter(Boolean).join(",");

function normalizeOrigin(origin) {
  return origin
    .replace(/^CLIENT_ORIGIN=/i, "")
    .replace(/^VITE_API_URL=/i, "")
    .replace(/^VITE_API_BASE_URL=/i, "")
    .trim()
    .replace(/\/$/, "");
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || (nodeEnv === "production" ? 8080 : 4000)),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  trustProxy: process.env.TRUST_PROXY === "true",
  clientOrigins: rawClientOrigins
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean)
    .filter((origin, index, origins) => origins.indexOf(origin) === index)
    .filter((origin) => nodeEnv !== "production" || (!origin.includes("localhost") && !origin.includes("127.0.0.1"))),
};

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET is required");
}

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const isPostgresUrl = env.databaseUrl.startsWith("postgresql://") || env.databaseUrl.startsWith("postgres://");
const isLocalSqliteUrl = env.nodeEnv !== "production" && env.databaseUrl.startsWith("file:");

if (!isPostgresUrl && !isLocalSqliteUrl) {
  throw new Error("DATABASE_URL must be PostgreSQL, or file: SQLite for local development");
}

if (env.nodeEnv === "production" && !isPostgresUrl) {
  throw new Error("DATABASE_URL must be a PostgreSQL connection string in production");
}

if (env.nodeEnv === "production") {
  if (env.jwtSecret.length < 32 || weakJwtSecrets.has(env.jwtSecret)) {
    throw new Error("JWT_SECRET must be a strong production secret with at least 32 characters");
  }

  if (!env.clientOrigins.length) console.warn("CLIENT_ORIGIN is empty. Browser CORS access will be blocked until set.");
}
