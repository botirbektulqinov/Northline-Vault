import { differenceInCalendarDays } from "date-fns";

import { CHART_COLORS } from "@/lib/constants/vault";
import type {
  DecryptedCredential,
  EncryptedCredentialRecord,
  SecurityRecommendation,
  SecuritySummary,
  VaultSettings,
} from "@/lib/types";

export function buildReuseCountMap(
  credentials: Pick<EncryptedCredentialRecord, "passwordFingerprint">[],
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const credential of credentials) {
    counts.set(
      credential.passwordFingerprint,
      (counts.get(credential.passwordFingerprint) ?? 0) + 1,
    );
  }

  return counts;
}

export function getCredentialAgeInDays(updatedAt: string): number {
  return Math.max(0, differenceInCalendarDays(new Date(), new Date(updatedAt)));
}

export function computeSecuritySummary(
  credentials: DecryptedCredential[],
  settings: VaultSettings,
): SecuritySummary {
  const total = credentials.length;
  const weak = credentials.filter(
    (credential) => credential.passwordStrength === "WEAK",
  ).length;
  const fair = credentials.filter(
    (credential) => credential.passwordStrength === "FAIR",
  ).length;
  const strong = credentials.filter(
    (credential) => credential.passwordStrength === "STRONG",
  ).length;
  const reusedEntries = credentials.filter(
    (credential) => credential.reusedCount > 1,
  ).length;
  const duplicateGroups = new Set(
    credentials
      .filter((credential) => credential.reusedCount > 1)
      .map((credential) => credential.passwordFingerprint),
  ).size;
  const missingClassification = credentials.filter(
    (credential) => credential.isUngrouped,
  ).length;
  const staleEntries = credentials.filter(
    (credential) => credential.ageInDays >= settings.rotationReviewDays,
  ).length;

  const recommendations: SecurityRecommendation[] = [];

  if (reusedEntries > 0) {
    recommendations.push({
      id: "reused-passwords",
      tone: "critical",
      title: `Replace ${reusedEntries} reused credentials`,
      description:
        "Duplicate passwords expand blast radius when a shared account is exposed.",
    });
  }

  if (weak > 0) {
    recommendations.push({
      id: "weak-passwords",
      tone: weak >= 3 ? "critical" : "warning",
      title: `Strengthen ${weak} weak credentials`,
      description:
        "Weak entries are the fastest way to reduce risk in a shared team vault.",
    });
  }

  if (staleEntries > 0) {
    recommendations.push({
      id: "rotation",
      tone: "warning",
      title: `Review ${staleEntries} credentials older than ${settings.rotationReviewDays} days`,
      description:
        "Older shared credentials are more likely to linger after role or vendor changes.",
    });
  }

  if (missingClassification > 0) {
    recommendations.push({
      id: "classification",
      tone: "warning",
      title: `Classify ${missingClassification} uncategorized entries`,
      description:
        "Department, project, and tags help teams understand account ownership quickly.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "healthy-vault",
      tone: "good",
      title: "Vault hygiene looks healthy",
      description:
        "No reused passwords, no overdue reviews, and no unclassified entries are currently flagged.",
    });
  }

  const scorePenalty =
    reusedEntries * 9 + weak * 7 + staleEntries * 4 + missingClassification * 3;
  const score = Math.max(18, Math.min(100, 100 - scorePenalty + strong * 2));

  return {
    total,
    weak,
    fair,
    strong,
    reusedEntries,
    duplicateGroups,
    missingClassification,
    staleEntries,
    score,
    strengthChartData: [
      { label: "Strong", value: strong, fill: CHART_COLORS.strong },
      { label: "Fair", value: fair, fill: CHART_COLORS.fair },
      { label: "Weak", value: weak, fill: CHART_COLORS.weak },
    ],
    recommendations,
  };
}
