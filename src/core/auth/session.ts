import { cookies } from "next/headers";
import { findUserById, publicUser } from "@/src/services/store/platform-db";
import { createSessionToken, readSessionUserId, SESSION_MAX_AGE_SECONDS } from "./session-token";
import type { SessionUser } from "../types";
import { SESSION_COOKIE_NAME } from "./session-cookie";

export async function readSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const userId = token ? readSessionUserId(token) : null;
  if (!userId) return null;
  const user = findUserById(userId);
  return user ? publicUser(user) : null;
}

export async function writeSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, createSessionToken(userId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", priority: "high", maxAge: SESSION_MAX_AGE_SECONDS });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
}
