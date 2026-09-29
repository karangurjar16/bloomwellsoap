import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 lookalikes

function randomString(length: number) {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

/**
 * Unguessable id used in the shared order URL (/order/<publicId>).
 * ObjectIds are enumerable — they encode a timestamp and counter — so they
 * must not be the only thing protecting an order page.
 */
export const newPublicId = () => randomString(22);

/** Human-quotable order number, e.g. BW-260910-7F2A. */
export function newOrderNumber(now = new Date()) {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `BW-${yy}${mm}${dd}-${randomString(4)}`;
}
