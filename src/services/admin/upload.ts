import { http } from "../http";

export type UploadedImage = {
  /** Storage key saved on the product. */
  path: string;
  provider: "local" | "cloudinary";
  width: number;
  height: number;
  /** Ready-to-render URL, for the preview. */
  url: string;
};

/** Uploads immediately on file pick, before the product form is submitted. */
export function uploadImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  return http.upload<UploadedImage>("/api/admin/upload", form);
}

/** Deletes the file when an admin drops it from the form. */
export const deleteImage = (path: string, provider?: string) =>
  http.del<{ deleted: boolean }>("/api/admin/upload", { path, provider });
