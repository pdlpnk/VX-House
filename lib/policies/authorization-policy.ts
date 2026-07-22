export type AuthorizationRule =
  | Readonly<{ kind: "authenticated" }>
  | Readonly<{ kind: "role"; anyOf: readonly string[] }>
  | Readonly<{ kind: "permission"; allOf: readonly string[] }>
  | Readonly<{ kind: "owner" }>
  | Readonly<{ kind: "all"; rules: readonly AuthorizationRule[] }>
  | Readonly<{ kind: "any"; rules: readonly AuthorizationRule[] }>;

export interface AuthorizationPolicy {
  readonly key: string;
  readonly rule: AuthorizationRule;
}

const POLICY_KEY_PATTERN = /^[a-z][a-z0-9_.:-]{2,159}$/;
const ACCESS_KEY_PATTERN = /^[a-z][a-z0-9_.:-]{1,159}$/;

function nonEmptyValues(values: readonly string[], label: string) {
  const normalized = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  if (normalized.length === 0) throw new TypeError(`${label} не может быть пустым`);
  if (normalized.some((value) => !ACCESS_KEY_PATTERN.test(value))) {
    throw new TypeError(`${label} содержит некорректный ключ`);
  }
  return Object.freeze(normalized);
}

function nonEmptyRules(rules: readonly AuthorizationRule[]) {
  if (rules.length === 0) throw new TypeError("Список правил не может быть пустым");
  return Object.freeze([...rules]);
}

function createPolicy(key: string, rule: AuthorizationRule): AuthorizationPolicy {
  if (!POLICY_KEY_PATTERN.test(key)) throw new TypeError("Некорректный ключ authorization policy");
  return Object.freeze({ key, rule });
}

export const authorizationRules = Object.freeze({
  authenticated: (): AuthorizationRule => Object.freeze({ kind: "authenticated" }),
  role: (anyOf: readonly string[]): AuthorizationRule =>
    Object.freeze({ kind: "role", anyOf: nonEmptyValues(anyOf, "Список ролей") }),
  permission: (allOf: readonly string[]): AuthorizationRule =>
    Object.freeze({ kind: "permission", allOf: nonEmptyValues(allOf, "Список разрешений") }),
  owner: (): AuthorizationRule => Object.freeze({ kind: "owner" }),
  all: (...rules: readonly AuthorizationRule[]): AuthorizationRule =>
    Object.freeze({ kind: "all", rules: nonEmptyRules(rules) }),
  any: (...rules: readonly AuthorizationRule[]): AuthorizationRule =>
    Object.freeze({ kind: "any", rules: nonEmptyRules(rules) }),
});

export const authorizationPolicies = Object.freeze({
  authenticated: (key: string) => createPolicy(key, authorizationRules.authenticated()),
  role: (key: string, roles: readonly string[]) => createPolicy(key, authorizationRules.role(roles)),
  permission: (key: string, permissions: readonly string[]) =>
    createPolicy(key, authorizationRules.permission(permissions)),
  owner: (key: string) => createPolicy(key, authorizationRules.owner()),
  all: (key: string, ...rules: readonly AuthorizationRule[]) =>
    createPolicy(key, authorizationRules.all(...rules)),
  any: (key: string, ...rules: readonly AuthorizationRule[]) =>
    createPolicy(key, authorizationRules.any(...rules)),
});
