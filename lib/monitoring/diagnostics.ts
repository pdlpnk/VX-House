import "server-only";

export class ServerDiagnostics {
  private readonly startedAt = Date.now();

  constructor(
    private readonly application: string,
    private readonly environment: string,
  ) {}

  snapshot() {
    return Object.freeze({
      application: this.application,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.max(0, Math.floor((Date.now() - this.startedAt) / 1000)),
    });
  }
}
