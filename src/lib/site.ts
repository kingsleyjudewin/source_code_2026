/**
 * Canonical site origin.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL  — set this once you have a custom domain.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — the stable production domain on Vercel.
 *   3. VERCEL_URL — the per-deployment preview domain.
 *   4. localhost — local dev.
 *
 * Absolute URLs matter here: Open Graph images and the sitemap are invalid
 * without a real origin, so a hardcoded placeholder domain would ship broken
 * link previews to every social platform.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;

  const preview = process.env.VERCEL_URL;
  if (preview) return `https://${preview}`;

  return 'http://localhost:3000';
}

export const SITE_URL = resolveSiteUrl();
