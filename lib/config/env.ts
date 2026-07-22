import "server-only";

import { validateEnvironment, type EnvironmentSource } from "@/lib/validation";

export type ServerEnvironment = ReturnType<typeof validateEnvironment>;

let environment: ServerEnvironment | undefined;

export function loadServerEnvironment(source: EnvironmentSource = process.env) {
  return validateEnvironment(source);
}

export function getServerEnvironment() {
  environment ??= loadServerEnvironment();
  return environment;
}
