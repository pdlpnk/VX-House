import vinext from "vinext";
import { defineConfig, loadEnv } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

const SERVER_ENV_KEYS = [
  "APP_NAME",
  "LOG_LEVEL",
  "DATABASE_URL",
  "DIRECT_URL",
  "VX_DATABASE_LOCK_URL",
  "VX_DATABASE_LOCK_SECRET",
  "SESSION_SECRET",
  "RATE_LIMIT_SECRET",
  "DATA_PROTECTION_KEY_ID",
  "DATA_PROTECTION_KEY",
  "AUTH_SESSION_IDLE_TTL_SECONDS",
  "AUTH_SESSION_ABSOLUTE_TTL_SECONDS",
  "AUTH_SESSION_REFRESH_AFTER_SECONDS",
  "BRUTE_FORCE_IDENTIFIER_LIMIT",
  "BRUTE_FORCE_IDENTIFIER_WINDOW_SECONDS",
  "BRUTE_FORCE_NETWORK_LIMIT",
  "BRUTE_FORCE_NETWORK_WINDOW_SECONDS",
  "HEALTH_CHECK_TIMEOUT_MS",
  "EMAIL_VERIFICATION_SECRET",
  "EMAIL_PROVIDER",
  "EMAIL_CODE_TTL_SECONDS",
  "EMAIL_CODE_RESEND_COOLDOWN_SECONDS",
  "EMAIL_CODE_MAX_ATTEMPTS",
  "EMAIL_CODE_MAX_ACTIVE",
  "TRUST_PROXY_HEADERS",
] as const;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig(async ({ command, mode }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  const loadedEnvironment = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const developmentVars = Object.fromEntries(
    SERVER_ENV_KEYS.flatMap((key) => {
      const value = loadedEnvironment[key];
      return value ? [[key, value]] : [];
    }),
  );
  const localBindingConfig = {
    main: "./worker/index.ts",
    compatibility_flags: ["nodejs_compat"],
    vars: command === "serve" ? developmentVars : {},
    d1_databases: d1
      ? [
          {
            binding: d1,
            database_name: "site-creator-d1",
            database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
          },
        ]
      : [],
    r2_buckets: r2
      ? [
          {
            binding: r2,
            bucket_name: "site-creator-r2",
          },
        ]
      : [],
  };

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
