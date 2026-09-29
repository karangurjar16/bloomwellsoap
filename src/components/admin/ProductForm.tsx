"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { paiseToRupees, rupeesToPaise } from "@/lib/money";
import {
  createProduct,
  hideProduct,
  updateProduct,
  type AdminProduct,
  type ProductImage,
} from "@/services/admin/products";
import { ImageUploader } from "./ImageUploader";

const labelClass =
  "text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase";
const fieldClass = "h-12 px-3.5 text-base";

/** Shared by /new and /[id]/edit — the only difference is the initial values. */
export function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const editing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  // Rupees in the form, paise on the wire.
  const [price, setPrice] = useState(
    product ? paiseToRupees(product.price) : "",
  );
  const [mrp, setMrp] = useState(product ? paiseToRupees(product.mrp) : "");
  const [unit, setUnit] = useState(product?.unit ?? "");
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);

  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setFields({});
    setFormError(null);

    const pricePaise = rupeesToPaise(price);
    const mrpPaise = rupeesToPaise(mrp);

    // Caught here rather than server-side so the admin isn't waiting on a
    // round trip to learn a number was typed wrong.
    const local: Record<string, string> = {};
    if (pricePaise === null) local.price = "Enter a price in rupees";
    if (mrpPaise === null) local.mrp = "Enter an MRP in rupees";
    if (pricePaise !== null && mrpPaise !== null && mrpPaise < pricePaise) {
      local.mrp = "MRP cannot be less than the selling price";
    }
    if (Object.keys(local).length > 0) {
      setFields(local);
      setBusy(false);
      return;
    }

    const payload = {
      name,
      tagline,
      description,
      price: pricePaise!,
      mrp: mrpPaise!,
      unit,
      stock: Number(stock) || 0,
      images,
    };

    const result = product
      ? await updateProduct(product.id, { ...payload, isActive })
      : await createProduct(payload);

    if (!result.ok) {
      const fieldErrors = result.fields ?? {};
      setFields(fieldErrors);
      setFormError(Object.keys(fieldErrors).length > 0 ? null : result.error);
      setBusy(false);
      return;
    }

    toast.success(editing ? "Product saved" : "Product added");
    router.replace("/admin/products");
    router.refresh();
  }

  async function onHide() {
    if (!product) return;
    if (
      !window.confirm(
        `Hide "${product.name}" from the store? Past orders keep their copy.`,
      )
    ) {
      return;
    }

    setBusy(true);
    const result = await hideProduct(product.id);
    setBusy(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Product hidden");
    router.replace("/admin/products");
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      noValidate
      // One column on a phone, in the order the admin fills it in. On desktop
      // the details take the wide left column and the save controls sit in a
      // panel on the right that stays in view while the form scrolls.
      className="space-y-5 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10 lg:space-y-0"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className={labelClass}>
            Product name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kundan Necklace Set"
            aria-invalid={Boolean(fields.name)}
            className={fieldClass}
          />
          {fields.name && (
            <p className="text-xs text-destructive">{fields.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline" className={labelClass}>
            Short line
          </Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Gold-plated, with matching earrings"
            aria-invalid={Boolean(fields.tagline)}
            className={fieldClass}
          />
          {fields.tagline && (
            <p className="text-xs text-destructive">{fields.tagline}</p>
          )}
        </div>

        <Separator />

        {/* 2 × 2 on a phone, one row of four on desktop. */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="price" className={labelClass}>
              Price ₹
            </Label>
            <Input
              id="price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="2450"
              aria-invalid={Boolean(fields.price)}
              className={fieldClass}
            />
            {fields.price && (
              <p className="text-xs text-destructive">{fields.price}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mrp" className={labelClass}>
              MRP ₹
            </Label>
            <Input
              id="mrp"
              inputMode="decimal"
              value={mrp}
              onChange={(e) => setMrp(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="3200"
              aria-invalid={Boolean(fields.mrp)}
              className={fieldClass}
            />
            {fields.mrp && (
              <p className="text-xs text-destructive">{fields.mrp}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock" className={labelClass}>
              Stock
            </Label>
            <Input
              id="stock"
              inputMode="numeric"
              value={stock}
              onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
              aria-invalid={Boolean(fields.stock)}
              className={fieldClass}
            />
            {fields.stock && (
              <p className="text-xs text-destructive">{fields.stock}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit" className={labelClass}>
              Unit
            </Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Set of 2"
              className={fieldClass}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className={labelClass}>Photos</Label>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className={labelClass}>
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Materials, size, care instructions…"
            className="px-3.5 py-3 text-base"
          />
        </div>
      </div>

      <div className="space-y-5 lg:sticky lg:top-10 lg:rounded-lg lg:border lg:border-border lg:bg-card lg:p-5">
        <p className="hidden text-[10px] font-semibold tracking-[0.22em] text-forest uppercase lg:block">
          {editing ? "Save" : "Publish"}
        </p>

        {editing && (
          <>
            <Separator className="lg:hidden" />
            <div className="flex items-center justify-between gap-3">
              <span>
                <Label htmlFor="active" className={labelClass}>
                  Visible in store
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Turn off to hide without deleting.
                </p>
              </span>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </>
        )}

        {formError && (
          <p
            role="alert"
            className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            {formError}
          </p>
        )}

        <Button
          type="submit"
          disabled={busy}
          className="h-12 w-full text-[11px] tracking-[0.18em] uppercase"
        >
          {busy ? "Saving" : editing ? "Save changes" : "Add product"}
        </Button>

        {editing && (
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => void onHide()}
            className="h-11 w-full text-[11px] tracking-[0.16em] uppercase"
          >
            Hide from store
          </Button>
        )}
      </div>
    </form>
  );
}
