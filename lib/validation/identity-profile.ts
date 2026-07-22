import { ApplicationError } from "@/lib/application";
import type { LanguageCode, MarketCode, ProductRole } from "@/lib/db/generated/client";

const productRoles = new Set<ProductRole>(["PLAYER", "PARTNER"]);
const marketCodes = new Set<MarketCode>(["TR", "AZ"]);
const languages = new Set<LanguageCode>(["RU", "TR", "AZ"]);
const forbiddenInfrastructureFields = ["roleKeys", "permissionKeys", "infrastructureRole", "roles"];

export interface CreateProfileInput {
  readonly productRole: ProductRole;
  readonly marketCode: MarketCode;
  readonly preferredLanguage: LanguageCode;
}

export interface RegistrationInput extends CreateProfileInput {
  readonly displayName: string;
  readonly email: string;
  readonly password: string;
}

export function validateCreateProfileInput(value: unknown): CreateProfileInput {
  if (!value || typeof value !== "object") {
    throw new ApplicationError("VALIDATION", "Параметры профиля обязательны");
  }
  const record = value as Record<string, unknown>;
  if (forbiddenInfrastructureFields.some((key) => key in record)) {
    throw new ApplicationError("FORBIDDEN", "Инфраструктурные роли нельзя назначить через профиль");
  }
  const allowedKeys = new Set(["productRole", "marketCode", "preferredLanguage"]);
  if (Object.keys(record).some((key) => !allowedKeys.has(key))) {
    throw new ApplicationError("VALIDATION", "Параметры профиля содержат неизвестные поля");
  }
  if (!productRoles.has(record.productRole as ProductRole)) {
    throw new ApplicationError("VALIDATION", "Некорректная продуктовая роль");
  }
  if (!marketCodes.has(record.marketCode as MarketCode)) {
    throw new ApplicationError("VALIDATION", "Некорректный рынок");
  }
  if (!languages.has(record.preferredLanguage as LanguageCode)) {
    throw new ApplicationError("VALIDATION", "Некорректный язык");
  }
  return {
    productRole: record.productRole as ProductRole,
    marketCode: record.marketCode as MarketCode,
    preferredLanguage: record.preferredLanguage as LanguageCode,
  };
}

export function validateRegistrationInput(value: unknown): RegistrationInput {
  if (!value || typeof value !== "object") {
    throw new ApplicationError("VALIDATION", "Данные для создания доступа обязательны");
  }
  const record = value as Record<string, unknown>;
  const displayName = typeof record.displayName === "string" ? record.displayName.trim() : "";
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const password = typeof record.password === "string" ? record.password : "";
  if (displayName.length < 2 || displayName.length > 80) {
    throw new ApplicationError("VALIDATION", "Имя должно содержать от 2 до 80 символов");
  }
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new ApplicationError("VALIDATION", "Проверьте формат электронной почты");
  }
  const passwordBytes = new TextEncoder().encode(password).length;
  if (passwordBytes < 12 || passwordBytes > 1024) {
    throw new ApplicationError("VALIDATION", "Пароль должен содержать не менее 12 символов");
  }
  const profile = validateCreateProfileInput({
    productRole: record.productRole,
    marketCode: record.marketCode,
    preferredLanguage: record.preferredLanguage,
  });
  return { ...profile, displayName, email, password };
}
