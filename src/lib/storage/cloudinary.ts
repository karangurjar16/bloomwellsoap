import { v2 as cloudinary } from "cloudinary";
import { slugify } from "@/lib/slug";
import type { StorageDriver, StoredImage } from "./types";

/**
 * Cloudinary driver — the default on Vercel, whose filesystem is read-only
 * outside /tmp and wiped between invocations.
 *
 * Credentials come from CLOUDINARY_URL (cloudinary://key:secret@cloud-name),
 * which the SDK reads on its own. CLOUDINARY_CLOUD_NAME alone is enough for
 * building URLs, since delivery needs no signature.
 */
const FOLDER = "bloomwell/products";

function cloudName() {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return process.env.CLOUDINARY_CLOUD_NAME;
  }
  // cloudinary://<key>:<secret>@<cloud-name>
  const fromUrl = process.env.CLOUDINARY_URL?.split("@")[1];
  if (!fromUrl) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_URL in your environment.",
    );
  }
  return fromUrl;
}

export const cloudinaryDriver: StorageDriver = {
  put(bytes, filename) {
    // upload_stream rather than upload(): the file is already in memory as a
    // Buffer, so there is nothing on disk to hand Cloudinary a path to.
    return new Promise<StoredImage>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: FOLDER,
          public_id: slugify(filename.replace(/\.[^.]+$/, "")) || undefined,
          // Cloudinary appends its own random suffix, so two uploads named
          // "shampoo.jpg" can't overwrite each other.
          unique_filename: true,
          use_filename: true,
          resource_type: "image",
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new Error(error?.message ?? "Cloudinary upload returned nothing"),
            );
            return;
          }
          resolve({
            provider: "cloudinary",
            key: result.public_id,
            width: result.width,
            height: result.height,
          });
        },
      );

      stream.end(bytes);
    });
  },

  async remove(key) {
    await cloudinary.uploader.destroy(key, { resource_type: "image" });
  },

  url(key, width) {
    // f_auto and q_auto let Cloudinary pick WebP/AVIF and a sane quality per
    // browser — the main reason to use it over a plain file server on a
    // phone-first catalogue.
    const transforms = ["f_auto", "q_auto"];
    if (width) transforms.push(`w_${width}`, "c_limit");
    return `https://res.cloudinary.com/${cloudName()}/image/upload/${transforms.join(",")}/${key}`;
  },
};
