import { PrismaPg } from "@prisma/adapter-pg";
import { createHash } from "node:crypto";

import { PrismaClient } from "../lib/db/generated/client.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL обязателен");
const parsed = new URL(url);
const databaseName = parsed.pathname.slice(1);
if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1"].includes(parsed.hostname)) {
  throw new Error("Development fixtures разрешены только для локальной непродуктивной БД");
}
if (!databaseName.includes("dev") && databaseName !== "template1") {
  throw new Error("Имя БД должно явно указывать на development-окружение");
}

const database = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

try {
  const tr = await database.market.upsert({
    where: { code: "TR" },
    update: { name: "Турция", defaultLanguage: "TR", isActive: true },
    create: { code: "TR", name: "Турция", defaultLanguage: "TR", isActive: true },
  });
  const az = await database.market.upsert({
    where: { code: "AZ" },
    update: { name: "Азербайджан", defaultLanguage: "AZ", isActive: true },
    create: { code: "AZ", name: "Азербайджан", defaultLanguage: "AZ", isActive: true },
  });
  await database.user.upsert({
    where: { email: "synthetic-user@development.invalid" },
    update: { displayName: "Синтетический пользователь" },
    create: { email: "synthetic-user@development.invalid", displayName: "Синтетический пользователь" },
  });
  for (const key of ["terms", "privacy"] as const) {
    const document = await database.consentDocument.upsert({
      where: { key },
      update: { title: key === "terms" ? "Условия использования" : "Политика конфиденциальности" },
      create: {
        key,
        title: key === "terms" ? "Условия использования" : "Политика конфиденциальности",
        isRequired: true,
      },
    });
    for (const market of [tr, az]) {
      for (const language of ["RU", market.defaultLanguage] as const) {
        await database.consentVersion.upsert({
          where: {
            consentDocumentId_marketId_version_language: {
              consentDocumentId: document.id,
              marketId: market.id,
              version: 1,
              language,
            },
          },
          update: {},
          create: {
            consentDocumentId: document.id,
            marketId: market.id,
            version: 1,
            language,
            contentHash: hash(`development-only:${key}:${market.code}:${language}:1`),
            publishedAt: new Date("2026-01-01T00:00:00.000Z"),
            effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
          },
        });
      }
    }
  }
} finally {
  await database.$disconnect();
}
