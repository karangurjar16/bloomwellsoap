import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Session reading for the ~18 protected routes. The auth routes sign their own
 * tokens inline; this only reads them, so there is one place that decides
 * "who is calling and may they do this".
 */

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get("bw_session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SESSION_SECRET),
    );
    const role = payload.role;
    if (!payload.sub || (role !== "customer" && role !== "admin")) return null;
    return { userId: payload.sub, role };
  } catch {
    // Expired, tampered with, or signed by an old secret.
    return null;
  }
}

const unauthorized = () =>
  NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

/** 404 rather than 403: a 403 confirms the resource exists. */
const notFound = () =>
  NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

/**
 * Returns the session, or a response to return immediately.
 * Usage: const s = await requireUser(); if ("response" in s) return s.response;
 */
export async function requireUser(): Promise<
  { session: SessionUser } | { response: NextResponse }
> {
  const session = await getSession();
  return session ? { session } : { response: unauthorized() };
}

export async function requireAdmin(): Promise<
  { session: SessionUser } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) return { response: unauthorized() };
  // Hiding the button in the UI is not authorization; this is.
  if (session.role !== "admin") return { response: notFound() };
  return { session };
}
