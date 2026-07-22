export type DataClassification = "internal" | "confidential" | "restricted";

export interface DataProtectionContext {
  readonly purpose: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly classification: DataClassification;
}

export interface EncryptedPayload {
  readonly version: 1;
  readonly algorithm: "AES-256-GCM";
  readonly keyId: string;
  readonly iv: string;
  readonly ciphertext: string;
}
