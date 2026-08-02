import { PrismaPg } from "@prisma/adapter-pg";
import { createHash } from "node:crypto";

import { PrismaClient } from "../lib/db/generated-node/client.ts";

if (process.env.NODE_ENV !== "production") throw new Error("Bootstrap разрешён только при NODE_ENV=production");
if (process.env.CONFIRM_PRODUCTION_BOOTSTRAP !== "VX_HOUSE_REFERENCE_DATA") {
  throw new Error("Для bootstrap требуется явное подтверждение CONFIRM_PRODUCTION_BOOTSTRAP");
}
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL или DIRECT_URL обязателен");

const database = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const publishedAt = new Date("2026-01-01T00:00:00.000Z");

try {
  await database.$transaction(async (transaction) => {
    const markets = [
      await transaction.market.upsert({
        where: { code: "TR" },
        update: { name: "Турция", defaultLanguage: "TR", isActive: true },
        create: { code: "TR", name: "Турция", defaultLanguage: "TR", isActive: true },
      }),
      await transaction.market.upsert({
        where: { code: "AZ" },
        update: { name: "Азербайджан", defaultLanguage: "AZ", isActive: true },
        create: { code: "AZ", name: "Азербайджан", defaultLanguage: "AZ", isActive: true },
      }),
    ];

    for (const definition of [
      { key: "terms", title: "Условия использования" },
      { key: "privacy", title: "Политика конфиденциальности" },
    ] as const) {
      const document = await transaction.consentDocument.upsert({
        where: { key: definition.key },
        update: { title: definition.title, isRequired: true },
        create: { key: definition.key, title: definition.title, isRequired: true },
      });
      for (const market of markets) {
        for (const language of new Set(["RU" as const, market.defaultLanguage])) {
          await transaction.consentVersion.upsert({
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
              contentHash: hash(`vx-house:${definition.key}:${market.code}:${language}:1`),
              publishedAt,
              effectiveFrom: publishedAt,
            },
          });
        }
      }
    }
  });
  console.info("Production reference data is ready.");
} finally {
  await database.$disconnect();
}
