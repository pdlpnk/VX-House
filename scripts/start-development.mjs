import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ServerAlreadyRunningError, startPrismaDevServer } from "@prisma/dev";
import { getServerStatus } from "@prisma/dev/internal/state";
import { startDatabaseLockCoordinator } from "./database-lock-coordinator.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const prisma = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));
const tsx = fileURLToPath(new URL("../node_modules/tsx/dist/cli.mjs", import.meta.url));

function run(command, args, env, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: "inherit",
      ...options,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0 || signal === "SIGINT" || signal === "SIGTERM") resolve(code ?? 0);
      else reject(new Error(`${command} завершился с кодом ${code ?? "unknown"}`));
    });
  });
}

function developmentEnvironment(databaseUrl, databaseLock) {
  const localDataProtectionKey = createHash("sha256")
    .update("vx-house-local-development-data-protection-v1")
    .digest("base64url");
  return {
    ...process.env,
    NODE_ENV: "development",
    DATABASE_URL: databaseUrl,
    DIRECT_URL: databaseUrl,
    SESSION_SECRET: process.env.SESSION_SECRET ?? randomBytes(48).toString("base64url"),
    RATE_LIMIT_SECRET: process.env.RATE_LIMIT_SECRET ?? randomBytes(48).toString("base64url"),
    DATA_PROTECTION_KEY_ID: process.env.DATA_PROTECTION_KEY_ID ?? "local.primary",
    DATA_PROTECTION_KEY: process.env.DATA_PROTECTION_KEY ?? localDataProtectionKey,
    EMAIL_VERIFICATION_SECRET:
      process.env.EMAIL_VERIFICATION_SECRET ?? randomBytes(48).toString("base64url"),
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER ?? "development",
    VX_DATABASE_LOCK_URL: databaseLock.url,
    VX_DATABASE_LOCK_SECRET: databaseLock.secret,
    WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
  };
}

async function startApplication(env) {
  await run("vinext", ["dev"], env);
}

async function startDevelopmentDatabase() {
  const options = {
    name: "vx-house-development-v4",
    persistenceMode: "stateful",
    port: 0,
    databasePort: 0,
    shadowDatabasePort: 0,
  };

  try {
    return await startPrismaDevServer(options);
  } catch (error) {
    if (!(error instanceof ServerAlreadyRunningError)) throw error;

    const existing = await error.server;
    const status = await getServerStatus("vx-house-development-v4");
    const healthUrl = status.exports?.http?.url;
    const connectionString = status.exports?.database?.connectionString;

    if (healthUrl && connectionString) {
      try {
        const response = await fetch(`${healthUrl}/health`, {
          headers: { connection: "close" },
        });
        if (response.ok) {
          console.info("[VX House] Используем уже запущенную development-базу.");
          return {
            database: { connectionString },
            close: async () => {},
          };
        }
      } catch {
        // A stale state file is released below and the database is restarted.
      }
    }

    if (!existing) throw error;

    const staleLock = join(dirname(existing.pgliteDataDirPath), ".lock");
    await rm(staleLock, { force: true, recursive: true });
    return startPrismaDevServer(options);
  }
}

if (process.env.DATABASE_URL) {
  await startApplication({ ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" });
} else {
  console.info("[VX House] DATABASE_URL не задан: запускаем изолированную development-базу.");
  const database = await startDevelopmentDatabase();
  const databaseLock = await startDatabaseLockCoordinator();
  const env = developmentEnvironment(database.database.connectionString, databaseLock);

  try {
    await run(process.execPath, [prisma, "migrate", "deploy"], env);
    await run(process.execPath, [tsx, "scripts/seed-development-identity.mts"], env);
    await run(process.execPath, [tsx, "scripts/seed-development-player-experience.mts"], env);
    await startApplication(env);
  } finally {
    await databaseLock.close();
    await database.close?.();
  }
}
