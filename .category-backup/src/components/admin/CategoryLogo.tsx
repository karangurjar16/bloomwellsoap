"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { updateCategory, type AdminCategory } from "@/services/admin/categories";
import { uploadImage } from "@/services/admin/upload";

/**
 * The logo for one category: a tappable square that uploads on pick and saves
 * itself to the category straight away.
 *
 * Deliberately per category rather than derived from a product — a category is
 * a fixed part of the shop and should look the same regardless of what stock
 * happens to be in it.
 */
export function CategoryLogo({
  category,
  onChanged,
}: {
  category: AdminCategory;
  onChanged: () => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);

    const uploaded = await uploadImage(file);
    if (!uploaded.ok) {
      toast.error(uploaded.error);
      setBusy(false);
      return;
    }

    const saved = await updateCategory(category.id, {
      image: {
        path: uploaded.data.path,
        provider: uploaded.data.provider,
        width: uploaded.data.width,
        height: uploaded.data.height,
        alt: category.name,
      },
    });

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";

    if (!saved.ok) {
      toast.error(saved.error);
      return;
    }
    toast.success("Logo updated");
    await onChanged();
  }

  async function clear() {
    setBusy(true);
    // null is meaningful here: it clears the logo and falls back to the emoji.
    const saved = await updateCategory(category.id, { image: null });
    setBusy(false);

    if (!saved.ok) {
      toast.error(saved.error);
      return;
    }
    toast.success("Logo removed");
    await onChanged();
  }

  return (
    <div className="relative shrink-0">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => void pick(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={
          category.image
            ? `Change ${category.name} logo`
            : `Add a logo for ${category.name}`
        }
        className="grid size-12 place-items-center overflow-hidden border border-border bg-muted text-muted-foreground transition-colors hover:border-foreground/40 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : category.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.image}
            alt=""
            className="size-full object-cover"
          />
        ) : category.emoji ? (
          <span className="text-xl" aria-hidden>
            {category.emoji}
          </span>
        ) : (
          <ImagePlus className="size-4" aria-hidden />
        )}
      </button>

      {category.image && !busy && (
        <button
          type="button"
          onClick={() => void clear()}
          aria-label={`Remove ${category.name} logo`}
          className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center border border-border bg-background text-muted-foreground transition-colors hover:text-destructive"
        >
          <X className="size-3" aria-hidden />
        </button>
      )}
    </div>
  );
}
