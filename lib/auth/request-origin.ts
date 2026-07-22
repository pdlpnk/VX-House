const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function hasTrustedRequestOrigin(request: Request, allowedOrigins: readonly string[] = []) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  const requestOrigin = new URL(request.url).origin;
  return origin === requestOrigin || allowedOrigins.includes(origin);
}
