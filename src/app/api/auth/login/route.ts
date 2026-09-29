import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { User } from "@/models/User";

// ---------------------------------------------------------------- validation
const loginSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  password: z.string().min(1, "Password is required"),
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

  const parsed = loginSchema.safeParse(body);
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

  const { mobile, password } = parsed.data;

  // password is select:false on the schema, so it has to be asked for.
  const user = await User.findOne({ mobile }).select("+password");

  // Same message for unknown number and wrong password, so this can't be used
  // to discover which numbers are registered.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json(
      { ok: false, error: "Incorrect mobile number or password" },
      { status: 401 },
    );
  }

  // The admin logs in here too — role comes from the record, never the request.
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

  return NextResponse.json({
    ok: true,
    data: {
      id: String(user._id),
      name: user.name,
      mobile: user.mobile,
      role: user.role,
    },
  });
}
