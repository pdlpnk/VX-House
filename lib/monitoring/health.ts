import "server-only";

export type HealthCheckKind = "liveness" | "readiness" | "diagnostic";
export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheck {
  readonly name: string;
  readonly kind: HealthCheckKind;
  readonly critical: boolean;
  run(): Promise<void>;
}

export interface HealthCheckResult {
  readonly name: string;
  readonly status: "pass" | "fail";
  readonly durationMs: number;
  readonly critical: boolean;
}

export interface HealthReport {
  readonly status: HealthStatus;
  readonly checkedAt: string;
  readonly checks: readonly HealthCheckResult[];
}

async function withTimeout(operation: Promise<void>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Health check timeout")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export class HealthCheckRegistry {
  private readonly checks = new Map<string, HealthCheck>();

  constructor(private readonly timeoutMs: number) {}

  register(check: HealthCheck) {
    if (this.checks.has(check.name)) throw new Error(`Health check ${check.name} уже зарегистрирован`);
    this.checks.set(check.name, check);
    return this;
  }

  async run(kind: HealthCheckKind): Promise<HealthReport> {
    const selected = [...this.checks.values()].filter((check) => check.kind === kind);
    const results = await Promise.all(
      selected.map(async (check): Promise<HealthCheckResult> => {
        const startedAt = performance.now();
        try {
          await withTimeout(check.run(), this.timeoutMs);
          return {
            name: check.name,
            status: "pass",
            durationMs: Math.round(performance.now() - startedAt),
            critical: check.critical,
          };
        } catch {
          return {
            name: check.name,
            status: "fail",
            durationMs: Math.round(performance.now() - startedAt),
            critical: check.critical,
          };
        }
      }),
    );
    const hasCriticalFailure = results.some((result) => result.status === "fail" && result.critical);
    const hasFailure = results.some((result) => result.status === "fail");
    return Object.freeze({
      status: hasCriticalFailure ? "unhealthy" : hasFailure ? "degraded" : "healthy",
      checkedAt: new Date().toISOString(),
      checks: Object.freeze(results),
    });
  }
}
