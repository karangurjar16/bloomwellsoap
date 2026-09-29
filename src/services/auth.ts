import { http, type Result } from "./http";

/** Every call to /api/auth. One service file per API folder. */

export type AuthUser = {
  id: string;
  name: string;
  mobile: string;
  role: "customer" | "admin";
};

export type { Result };

export const register = (input: {
  name: string;
  mobile: string;
  password: string;
}) => http.post<AuthUser>("/api/auth/register", input);

export const login = (input: { mobile: string; password: string }) =>
  http.post<AuthUser>("/api/auth/login", input);

export const logout = () =>
  http.post<{ loggedOut: boolean }>("/api/auth/logout");

export const me = () => http.get<AuthUser>("/api/auth/me");

/** Where a user belongs after signing in. */
export const homeFor = (user: AuthUser) =>
  user.role === "admin" ? "/admin" : "/";
