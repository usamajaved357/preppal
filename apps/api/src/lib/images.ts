/**
 * Image keys are either static asset paths ("/images/…", shipped with the web app)
 * or R2 object keys ("products/<uuid>.webp"), served through GET /api/img/<key>.
 * Moving to an R2 custom domain later only changes this function.
 */
export function imageUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith('/') || key.startsWith('http')) return key;
  return `/api/img/${key}`;
}
