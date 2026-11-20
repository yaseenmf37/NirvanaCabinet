import { NextResponse } from "next/server";
import { requireDeviceAuth, unauthorized, NO_STORE } from "@/src/core/auth/ext-auth";
import { revokeDeviceDb, listDevicesDb } from "@/src/services/store/device-db";

interface Body { deviceId?: unknown }

/** POST /api/ext/v1/devices/revoke — revoke current or specified device (same user). */
export async function POST(request: Request) {
  const ctx = await requireDeviceAuth(request);
  if (ctx instanceof Response) return ctx;

  let body: Body = {};
  try { body = (await request.json()) as Body; } catch { /* default: revoke self */ }
  const targetId = typeof body.deviceId === "string" ? body.deviceId : ctx.deviceId;

  const mine = await listDevicesDb(ctx.userId);
  if (!mine.some((d) => d.id === targetId)) {
    return unauthorized("device not owned by account", "FORBIDDEN", 403);
  }
  try {
    await revokeDeviceDb(targetId, "revoked by user");
  } catch (e) {
    const message = e instanceof Error ? e.message : "storage error";
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true, revokedDeviceId: targetId }, { headers: NO_STORE });
}

export const dynamic = "force-dynamic";
