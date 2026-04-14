import { format, formatDistanceToNowStrict } from "date-fns";

const MASK_DOT = "\u2022";

export function normalizeUrl(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const clean = tag.trim().replace(/\s+/g, " ");
    if (!clean) {
      continue;
    }

    const key = clean.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(clean);
  }

  return normalized;
}

export function maskSecret(value: string, visibleTail = 2): string {
  if (!value) {
    return "";
  }

  const safeVisibleTail = Math.max(0, visibleTail);

  if (safeVisibleTail === 0) {
    return MASK_DOT.repeat(Math.max(4, value.length));
  }

  if (value.length <= safeVisibleTail) {
    return MASK_DOT.repeat(Math.max(4, value.length));
  }

  return `${MASK_DOT.repeat(Math.max(4, value.length - safeVisibleTail))}${value.slice(
    -safeVisibleTail,
  )}`;
}

export function maskUsername(value: string): string {
  if (!value) {
    return "";
  }

  const [localPart, domain] = value.split("@");
  if (domain) {
    const visibleHead = localPart.slice(0, 1);
    return `${visibleHead}${MASK_DOT.repeat(
      Math.max(3, localPart.length - 1),
    )}@${domain}`;
  }

  if (value.length <= 3) {
    return MASK_DOT.repeat(Math.max(4, value.length));
  }

  return `${value.slice(0, 1)}${MASK_DOT.repeat(
    Math.max(4, value.length - 2),
  )}${value.slice(-1)}`;
}

export function getHostnameLabel(urlValue: string): string {
  try {
    return new URL(urlValue).hostname.replace(/^www\./, "");
  } catch {
    return urlValue;
  }
}

export function formatTimestamp(value: string | Date): string {
  return format(new Date(value), "MMM d, yyyy");
}

export function formatRelativeTimestamp(value: string | Date): string {
  return `${formatDistanceToNowStrict(new Date(value), {
    addSuffix: true,
  })}`;
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
