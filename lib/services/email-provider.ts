import "server-only";

import { intlLocales, translate, type Locale } from "@/lib/i18n";

export interface VerificationEmail {
  readonly idempotencyKey: string;
  readonly userId: string;
  readonly email: string;
  readonly code: string;
  readonly expiresAt: Date;
  readonly language: Locale;
}

export interface EmailProvider {
  sendVerificationCode(message: VerificationEmail): Promise<void>;
}

const RESEND_EMAILS_URL = "https://api.resend.com/emails";

export class EmailDeliveryError extends Error {
  constructor() {
    super("Сервис отправки писем временно недоступен");
    this.name = "EmailDeliveryError";
  }
}

export interface ResendEmailProviderOptions {
  readonly apiKey: string;
  readonly from: string;
  readonly timeoutMs: number;
  readonly fetchImplementation?: typeof fetch;
}

export function verificationEmailContent(code: string, expiresAt: Date, language: Locale) {
  const expires = new Intl.DateTimeFormat(intlLocales[language], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(expiresAt);
  const subject = translate(language, "email.subject");
  const heading = translate(language, "email.heading");
  const instruction = translate(language, "email.instruction");
  const expiration = translate(language, "email.expiration", { expires });
  const text = translate(language, "email.text", { code });
  const html = `<!doctype html><html lang="${language}"><body style="margin:0;background:#090707;color:#f7f4f4;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:48px 24px"><p style="color:#ef3340;font-weight:700;letter-spacing:.08em">VX HOUSE</p><h1 style="font-size:28px">${heading}</h1><p style="color:#c8bebe;line-height:1.6">${instruction}</p><p style="font-size:36px;font-weight:700;letter-spacing:.18em;margin:32px 0">${code}</p><p style="color:#8f8585;font-size:14px">${expiration}</p></div></body></html>`;
  return { subject, html, text };
}

export class ResendEmailProvider implements EmailProvider {
  private readonly request: typeof fetch;

  constructor(private readonly options: ResendEmailProviderOptions) {
    this.request = options.fetchImplementation ?? fetch;
  }

  async sendVerificationCode(message: VerificationEmail) {
    try {
      const content = verificationEmailContent(message.code, message.expiresAt, message.language);
      const response = await this.request(RESEND_EMAILS_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.options.apiKey}`,
          "content-type": "application/json",
          "idempotency-key": `vxhouse-verification/${message.idempotencyKey}`,
        },
        body: JSON.stringify({
          from: this.options.from,
          to: [message.email],
          subject: content.subject,
          html: content.html,
          text: content.text,
        }),
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
      if (!response.ok) throw new EmailDeliveryError();
    } catch (error) {
      if (error instanceof EmailDeliveryError) throw error;
      throw new EmailDeliveryError();
    }
  }
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
  async sendVerificationCode(message: VerificationEmail): Promise<never> {
    void message;
    throw new EmailDeliveryError();
  }
}
