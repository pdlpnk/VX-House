import type { BackupPolicy } from "./types";

export function defineBackupPolicy(input: Omit<BackupPolicy, "requireEncryption" | "requireIsolatedRestoreTest">) {
  for (const value of Object.values(input)) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError("Некорректный параметр backup policy");
  }
  return Object.freeze({
    ...input,
    requireEncryption: true,
    requireIsolatedRestoreTest: true,
  }) satisfies BackupPolicy;
}
