"use client";

import { ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { homeFor, register } from "@/services/auth";

const labelClass =
  "text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase";
// h-12 overrides the preset's compact h-8: a phone needs a real tap target.
const fieldClass = "h-12 px-3.5 text-base";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit() {
    setBusy(true);
    setFormError(null);
    setFields({});

    const result = await register({ name, mobile, password });

    if (!result.ok) {
      const fieldErrors = { ...(result.fields ?? {}) };
      // A duplicate mobile comes back as a whole-form 409; it belongs on the
      // field the user has to change.
      if (!result.fields && /already registered/i.test(result.error)) {
        fieldErrors.mobile = "This number is already registered";
      }
      setFields(fieldErrors);
      setFormError(Object.keys(fieldErrors).length > 0 ? null : result.error);
      setBusy(false);
      return;
    }

    router.replace(homeFor(result.data));
    router.refresh();
  }

  return (
    <>
      <header className="mb-6 text-center">
        <p className="text-[10px] tracking-[0.24em] text-muted-foreground uppercase">
          New customer
        </p>
        <h1 className="mt-2 font-display text-3xl leading-none font-normal">
          Create account
        </h1>
        <span
          aria-hidden
          className="mx-auto mt-3 block h-px w-10 bg-foreground/25"
        />
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        noValidate
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="name" className={labelClass}>
            Full name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(fields.name)}
            aria-describedby={fields.name ? "name-error" : undefined}
            className={fieldClass}
          />
          {fields.name && (
            <p id="name-error" className="text-xs text-destructive">
              {fields.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile" className={labelClass}>
            Mobile number
          </Label>
          <Input
            id="mobile"
            name="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            value={mobile}
            // The API wants 10 bare digits, so +91 and spaces are stripped as
            // the user types rather than rejected after submit.
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit number"
            aria-invalid={Boolean(fields.mobile)}
            aria-describedby={fields.mobile ? "mobile-error" : undefined}
            className={fieldClass}
          />
          {fields.mobile && (
            <p id="mobile-error" className="text-xs text-destructive">
              {fields.mobile}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className={labelClass}>
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fields.password)}
              aria-describedby="password-hint"
              className={`${fieldClass} pr-11`}
            />
            {/* A mistyped password is the most common reason a sign-in fails,
                and on a phone keyboard it is invisible. */}
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              // tabIndex -1 keeps Tab going straight from the field to submit.
              tabIndex={-1}
              className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {/* Same slot for hint and error, so the form doesn't shift on submit. */}
          <p
            id="password-hint"
            className={
              fields.password
                ? "text-xs text-destructive"
                : "text-xs text-muted-foreground"
            }
          >
            {fields.password ?? "At least 8 characters"}
          </p>
        </div>

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
          className="h-12 w-full rounded-full text-[11px] font-semibold tracking-[0.18em] uppercase"
        >
          {busy ? "Creating account" : "Create account"}
          {!busy && <ArrowRight data-icon="inline-end" />}
        </Button>
      </form>

      <Separator className="my-5" />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
