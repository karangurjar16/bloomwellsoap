import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { User } from "@/models/User";

// ---------------------------------------------------------------- validation
const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  // 72 is bcrypt's byte limit — anything longer is silently truncated.
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be under 72 characters"),
});

// -------------------------------------------------------------------- handler
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be JSON" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
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

  const { name, mobile, password } = parsed.data;

  if (await User.exists({ mobile })) {
    return NextResponse.json(
      { ok: false, error: "This mobile number is already registered" },
      { status: 409 },
    );
  }

  // role is hardcoded, never taken from the body, so nobody can register
  // themselves as an admin.
  const user = await User.create({
    name,
    mobile,
    password: await bcrypt.hash(password, 10),
    role: "customer",
  });

  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user._id))
    .setExpirationTime("30d")
    .sign(new TextEncoder().encode(process.env.SESSION_SECRET));

  (await cookies()).set("bw_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        id: String(user._id),
        name: user.name,
        mobile: user.mobile,
        role: user.role,
      },
    },
    { status: 201 },
  );
}
