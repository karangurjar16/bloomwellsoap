import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { User } from "@/models/User";

// ---------------------------------------------------------------- validation
const updateSchema = z
  .object({
    label: z.string().trim().max(30).optional(),
    line1: z.string().trim().min(3).max(120).optional(),
    line2: z.string().trim().max(120).optional(),
    city: z.string().trim().min(2).max(60).optional(),
    state: z.string().trim().min(2).max(60).optional(),
    pincode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter a valid 6-digit pincode")
      .optional(),
    landmark: z.string().trim().max(120).optional(),
    isDefault: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

// ------------------------------------------------------------------ handlers
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/addresses/[id]">,
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be JSON" },
      { status: 400 },
    );
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fields[issue.path.join(".") || "form"] ??= issue.message;
    }
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields", fields },
      { status: 422 },
    );
  }

  const user = await User.findById(auth.session.userId);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not signed in" },
      { status: 401 },
    );
  }

  // Scoped to this user's own subdocuments, so one customer can't edit
  // another's address by guessing an id.
  const address = user.addresses.id(id);
  if (!address) {
    return NextResponse.json(
      { ok: false, error: "Address not found" },
      { status: 404 },
    );
  }

  if (parsed.data.isDefault) {
    for (const other of user.addresses) other.isDefault = false;
  }

  address.set(parsed.data);
  await user.save();

  return NextResponse.json({
    ok: true,
    data: { id: String(address._id), isDefault: address.isDefault },
  });
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/addresses/[id]">,
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;

  const user = await User.findById(auth.session.userId);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not signed in" },
      { status: 401 },
    );
  }

  const address = user.addresses.id(id);
  if (!address) {
    return NextResponse.json(
      { ok: false, error: "Address not found" },
      { status: 404 },
    );
  }

  const wasDefault = address.isDefault;
  address.deleteOne();

  // Never leave the customer with addresses but no default: checkout would
  // open with nothing selected.
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0]!.isDefault = true;
  }

  await user.save();

  return NextResponse.json({ ok: true, data: { deleted: true } });
}
