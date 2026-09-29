/**
 * The database stores paise as integers, forms take rupees. Every conversion
 * goes through here so no route or component has a stray ×100 in it.
 */

/** 245000 -> "₹2,450" with Indian digit grouping. */
export function formatPaise(paise: number) {
  const rupees = Math.round(paise / 100);
  const whole = Math.abs(rupees).toString();
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest
    ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}`
    : last3;
  return `${rupees < 0 ? "-" : ""}₹${grouped}`;
}

/** "2450" or "2450.50" from a form field -> 245000 paise. */
export function rupeesToPaise(input: string | number) {
  const value = typeof input === "number" ? input : Number(input.trim());
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/** 245000 -> "2450", for pre-filling an edit form. */
export const paiseToRupees = (paise: number) =>
  (paise / 100).toFixed(2).replace(/\.00$/, "");

/** Discount percentage, for the storefront badge. */
export const discountPercent = (price: number, mrp: number) =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
