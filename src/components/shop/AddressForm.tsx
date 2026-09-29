"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAddress,
  updateAddress,
  type Address,
  type AddressInput,
} from "@/services/shop/addresses";

const labelClass =
  "text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase";
const fieldClass = "h-12 px-3.5 text-base";

/**
 * Used both on the checkout page and the address book, so the two never drift
 * apart. Field errors come back from the API's `fields` map.
 */
export function AddressForm({
  address,
  onSaved,
  onCancel,
}: {
  /** Present when editing; absent when adding. */
  address?: Address;
  onSaved: () => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [label, setLabel] = useState(address?.label ?? "Home");
  const [line1, setLine1] = useState(address?.line1 ?? "");
  const [line2, setLine2] = useState(address?.line2 ?? "");
  const [landmark, setLandmark] = useState(address?.landmark ?? "");
  const [city, setCity] = useState(address?.city ?? "");
  const [state, setState] = useState(address?.state ?? "");
  const [pincode, setPincode] = useState(address?.pincode ?? "");

  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setFields({});
    setFormError(null);

    const payload: AddressInput = {
      label: label.trim() || "Home",
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      landmark: landmark.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
    };

    const result = address
      ? await updateAddress(address.id, payload)
      : await createAddress(payload);

    if (!result.ok) {
      const fieldErrors = result.fields ?? {};
      setFields(fieldErrors);
      setFormError(Object.keys(fieldErrors).length > 0 ? null : result.error);
      setBusy(false);
      return;
    }

    setBusy(false);
    await onSaved();
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      noValidate
      className="space-y-3.5"
    >
      <div className="space-y-2">
        <Label htmlFor="label" className={labelClass}>
          Save as
        </Label>
        <Input
          id="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Home"
          className={fieldClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="line1" className={labelClass}>
          House / flat and street
        </Label>
        <Input
          id="line1"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          placeholder="12 MG Road"
          aria-invalid={Boolean(fields.line1)}
          className={fieldClass}
        />
        {fields.line1 && (
          <p className="text-xs text-destructive">{fields.line1}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="line2" className={labelClass}>
          Area <span className="normal-case">(optional)</span>
        </Label>
        <Input
          id="line2"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          placeholder="Near Sarafa Bazaar"
          className={fieldClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="landmark" className={labelClass}>
          Landmark <span className="normal-case">(optional)</span>
        </Label>
        <Input
          id="landmark"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          placeholder="Opposite the temple"
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="city" className={labelClass}>
            City
          </Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Indore"
            aria-invalid={Boolean(fields.city)}
            className={fieldClass}
          />
          {fields.city && (
            <p className="text-xs text-destructive">{fields.city}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pincode" className={labelClass}>
            Pincode
          </Label>
          <Input
            id="pincode"
            // Numeric keypad, and the API wants exactly six digits.
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            placeholder="452001"
            aria-invalid={Boolean(fields.pincode)}
            className={fieldClass}
          />
          {fields.pincode && (
            <p className="text-xs text-destructive">{fields.pincode}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="state" className={labelClass}>
          State
        </Label>
        <Input
          id="state"
          value={state}
          onChange={(e) => setState(e.target.value)}
          placeholder="Madhya Pradesh"
          aria-invalid={Boolean(fields.state)}
          className={fieldClass}
        />
        {fields.state && (
          <p className="text-xs text-destructive">{fields.state}</p>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          {formError}
        </p>
      )}

      <div className="flex gap-2.5 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-12 flex-1 rounded-full text-[11px] tracking-[0.14em] uppercase"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={busy}
          className="h-12 flex-1 rounded-full bg-forest text-[11px] font-semibold tracking-[0.14em] text-cream uppercase hover:bg-forest-deep"
        >
          {busy ? "Saving" : address ? "Save changes" : "Save address"}
        </Button>
      </div>
    </form>
  );
}
