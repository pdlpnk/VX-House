import "server-only";

import { constantTimeEqual, encodeBase64Url } from "./encoding";

const textEncoder = new TextEncoder();

export function normalizeEmail(value: string) {
  return value.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}

export function createVerificationCode() {
  const upperBound = Math.floor(0x1_0000_0000 / 1_000_000) * 1_000_000;
  const values = new Uint32Array(1);
  do crypto.getRandomValues(values); while ((values[0] ?? upperBound) >= upperBound);
  return String((values[0] ?? 0) % 1_000_000).padStart(6, "0");
}

export class VerificationCodeHasher {
  private readonly key: Promise<CryptoKey>;

  constructor(secret: string) {
    this.key = crypto.subtle.importKey(
      "raw",
      textEncoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }

  async hash(challengeId: string, code: string) {
    const digest = await crypto.subtle.sign(
      "HMAC",
      await this.key,
      textEncoder.encode(`${challengeId}\0${code}`),
    );
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async verify(challengeId: string, code: string, expectedHash: string) {
    const actual = await this.hash(challengeId, code);
    return constantTimeEqual(textEncoder.encode(actual), textEncoder.encode(expectedHash));
  }
}

export function fingerprintEmail(email: string) {
  return crypto.subtle
    .digest("SHA-256", textEncoder.encode(normalizeEmail(email)))
    .then((value) => encodeBase64Url(new Uint8Array(value)));
}
