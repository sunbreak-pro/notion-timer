const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript|file|blob|ftp):/i;

export function isValidUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Reject blocked protocols early (before auto-prepend)
  if (BLOCKED_PROTOCOLS.test(trimmed)) return null;

  // Auto-prepend https:// if no protocol
  const urlStr = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(urlStr);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}
