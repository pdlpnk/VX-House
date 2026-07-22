import { Prisma } from "@/lib/db";

export type ApplicationErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "IDEMPOTENCY_CONFLICT"
  | "OPTIMISTIC_CONFLICT"
  | "RATE_LIMITED"
  | "AUTHENTICATION_REQUIRED";

export class ApplicationError extends Error {
  constructor(
    readonly code: ApplicationErrorCode,
    message: string,
    readonly details?: Readonly<Record<string, string>>,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export function mapApplicationError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) return error;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return new ApplicationError("CONFLICT", "Запись уже существует");
    if (error.code === "P2025") return new ApplicationError("NOT_FOUND", "Запись не найдена");
    if (error.code === "P2034") {
      return new ApplicationError("OPTIMISTIC_CONFLICT", "Данные были изменены параллельно");
    }
  }
  throw error;
}
