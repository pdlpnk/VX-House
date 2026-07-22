export { disconnectDatabase, getDatabase } from "./client";
export { Prisma } from "./generated/client";
export type { PrismaClient } from "./generated/client";

import type { Prisma, PrismaClient } from "./generated/client";

export type DatabaseClient = PrismaClient | Prisma.TransactionClient;
