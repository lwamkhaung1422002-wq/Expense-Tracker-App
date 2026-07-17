import dotenv from "dotenv";

dotenv.config({ quiet: true });

const weakJwtSecrets = new Set([
  "change-this-long-random-secret-before-production",
  "replace-with-a-long-random-production-secret",
  "secret",
  "password",
  "changeme",
]);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  trustProxy: process.env.TRUST_PROXY === "true",
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET is required");
}

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

if (!env.databaseUrl.startsWith("postgresql://") && !env.databaseUrl.startsWith("postgres://")) {
  throw new Error("DATABASE_URL must be a PostgreSQL connection string");
}

if (env.nodeEnv === "production") {
  if (env.jwtSecret.length < 32 || weakJwtSecrets.has(env.jwtSecret)) {
    throw new Error("JWT_SECRET must be a strong production secret with at least 32 characters");
  }

  if (env.clientOrigins.some((origin) => origin.includes("localhost") || origin.includes("127.0.0.1"))) {
    throw new Error("CLIENT_ORIGIN must not include localhost origins in production");
  }
}
