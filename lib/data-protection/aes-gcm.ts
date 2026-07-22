import "server-only";

import { decodeBase64Url, encodeBase64Url } from "@/lib/auth/encoding";
import type { DataProtectionContext, EncryptedPayload } from "./types";

const IV_BYTES = 12;
const textEncoder = new TextEncoder();

function additionalData(context: DataProtectionContext) {
  return textEncoder.encode(
    JSON.stringify({
      classification: context.classification,
      purpose: context.purpose,
      resourceId: context.resourceId,
      resourceType: context.resourceType,
    }),
  );
}

export class AesGcmDataProtector {
  private readonly keyPromise: Promise<CryptoKey>;

  constructor(
    private readonly keyId: string,
    encodedKey: string,
  ) {
    const key = decodeBase64Url(encodedKey);
    if (!key || key.length !== 32) throw new TypeError("Ожидается AES-256 key");
    this.keyPromise = crypto.subtle.importKey("raw", new Uint8Array(key).buffer, "AES-GCM", false, [
      "encrypt",
      "decrypt",
    ]);
  }

  async encrypt(value: Uint8Array, context: DataProtectionContext): Promise<EncryptedPayload> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: additionalData(context), tagLength: 128 },
      await this.keyPromise,
      new Uint8Array(value).buffer,
    );
    return Object.freeze({
      version: 1,
      algorithm: "AES-256-GCM",
      keyId: this.keyId,
      iv: encodeBase64Url(iv),
      ciphertext: encodeBase64Url(new Uint8Array(ciphertext)),
    });
  }

  async decrypt(payload: EncryptedPayload, context: DataProtectionContext) {
    if (payload.version !== 1 || payload.algorithm !== "AES-256-GCM" || payload.keyId !== this.keyId) {
      throw new Error("Неподдерживаемая версия защищённых данных");
    }
    const iv = decodeBase64Url(payload.iv);
    const ciphertext = decodeBase64Url(payload.ciphertext);
    if (!iv || iv.length !== IV_BYTES || !ciphertext) throw new Error("Повреждённый encrypted payload");
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv).buffer,
        additionalData: additionalData(context),
        tagLength: 128,
      },
      await this.keyPromise,
      new Uint8Array(ciphertext).buffer,
    );
    return new Uint8Array(plaintext);
  }
}
