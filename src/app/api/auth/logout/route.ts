import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// POST, not GET: a logout link prefetched by the browser would sign the user
// out without them asking.
export async function POST() {
  (await cookies()).delete("bw_session");
  return NextResponse.json({ ok: true, data: { loggedOut: true } });
}
