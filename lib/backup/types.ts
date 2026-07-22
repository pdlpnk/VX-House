export type BackupState = "created" | "verified" | "invalid";

export interface BackupManifest {
  readonly id: string;
  readonly source: string;
  readonly createdAt: Date;
  readonly schemaVersion: string;
  readonly checksumAlgorithm: "SHA-256";
  readonly checksum: string;
  readonly encrypted: true;
  readonly encryptionKeyId: string;
  readonly state: BackupState;
}

export interface BackupArtifact {
  readonly manifest: BackupManifest;
  readonly location: string;
}

export interface RecoveryTarget {
  readonly isolated: true;
  readonly environment: string;
}

export interface RecoveryVerification {
  readonly backupId: string;
  readonly checksumValid: boolean;
  readonly schemaReadable: boolean;
  readonly restoredInIsolation: boolean;
  readonly verifiedAt: Date;
}

export interface BackupProvider {
  create(): Promise<BackupArtifact>;
}

export interface BackupVerifier {
  verify(artifact: BackupArtifact): Promise<RecoveryVerification>;
}

export interface RecoveryProvider {
  restore(artifact: BackupArtifact, target: RecoveryTarget): Promise<RecoveryVerification>;
}

export interface BackupPolicy {
  readonly recoveryPointObjectiveMinutes: number;
  readonly recoveryTimeObjectiveMinutes: number;
  readonly retentionDays: number;
  readonly requireEncryption: true;
  readonly requireIsolatedRestoreTest: true;
}
