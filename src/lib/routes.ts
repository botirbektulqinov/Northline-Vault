export function sanitizeReturnPath(
  rawValue: string | null | undefined,
  fallback = "/vault",
): string {
  if (!rawValue || !rawValue.startsWith("/") || rawValue.startsWith("//")) {
    return fallback;
  }

  if (rawValue.startsWith("/lock")) {
    return fallback;
  }

  return rawValue;
}

export function buildLockHref(nextPath?: string) {
  if (!nextPath || nextPath === "/lock") {
    return "/lock";
  }

  return `/lock?next=${encodeURIComponent(nextPath)}`;
}
