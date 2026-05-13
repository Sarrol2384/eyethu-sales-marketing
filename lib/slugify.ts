/**
 * Slug helpers for property listings.
 *
 *   slugify("3 Bedroom Family Home")            -> "3-bedroom-family-home"
 *   buildPropertySlug("3 Bed Home", "Blue Downs") -> "3-bed-home-blue-downs"
 *
 * Uniqueness is enforced at the database layer (UNIQUE constraint on
 * properties.slug). The caller is responsible for retrying with a suffix
 * if an insert hits a conflict.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildPropertySlug(title: string, suburb: string): string {
  const base = slugify(`${title} ${suburb}`);
  return base.length > 0 ? base : `listing-${Date.now()}`;
}

/** Add or bump a numeric suffix on a slug to escape a uniqueness conflict. */
export function bumpSlug(slug: string): string {
  const match = slug.match(/^(.*?)-(\d+)$/);
  if (match) {
    const next = Number(match[2]) + 1;
    return `${match[1]}-${next}`;
  }
  return `${slug}-2`;
}
