import { cloudinaryDriver } from "./cloudinary";
import { localDriver } from "./local";
import type { StorageProvider } from "./types";

export type { StoredImage, StorageProvider } from "./types";

/**
 * Storage lives behind one interface so the host can change without touching
 * the upload route or any component.
 *
 * STORAGE_DRIVER decides where *new* uploads go. Reads are resolved per image
 * from the provider saved on it, so switching drivers never breaks pictures
 * that are already live.
 */
export const activeProvider: StorageProvider =
  process.env.STORAGE_DRIVER === "local"
    ? "local"
    : process.env.STORAGE_DRIVER === "cloudinary"
      ? "cloudinary"
      : // Unset: use Cloudinary if it's configured, else fall back to disk so
        // local development works with no extra setup.
        process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME
        ? "cloudinary"
        : "local";

const drivers = {
  local: localDriver,
  cloudinary: cloudinaryDriver,
} as const;

/** Uploads to whichever driver is active. */
export const putImage = (bytes: Buffer, filename: string, extension: string) =>
  drivers[activeProvider].put(bytes, filename, extension);

/** Deletes using the provider that stored the image, not the active one. */
export const removeImage = (key: string, provider: StorageProvider = "local") =>
  drivers[provider].remove(key);

/**
 * Public URL for a stored image. `width` asks Cloudinary for a resized copy
 * and is ignored by the local driver, which has no resizing.
 */
export function imageUrl(
  ref: { key: string; provider?: StorageProvider | null },
  width?: number,
) {
  return drivers[ref.provider ?? "local"].url(ref.key, width);
}

/**
 * Tolerant resolver for values stored before providers existed, and for order
 * snapshots that hold a finished URL. Anything already absolute is passed
 * through; a bare key is treated as a local path.
 */
export function imageSrc(
  value: string | null | undefined,
  provider?: StorageProvider | null,
  width?: number,
) {
  if (!value) return null;
  if (value.startsWith("http") || value.startsWith("/")) return value;
  return imageUrl({ key: value, provider }, width);
}
