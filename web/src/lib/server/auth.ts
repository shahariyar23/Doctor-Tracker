import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverFetch, ServerApiError } from "./api-client";
import type { User } from "@/types/auth";

/**
 * Validates the current session by calling Express GET /api/v1/auth/me
 * with the incoming HTTP-only token cookie forwarded.
 * 
 * Returns the authenticated Admin profile if valid, or null if unauthenticated/expired/deleted.
 */
export async function getAuthenticatedAdmin(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token?.value) {
    return null;
  }

  try {
    const user = await serverFetch<User>("/auth/me");
    return user;
  } catch (error) {
    if (error instanceof ServerApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    // For other errors (e.g. backend temporarily unreachable during cold start),
    // treat as unauthenticated to prevent protected content rendering.
    return null;
  }
}

/**
 * Server guard: Enforces that the incoming request is authenticated.
 * If not authenticated, redirects directly to /login on the server side
 * before any protected dashboard layout or page content is rendered.
 */
export async function requireAuth(): Promise<User> {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    redirect("/login");
  }

  return admin;
}

