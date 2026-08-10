import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { startPrismaDevServer } from "@prisma/dev";
import { startDatabaseLockCoordinator } from "./database-lock-coordinator.mjs";

const node = process.execPath;
const prisma = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));
const tsx = fileURLToPath(new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url));

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} завершился с кодом ${code}`));
    });
  });
}

const server = await startPrismaDevServer({
  name: `vx-house-part6-${process.pid}`,
  port: 0,
  databasePort: 0,
  shadowDatabasePort: 0,
  persistenceMode: "stateless",
});

const databaseUrl = server.database.connectionString;
const databaseLock = await startDatabaseLockCoordinator();
const env = {
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: databaseUrl,
  DIRECT_URL: databaseUrl,
  TEST_DATABASE_URL: databaseUrl,
  VX_DATABASE_LOCK_URL: databaseLock.url,
  VX_DATABASE_LOCK_SECRET: databaseLock.secret,
};

try {
  await run(node, [prisma, "migrate", "deploy"], env);
  await run(node, [prisma, "validate"], env);
  await run(node, [prisma, "generate"], env);
  const defaultTestFiles = [
    "tests/registration-production.unit.test.mts",
    "tests/database-invariants.integration.test.mts",
    "tests/identity-profile-consent.integration.test.mts",
    "tests/functional-identity-onboarding.integration.test.mts",
    "tests/password-reset.integration.test.mts",
    "tests/functional-analytics.integration.test.mts",
    "tests/registration-stabilization.integration.test.mts",
    "tests/functional-opportunities-tasks.integration.test.mts",
    "tests/functional-economy-rewards.integration.test.mts",
    "tests/functional-support-notifications.integration.test.mts",
    "tests/functional-admin-cms-moderation.integration.test.mts",
    "tests/functional-platform-operations.integration.test.mts",
  ];
  const testFiles = process.argv.length > 2 ? process.argv.slice(2) : defaultTestFiles;
  for (const file of testFiles) await run(node, [tsx, "--conditions=react-server", "--test", "--test-concurrency=1", file], env);
} finally {
  await databaseLock.close();
  await server.close?.();
}
