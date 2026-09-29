import { imageSize } from "image-size";
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  activeProvider,
  imageUrl,
  putImage,
  removeImage,
  type StorageProvider,
} from "@/lib/storage";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Extension is derived from the sniffed type, never the uploaded filename.
const ALLOWED: Record<string, string> = {
  jpg: "jpg",
  png: "png",
  webp: "webp",
};

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Expected a multipart form upload" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "No file received" },
      { status: 400 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { ok: false, error: "File is empty" },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Image must be under 5 MB" },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // The real type check. A browser-supplied Content-Type can claim anything, so
  // the format is read from the file's own header: if image-size can't parse
  // it, it isn't an image whatever it says it is.
  let sniffed: string | undefined;
  try {
    sniffed = imageSize(bytes).type;
  } catch {
    return NextResponse.json(
      { ok: false, error: "That file is not a valid image" },
      { status: 400 },
    );
  }

  const extension = sniffed ? ALLOWED[sniffed] : undefined;
  if (!extension) {
    return NextResponse.json(
      { ok: false, error: "Only JPG, PNG and WebP images are allowed" },
      { status: 415 },
    );
  }

  try {
    const stored = await putImage(bytes, file.name, extension);

    return NextResponse.json(
      {
        ok: true,
        data: {
          // path + provider are what the product document stores.
          path: stored.key,
          provider: stored.provider,
          width: stored.width,
          height: stored.height,
          // url is for showing a preview straight away.
          url: imageUrl(stored, 400),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    // Surfaces a misconfigured Cloudinary account or a read-only disk as a
    // readable message instead of a 500 with an HTML body.
    const message =
      error instanceof Error ? error.message : "Could not save the image";
    return NextResponse.json(
      { ok: false, error: `Upload failed (${activeProvider}): ${message}` },
      { status: 500 },
    );
  }
}

/**
 * Removes a stored file. Called when an admin drops an image from a product
 * before saving — without this every discarded upload is kept forever.
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be JSON" },
      { status: 400 },
    );
  }

  const payload = (body ?? {}) as { path?: unknown; provider?: unknown };

  if (typeof payload.path !== "string" || payload.path.length === 0) {
    return NextResponse.json(
      { ok: false, error: "A file path is required" },
      { status: 400 },
    );
  }

  const provider: StorageProvider =
    payload.provider === "cloudinary" ? "cloudinary" : "local";

  try {
    // Deleted through the provider that stored it, so switching drivers can't
    // orphan old files.
    await removeImage(payload.path, provider);
  } catch {
    // Treated as success: the product no longer references it either way.
  }

  return NextResponse.json({ ok: true, data: { deleted: true } });
}
