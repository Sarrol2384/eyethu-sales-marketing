/** Public listing / agent uploads bucket (see Supabase migrations). */
export const PROPERTY_IMAGES_BUCKET = "property-images";

/**
 * Extract object path `<folder>/<file>` from a Supabase Storage public URL
 * for the property-images bucket, or null if the URL is not from that bucket.
 */
export function extractPropertyImagesStoragePath(url: string): string | null {
  const marker = `/object/public/${PROPERTY_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
