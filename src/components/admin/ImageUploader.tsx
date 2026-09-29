"use client";

import { ImagePlus, Star, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteImage, uploadImage } from "@/services/admin/upload";
import type { ProductImage } from "@/services/admin/products";

const MAX_IMAGES = 8;

/**
 * Uploads on file pick rather than on form submit: the file is on disk with
 * its dimensions known before the product is saved, so the form only ever
 * carries small JSON.
 */
export function ImageUploader({
  images,
  onChange,
}: {
  images: ProductImage[];
  onChange: (next: ProductImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // Kept on screen rather than only as a toast: an upload failure is the one
  // error here you must actually read before saving the product.
  const [failed, setFailed] = useState<string | null>(null);

  async function onPick(files: FileList | null) {
    if (!files || files.length === 0) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`Up to ${MAX_IMAGES} images per product`);
      return;
    }

    setBusy(true);
    setFailed(null);
    const added: ProductImage[] = [];

    for (const file of Array.from(files).slice(0, room)) {
      const result = await uploadImage(file);
      if (!result.ok) {
        setFailed(`${file.name}: ${result.error}`);
        toast.error(result.error);
        continue;
      }
      added.push({
        path: result.data.path,
        provider: result.data.provider,
        width: result.data.width,
        height: result.data.height,
        alt: "",
        url: result.data.url,
      });
    }

    if (added.length > 0) onChange([...images, ...added]);
    setBusy(false);

    // Reset so picking the same file again still fires a change event.
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onRemove(image: ProductImage) {
    onChange(images.filter((i) => i.path !== image.path));
    // Fire-and-forget: the form state is already correct, and a failed delete
    // only leaves an orphan file rather than breaking the product.
    void deleteImage(image.path, image.provider);
  }

  function onMakePrimary(path: string) {
    const chosen = images.find((image) => image.path === path);
    if (!chosen) return;
    onChange([chosen, ...images.filter((image) => image.path !== path)]);
  }

  return (
    <div className="space-y-2.5">
      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-2.5">
          {images.map((image, index) => (
            <li key={image.path} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url ?? `/uploads/${image.path}`}
                alt={image.alt || ""}
                className={cn(
                  "aspect-square w-full border object-cover",
                  index === 0 ? "border-foreground" : "border-border",
                )}
              />

              {index === 0 ? (
                <span className="absolute top-1 left-1 bg-foreground px-1.5 py-0.5 text-[9px] font-medium tracking-[0.12em] text-background uppercase">
                  Main
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onMakePrimary(image.path)}
                  aria-label="Make main image"
                  className="absolute top-1 left-1 grid size-6 place-items-center bg-background/90 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Star className="size-3" aria-hidden />
                </button>
              )}

              <button
                type="button"
                onClick={() => void onRemove(image)}
                aria-label="Remove image"
                className="absolute top-1 right-1 grid size-6 place-items-center bg-background/90 text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => void onPick(e.target.files)}
      />

      <Button
        type="button"
        variant="outline"
        disabled={busy || images.length >= MAX_IMAGES}
        onClick={() => inputRef.current?.click()}
        className="h-12 w-full text-[11px] tracking-[0.16em] uppercase"
      >
        <ImagePlus data-icon="inline-start" />
        {busy
          ? "Uploading"
          : images.length === 0
            ? "Add photos"
            : `Add more (${images.length}/${MAX_IMAGES})`}
      </Button>

      {failed && (
        <p className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {failed}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP, up to 5 MB each. The first image is what customers see
        on the product card.
      </p>
    </div>
  );
}
