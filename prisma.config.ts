import "dotenv/config";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Пустое значение позволяет генерировать клиент без локального .env.
    // Подключение к БД всегда использует проверенную серверную конфигурацию.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
