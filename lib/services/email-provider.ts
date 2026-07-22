import "server-only";

export interface VerificationEmail {
  readonly userId: string;
  readonly email: string;
  readonly code: string;
  readonly expiresAt: Date;
}

export interface EmailProvider {
  sendVerificationCode(message: VerificationEmail): Promise<void>;
}

const developmentCodes = globalThis as typeof globalThis & {
  vxHouseDevelopmentCodes?: Map<string, Readonly<{ code: string; expiresAt: Date }>>;
};

export class DevelopmentEmailProvider implements EmailProvider {
  private readonly codes = (developmentCodes.vxHouseDevelopmentCodes ??= new Map());

  constructor(private readonly environment: "development" | "test") {}

  async sendVerificationCode(message: VerificationEmail) {
    this.codes.set(message.userId, { code: message.code, expiresAt: message.expiresAt });
  }

  readCode(userId: string) {
    if (this.environment !== "development") return null;
    const value = this.codes.get(userId);
    if (!value || value.expiresAt.getTime() <= Date.now()) return null;
    return value.code;
  }

  clear(userId: string) {
    this.codes.delete(userId);
  }
}

export class UnavailableEmailProvider implements EmailProvider {
  async sendVerificationCode(): Promise<never> {
    throw new Error("Email provider не подключён");
  }
}
