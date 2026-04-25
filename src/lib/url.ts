// Powered by skill: frontend-design
// Prefix a path with Astro's BASE_URL so it works under both a root domain
// (`/`) and a project-pages sub-path (`/pimp-my-kebap`).

const RAW_BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/+$/, '');

/** Returns `${BASE_URL}${path}` with normalised slashes. */
export function withBase(path: string): string {
  if (!path) return RAW_BASE || '/';
  // Already absolute? Pass through.
  if (/^https?:/i.test(path) || path.startsWith('mailto:') || path.startsWith('tel:')) {
    return path;
  }
  // Anchor-only links don't need a base prefix.
  if (path.startsWith('#')) return path;
  const trimmed = path.startsWith('/') ? path : '/' + path;
  return `${RAW_BASE}${trimmed}`;
}

/** Returns the bare base URL (no trailing slash). */
export function baseUrl(): string {
  return RAW_BASE;
}
