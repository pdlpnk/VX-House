import type { PrismaClient } from "@/lib/db";

export interface RepositoryContext {
  readonly database: PrismaClient;
}

export interface Repository<TEntity, TIdentifier = string> {
  findById(identifier: TIdentifier): Promise<TEntity | null>;
}
