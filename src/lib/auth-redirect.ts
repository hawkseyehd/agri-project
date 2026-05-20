export function toCurrentOrigin(url: string | null | undefined, fallbackPath: string, currentOrigin: string) {
  const destination = url ?? fallbackPath;

  if (destination.startsWith("/")) {
    return destination;
  }

  try {
    const parsed = new URL(destination);
    return `${currentOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackPath;
  }
}
