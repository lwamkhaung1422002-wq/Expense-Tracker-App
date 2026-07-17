import { app } from "./app.js";
import { env } from "./config/env.js";
import { enableSqliteProductionSafeguards, prisma } from "./lib/prisma.js";

async function start() {
  await enableSqliteProductionSafeguards();

  const server = app.listen(env.port, () => {
    console.log(`Expense Tracker API listening on http://localhost:${env.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
