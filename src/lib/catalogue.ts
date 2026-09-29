/**
 * Filter for every public product query. Admin queries deliberately skip this —
 * an admin has to see hidden stock in order to unhide it.
 */
export async function publicProductFilter(
  extra: Record<string, unknown> = {},
) {
  return {
    isActive: true,
    ...extra,
  };
}
