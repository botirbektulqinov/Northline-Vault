import type { PasswordGeneratorOptions, VaultSettings } from "@/lib/types";

export const APP_NAME = "Northline Vault";
export const LAST_WORKSPACE_STORAGE_KEY = "northline-vault:last-workspace";

export const DEFAULT_VAULT_SETTINGS: VaultSettings = {
  autoLockMinutes: 15,
  clipboardClearSeconds: 30,
  allowPasswordReveal: true,
  maskUsernames: true,
  revealDurationSeconds: 10,
  rotationReviewDays: 90,
};

export const PASSWORD_GENERATOR_DEFAULTS: PasswordGeneratorOptions = {
  length: 18,
  includeUppercase: true,
  includeNumbers: true,
  includeSymbols: true,
};

export const AUTO_LOCK_PRESETS = [5, 10, 15, 30, 45, 60];
export const CLIPBOARD_PRESETS = [0, 15, 30, 60, 120];
export const ROTATION_PRESETS = [60, 90, 120, 180];
export const MAX_TAGS = 8;

export const STRENGTH_COPY = {
  WEAK: {
    label: "Weak",
    description: "Easy to guess or too short for shared company access.",
  },
  FAIR: {
    label: "Fair",
    description: "Usable, but still worth strengthening for shared accounts.",
  },
  STRONG: {
    label: "Strong",
    description: "Good length and variety for a shared team credential.",
  },
} as const;

export const LOCK_SCREEN_POINTS = [
  "Client-side encryption with AES-GCM",
  "Argon2id-derived master key material",
  "Auto-lock and reveal controls tuned for shared desks",
];

export const SETTINGS_SECTIONS = {
  session: "Session & visibility",
  backup: "Encrypted backup",
  masterPassword: "Master password",
} as const;

export const CHART_COLORS = {
  strong: "#2f6f55",
  fair: "#8a6a2b",
  weak: "#9b4b3d",
} as const;
