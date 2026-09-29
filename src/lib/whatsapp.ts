import { formatPaise } from "./money";

/**
 * The order message an admin receives on WhatsApp.
 *
 * Shared between checkout (which sends the customer straight to WhatsApp) and
 * the order page (which offers a resend, since nothing can confirm the customer
 * actually pressed send).
 */

/**
 * Emoji and the rupee sign are written as escape sequences, not literal
 * characters, so this file stays pure ASCII.
 *
 * Literal emoji survived in the source but arrived in WhatsApp as U+FFFD
 * replacement characters - something between the build and the wire was
 * re-encoding them. An escape is compiled from ASCII into the correct code
 * point every time, so no editor, patch tool, bundler or minifier in the chain
 * can corrupt it.
 */
const CART = "\u{1F6D2}"; // shopping trolley
const PERSON = "\u{1F464}"; // bust in silhouette
const PHONE = "\u{1F4F1}"; // mobile phone
const PIN = "\u{1F4CD}"; // round pushpin
const TIMES = "\u{00D7}"; // multiplication sign, clearer than a letter x

type MessageOrder = {
  orderNumber: string;
  customer: { name: string; mobile: string };
  address: {
    line1: string;
    line2?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  items: { name: string; qty: number; lineTotal: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

export function formatAddress(address: MessageOrder["address"]) {
  return [
    address.line1,
    address.line2,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");
}

export function buildOrderMessage(order: MessageOrder, orderUrl: string) {
  // Long URLs get truncated by some WhatsApp builds, so only the first few
  // lines are listed and the full detail lives behind the link.
  const shown = order.items.slice(0, 8);
  const lines = shown.map(
    (item, n) =>
      `${n + 1}. ${item.name} ${TIMES} ${item.qty} - ${formatPaise(item.lineTotal)}`,
  );
  if (order.items.length > shown.length) {
    lines.push(`...and ${order.items.length - shown.length} more items`);
  }

  return [
    `${CART} New order ${order.orderNumber}`,
    "",
    `${PERSON} ${order.customer.name}`,
    `${PHONE} ${order.customer.mobile}`,
    "",
    ...lines,
    "",
    // formatPaise carries the rupee sign and does Indian digit grouping
    // without Intl, which can group wrongly on a runtime with trimmed ICU.
    `Subtotal ${formatPaise(order.subtotal)}`,
    order.deliveryFee === 0
      ? "Delivery FREE"
      : `Delivery ${formatPaise(order.deliveryFee)}`,
    `Total ${formatPaise(order.total)}`,
    "",
    `${PIN} ${formatAddress(order.address)}`,
    "",
    "View & accept:",
    orderUrl, // last, on its own line: WhatsApp renders a tappable preview
  ].join("\n");
}

/** null when no admin number is configured, so callers can hide the button. */
export function whatsappLink(message: string) {
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
  if (!adminNumber) return null;
  return `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
}
