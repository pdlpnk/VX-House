import "server-only";

const PRODUCTION_NAME = "__Host-vx_attribution";
const DEVELOPMENT_NAME = "vx_attribution";
export const ATTRIBUTION_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 90;

export class AttributionCookieManager {
  readonly name: string;
  constructor(private readonly secure: boolean) { this.name = secure ? PRODUCTION_NAME : DEVELOPMENT_NAME; }
  read(request: Request) {
    const header = request.headers.get("cookie");
    if (!header) return null;
    for (const part of header.split(";")) {
      const [name, ...rest] = part.trim().split("=");
      if (name === this.name) return rest.join("=") || null;
    }
    return null;
  }
  create(value: string) {
    return [
      `${this.name}=${value}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${ATTRIBUTION_COOKIE_TTL_SECONDS}`,
      "Priority=Medium",
      ...(this.secure ? ["Secure"] : []),
    ].join("; ");
  }
}

