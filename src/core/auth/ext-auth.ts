import { NextResponse } from "next/server";
import { readDeviceToken } from "@/src/core/auth/device-token";
import { findDeviceDb, touchDeviceDb } from "@/src/services/store/device-db";
import { findUserDb, listProjectsForUserDb } from "@/src/services/store/core-db";
import type { UserRole } from "@/src/core/types";

export const NO_STORE = { "Cache-Control": "no-store" };

export interface ExtAuthContext {
  userId: string;
  companyId: string;
  deviceId: string;
  role: UserRole;
}

export function unauthorized(message = "unauthorized", code = "UNAUTHORIZED", status = 401) {
  return NextResponse.json({ error: message, code }, { status, headers: NO_STORE });
}

/**
 * Bearer-token auth for the extension. Validates signature, expiry, device
 * status (revoked devices fail immediately, not at token expiry), and that the
 * token's subject still exists in the same company.
 */
export async function requireDeviceAuth(request: Request): Promise<ExtAuthContext | Response> {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return unauthorized("missing bearer token");
  const payload = readDeviceToken(match[1]);
  if (!payload || payload.kind !== "access") return unauthorized("invalid or expired access token", "TOKEN_EXPIRED");
  const device = await findDeviceDb(payload.devId);
  if (!device) return unauthorized("device not found");
  if (device.status === "revoked") return unauthorized("device revoked", "DEVICE_REVOKED", 403);
  if (device.userId !== payload.sub) return unauthorized("token subject mismatch");
  const user = await findUserDb(payload.sub);
  if (!user) return unauthorized("user not found");
  if (user.companyId !== device.companyId) return unauthorized("company mismatch", "FORBIDDEN", 403);
  await touchDeviceDb(device.id);
  return { userId: user.id, companyId: user.companyId, deviceId: device.id, role: user.role };
}

/** Projects the account may see — same scoping rules as the web app. */
export async function listAccessibleProjects(ctx: ExtAuthContext) {
  const projects = await listProjectsForUserDb(ctx.userId);
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    client: project.client,
    stage: project.stage,
    status: project.status,
    progress: project.progress,
    updatedAt: project.updatedAt,
  }));
}
