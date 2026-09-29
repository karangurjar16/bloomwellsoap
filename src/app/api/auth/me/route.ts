import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { User } from "@/models/User";

const UNAUTHORIZED = NextResponse.json(
  { ok: false, error: "Not signed in" },
  { status: 401 },
);

export async function GET() {
  const token = (await cookies()).get("bw_session")?.value;
  if (!token) return UNAUTHORIZED.clone();

  let userId: string;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SESSION_SECRET),
    );
    if (!payload.sub) return UNAUTHORIZED.clone();
    userId = payload.sub;
  } catch {
    // Expired, tampered with, or signed by an old secret.
    return UNAUTHORIZED.clone();
  }

  // Read fresh instead of trusting the token's claims: an account disabled
  // after the token was issued must stop working immediately.
  const user = await User.findById(userId);
  if (!user || !user.isActive) return UNAUTHORIZED.clone();

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
