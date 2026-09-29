import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { User } from "@/models/User";

// ---------------------------------------------------------------- validation
const addressSchema = z.object({
  label: z.string().trim().max(30).default("Home"),
  line1: z.string().trim().min(3, "Address is required").max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, "City is required").max(60),
  state: z.string().trim().min(2, "State is required").max(60),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  landmark: z.string().trim().max(120).optional(),
  isDefault: z.boolean().default(false),
});

const MAX_ADDRESSES = 10;

// ------------------------------------------------------------------ handlers
export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const user = await User.findById(auth.session.userId).select("addresses");
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not signed in" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: user.addresses.map((a) => ({
      id: String(a._id),
      label: a.label,
      line1: a.line1,
      line2: a.line2 ?? null,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      landmark: a.landmark ?? null,
      isDefault: a.isDefault,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
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

  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fields[issue.path.join(".")] ??= issue.message;
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

  if (user.addresses.length >= MAX_ADDRESSES) {
    return NextResponse.json(
      { ok: false, error: `You can save up to ${MAX_ADDRESSES} addresses` },
      { status: 409 },
    );
  }

  // The first address is always the default — otherwise checkout has nothing
  // pre-selected.
  const makeDefault = parsed.data.isDefault || user.addresses.length === 0;
  if (makeDefault) {
    for (const existing of user.addresses) existing.isDefault = false;
  }

  user.addresses.push({ ...parsed.data, isDefault: makeDefault } as never);
  await user.save();

  const created = user.addresses[user.addresses.length - 1]!;

  return NextResponse.json(
    { ok: true, data: { id: String(created._id), isDefault: created.isDefault } },
    { status: 201 },
  );
}
