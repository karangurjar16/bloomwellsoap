/**
 * Where an image physically lives. Stored alongside every image so a product
 * uploaded to Cloudinary keeps working after a move to a VPS with local disk,
 * and vice versa — the driver is per-image, not global.
 */
export type StorageProvider = "local" | "cloudinary";

export type StoredImage = {
  provider: StorageProvider;
  /** Cloudinary public_id, or a path relative to public/uploads. */
  key: string;
  width: number;
  height: number;
};

export type StorageDriver = {
  put(bytes: Buffer, filename: string, extension: string): Promise<StoredImage>;
  remove(key: string): Promise<void>;
  url(key: string, width?: number): string;
};
