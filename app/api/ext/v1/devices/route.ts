import { NextResponse } from "next/server";
import { readSession } from "@/src/core/auth/session";
import { listDevicesDb, revokeDeviceDb } from "@/src/services/store/device-db";

const NO_STORE = { "Cache-Control": "no-store" };

/** GET /api/ext/v1/devices — browser-side: list my paired devices. */
export async function GET() {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  const devices = (await listDevicesDb(user.id)).map((d) => ({
    id: d.id, name: d.name, status: d.status, sketchupVersion: d.sketchupVersion,
    os: d.os, extensionVersion: d.extensionVersion, pairedAt: d.pairedAt, lastSeenAt: d.lastSeenAt, revokedAt: d.revokedAt,
  }));
  return NextResponse.json({ devices }, { headers: NO_STORE });
}

/** DELETE /api/ext/v1/devices — browser-side: revoke a device from web app. */
export async function DELETE(request: Request) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  let body: { deviceId?: unknown };
  try { body = (await request.json()) as { deviceId?: unknown }; } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400, headers: NO_STORE });
  }
  if (typeof body.deviceId !== "string") {
    return NextResponse.json({ error: "deviceId required" }, { status: 400, headers: NO_STORE });
  }
  const mine = await listDevicesDb(user.id);
  if (!mine.some((d) => d.id === body.deviceId)) {
    return NextResponse.json({ error: "not found" }, { status: 404, headers: NO_STORE });
  }
  try {
    await revokeDeviceDb(body.deviceId, "revoked from web app");
  } catch (e) {
    const message = e instanceof Error ? e.message : "storage error";
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}

export const dynamic = "force-dynamic";
