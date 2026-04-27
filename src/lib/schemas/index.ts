import { z } from "zod";

import { DEFAULT_VAULT_SETTINGS, MAX_TAGS } from "@/lib/constants/vault";
import { isValidHttpUrl, normalizeUrl, sanitizeTags } from "@/lib/format";

const tagSchema = z
  .string()
  .trim()
  .min(1, "Tags cannot be empty.")
  .max(28, "Use shorter tag labels.");

export const passwordStrengthSchema = z.enum(["WEAK", "FAIR", "STRONG"]);

export const settingsSchema = z.object({
  autoLockMinutes: z.number().int().min(1).max(240),
  clipboardClearSeconds: z.number().int().min(0).max(300),
  allowPasswordReveal: z.boolean(),
  maskUsernames: z.boolean(),
  revealDurationSeconds: z.number().int().min(3).max(60),
  rotationReviewDays: z.number().int().min(30).max(365),
});

export const createVaultSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Profile name must be at least 2 characters.")
    .max(40, "Profile name must be under 40 characters.")
    .regex(/^[a-zA-Z0-9_\-\s]+$/, "Only letters, numbers, spaces, hyphens and underscores."),
  salt: z.string().min(1),
  verifier: z.string().min(1),
  settings: settingsSchema.default(DEFAULT_VAULT_SETTINGS),
});

export const encryptedCredentialSchema = z.object({
  serviceName: z
    .string()
    .trim()
    .min(1, "Service or platform name is required.")
    .max(120),
  url: z
    .string()
    .trim()
    .transform(normalizeUrl)
    .refine(isValidHttpUrl, "Enter a valid URL."),
  department: z.string().trim().max(80).optional().nullable(),
  project: z.string().trim().max(80).optional().nullable(),
  category: z.string().trim().max(80).optional().nullable(),
  tags: z
    .array(tagSchema)
    .max(MAX_TAGS)
    .transform((value) => sanitizeTags(value)),
  usernameCiphertext: z.string().min(1),
  passwordCiphertext: z.string().min(1),
  notesCiphertext: z.string().min(1),
  passwordStrength: passwordStrengthSchema,
  passwordFingerprint: z.string().min(1),
});

export const updateSettingsSchema = z.object({
  settings: settingsSchema,
});

export const rotateMasterPasswordSchema = z.object({
  salt: z.string().min(1),
  verifier: z.string().min(1),
  credentials: z.array(
    z.object({
      id: z.string().min(1),
      usernameCiphertext: z.string().min(1),
      passwordCiphertext: z.string().min(1),
      notesCiphertext: z.string().min(1),
      passwordFingerprint: z.string().min(1),
      passwordStrength: passwordStrengthSchema,
    }),
  ),
});

export const credentialFormSchema = z.object({
  serviceName: z
    .string()
    .trim()
    .min(1, "Service or platform name is required.")
    .max(120, "Keep the name under 120 characters."),
  url: z
    .string()
    .trim()
    .min(1, "A URL helps teammates find the right service quickly.")
    .transform(normalizeUrl)
    .refine(isValidHttpUrl, "Enter a valid URL, for example https://app.example.com."),
  username: z
    .string()
    .trim()
    .min(1, "Username or email is required.")
    .max(180, "Keep usernames concise."),
  password: z.string().min(1, "Password is required.").max(512),
  notes: z.string().max(4000).default(""),
  department: z.string().trim().max(80).default(""),
  project: z.string().trim().max(80).default(""),
  category: z.string().trim().max(80).default(""),
  tags: z
    .array(tagSchema)
    .max(MAX_TAGS)
    .transform((value) => sanitizeTags(value))
    .default([]),
});

export type CredentialFormSchema = z.infer<typeof credentialFormSchema>;
export type CredentialFormInput = z.input<typeof credentialFormSchema>;
