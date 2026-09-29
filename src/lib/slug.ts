/** "Kundan Necklace Set!" -> "kundan-necklace-set" */
export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Appends a short random suffix so two products with the same name don't
 * collide on the unique index.
 */
export const uniqueSlug = (input: string) =>
  `${slugify(input)}-${Math.random().toString(36).slice(2, 6)}`;
