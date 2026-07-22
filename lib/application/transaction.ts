import "server-only";

import { Prisma, type PrismaClient } from "@/lib/db";
import { mapApplicationError } from "./errors";

export interface TransactionContext {
  readonly database: Prisma.TransactionClient;
  readonly occurredAt: Date;
}

export class PrismaTransactionRunner {
  constructor(
    private readonly database: PrismaClient,
    private readonly clock: () => Date = () => new Date(),
    private readonly retries = 2,
  ) {}

  async run<T>(work: (context: TransactionContext) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.database.$transaction(
          (database) => work({ database, occurredAt: this.clock() }),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
          attempt < this.retries
        ) {
          continue;
        }
        throw mapApplicationError(error);
      }
    }
  }
}
