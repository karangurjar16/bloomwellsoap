import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageSize } from "image-size";
import { slugify } from "@/lib/slug";
import type { StorageDriver, StoredImage } from "./types";

/**
 * Local disk driver — for a VPS or any host with a persistent filesystem.
 * Files land in public/uploads, so Next serves them statically with no route
 * handler in the way.
 *
 * Unusable on Vercel: the filesystem is read-only outside /tmp, and /tmp does
 * not survive between invocations.
 */
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

/** Refuses any key that would escape the uploads directory. */
function resolveInsideUploads(key: string) {
  const absolute = path.join(UPLOADS_ROOT, key);
  if (!absolute.startsWith(UPLOADS_ROOT + path.sep)) {
    throw new Error("Invalid file path");
  }
  return absolute;
}

export const localDriver: StorageDriver = {
  async put(bytes, filename, extension): Promise<StoredImage> {
    const dimensions = imageSize(bytes);
    if (!dimensions.width || !dimensions.height) {
      throw new Error("Could not read the image dimensions");
    }

    // products/YYYY/MM/<name>-<random>.<ext> — date folders keep any one
    // directory from reaching thousands of files.
    const now = new Date();
    const folder = path.posix.join(
      "products",
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, "0"),
    );
    const base = slugify(filename.replace(/\.[^.]+$/, "")) || "image";
    const key = path.posix.join(
      folder,
      `${base}-${randomBytes(3).toString("hex")}.${extension}`,
    );

    const absolute = resolveInsideUploads(key);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, bytes);

    return {
      provider: "local",
      key,
      width: dimensions.width,
      height: dimensions.height,
    };
  },

  async remove(key) {
    try {
      await unlink(resolveInsideUploads(key));
    } catch {
      // Already gone is the desired end state.
    }
  },

  url(key) {
    return `/uploads/${key}`;
  },
};
