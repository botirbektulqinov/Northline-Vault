export type PasswordStrength = "WEAK" | "FAIR" | "STRONG";

export type SessionStatus =
  | "booting"
  | "locked"
  | "unlocking"
  | "syncing"
  | "unlocked";

export interface VaultSettings {
  autoLockMinutes: number;
  clipboardClearSeconds: number;
  allowPasswordReveal: boolean;
  maskUsernames: boolean;
  revealDurationSeconds: number;
  rotationReviewDays: number;
}

export interface VaultSummary {
  id: string;
  name: string;
  createdAt: string;
}

export interface VaultDirectoryState {
  hasVaults: boolean;
  recentVault: VaultSummary | null;
}

export interface VaultSnapshot {
  id: string;
  name: string;
  salt: string;
  verifier: string;
  settings: VaultSettings;
  createdAt: string;
  updatedAt: string;
  credentialCount: number;
}

export interface EncryptedCredentialRecord {
  id: string;
  vaultId: string;
  serviceName: string;
  url: string;
  department: string | null;
  project: string | null;
  category: string | null;
  tags: string[];
  usernameCiphertext: string;
  passwordCiphertext: string;
  notesCiphertext: string;
  passwordStrength: PasswordStrength;
  passwordFingerprint: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecryptedCredential extends EncryptedCredentialRecord {
  username: string;
  password: string;
  notes: string;
  reusedCount: number;
  requiresReview: boolean;
  isUngrouped: boolean;
  ageInDays: number;
}

export interface CredentialFormValues {
  serviceName: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  department: string;
  project: string;
  category: string;
  tags: string[];
}

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export interface PasswordEvaluation {
  value: PasswordStrength;
  label: "Weak" | "Fair" | "Strong";
  score: number;
  feedback: string;
}

export interface SecurityRecommendation {
  id: string;
  tone: "good" | "warning" | "critical";
  title: string;
  description: string;
}

export interface SecuritySummary {
  total: number;
  weak: number;
  fair: number;
  strong: number;
  reusedEntries: number;
  duplicateGroups: number;
  missingClassification: number;
  staleEntries: number;
  score: number;
  strengthChartData: Array<{
    label: string;
    value: number;
    fill: string;
  }>;
  recommendations: SecurityRecommendation[];
}

export interface VaultBackupExport {
  version: string;
  exportedAt: string;
  vault: Omit<VaultSnapshot, "credentialCount">;
  credentials: EncryptedCredentialRecord[];
}
