/**
 * One fetch wrapper for every service. Unwraps the { ok, data } envelope the
 * routes return, and turns a network failure into the same shape so callers
 * only ever branch on `ok`.
 */

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> };

async function send<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  let response: Response;

  try {
    response = await fetch(path, init);
  } catch {
    // Only a genuine transport failure reaches here.
    return {
      ok: false,
      error: "Could not reach the server. Check your connection.",
    };
  }

  // A crashed route handler answers with an HTML error page, and calling
  // .json() on it throws — which used to surface as "check your connection"
  // and hid the real failure. Report the status instead.
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      error: `Server error (${response.status}). Please try again.`,
    };
  }

  try {
    return (await response.json()) as Result<T>;
  } catch {
    return {
      ok: false,
      error: `Unreadable response from the server (${response.status}).`,
    };
  }
}

const json = (body: unknown): RequestInit => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const http = {
  get: <T>(path: string) => send<T>(path),
  post: <T>(path: string, body?: unknown) =>
    send<T>(path, { method: "POST", ...(body === undefined ? {} : json(body)) }),
  patch: <T>(path: string, body: unknown) =>
    send<T>(path, { method: "PATCH", ...json(body) }),
  del: <T>(path: string, body?: unknown) =>
    send<T>(path, {
      method: "DELETE",
      ...(body === undefined ? {} : json(body)),
    }),
  /** Multipart — the browser must set its own boundary, so no Content-Type. */
  upload: <T>(path: string, form: FormData) =>
    send<T>(path, { method: "POST", body: form }),
};
