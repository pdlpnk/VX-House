import "server-only";

const PRODUCTION_COOKIE_NAME = "__Host-vx_house_password_reset";
const DEVELOPMENT_COOKIE_NAME = "vx_house_password_reset";

function serialize(name: string, value: string, attributes: readonly string[]) {
  return [`${name}=${value}`, ...attributes].join("; ");
}

export class PasswordResetCookieManager {
  readonly name: string;

  constructor(private readonly secure: boolean) {
    this.name = secure ? PRODUCTION_COOKIE_NAME : DEVELOPMENT_COOKIE_NAME;
  }

  read(request: Request) {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) return null;
    for (const part of cookieHeader.split(";")) {
      const separator = part.indexOf("=");
      if (separator < 0 || part.slice(0, separator).trim() !== this.name) continue;
      return part.slice(separator + 1).trim() || null;
    }
    return null;
  }

  create(value: string, maxAgeSeconds: number) {
    const attributes = ["Path=/", "HttpOnly", "SameSite=Strict", `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`, "Priority=High"];
    if (this.secure) attributes.push("Secure");
    return serialize(this.name, value, attributes);
  }

  clear() {
    const attributes = ["Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0", "Expires=Thu, 01 Jan 1970 00:00:00 GMT", "Priority=High"];
    if (this.secure) attributes.push("Secure");
    return serialize(this.name, "", attributes);
  }
}
