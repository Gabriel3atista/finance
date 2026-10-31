const INTERNAL_ORIGIN = "https://finance.invalid";

export function safeInternalPath(
  value: string | null,
  fallback = "/space",
) {
  if (!value?.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const destination = new URL(value, INTERNAL_ORIGIN);
    if (destination.origin !== INTERNAL_ORIGIN) return fallback;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}
