import { NextResponse } from "next/server";
import { readDeviceToken, createDeviceToken, newJti, DEVICE_MAX_REFRESH_ROTATIONS } from "@/src/core/auth/device-token";
import { findDeviceDb, setRefreshTokenDb, revokeDeviceDb, touchDeviceDb, hashToken } from "@/src/services/store/device-db";

const NO_STORE = { "Cache-Control": "no-store" };

interface Body { refreshToken?: unknown }

export async function POST(request: Request) {
  let body: Body;
  try { body = (await request.json()) as Body; } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400, headers: NO_STORE });
  }
  if (typeof body.refreshToken !== "string") {
    return NextResponse.json({ error: "refreshToken required" }, { status: 400, headers: NO_STORE });
  }

  const payload = readDeviceToken(body.refreshToken);
  if (!payload || payload.kind !== "refresh") {
    return NextResponse.json({ error: "invalid or expired refresh token" }, { status: 401, headers: NO_STORE });
  }

  const device = await findDeviceDb(payload.devId);
  if (!device) return NextResponse.json({ error: "device not found" }, { status: 401, headers: NO_STORE });
  if (device.status === "revoked") {
    return NextResponse.json({ error: "device revoked", code: "DEVICE_REVOKED" }, { status: 403, headers: NO_STORE });
  }
  // Rotation: refresh token must match current hash and jti.
  if (device.refreshHash !== hashToken(body.refreshToken) || device.refreshJti !== payload.jti) {
    // Possible reuse/theft: revoke device.
    revokeDeviceDb(device.id, "refresh token reuse detected");
    return NextResponse.json({ error: "refresh token reuse detected", code: "DEVICE_REVOKED" }, { status: 403, headers: NO_STORE });
  }
  // Limit how often a device may rotate (rollover protection).
  if (device.rotationCount >= DEVICE_MAX_REFRESH_ROTATIONS) {
    revokeDeviceDb(device.id, "too many refresh rotations");
    return NextResponse.json({ error: "refresh limit reached", code: "DEVICE_REVOKED" }, { status: 403, headers: NO_STORE });
  }

  const refreshJti = newJti();
  const refresh = createDeviceToken("refresh", { sub: payload.sub, devId: device.id, jti: refreshJti });
  const access = createDeviceToken("access", { sub: payload.sub, devId: device.id, jti: newJti() });
  try {
    await setRefreshTokenDb(device.id, refresh, refreshJti);
    await touchDeviceDb(device.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "storage error";
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }

  return NextResponse.json(
    { accessToken: access, accessTokenExpiresIn: 900, refreshToken: refresh, refreshTokenExpiresIn: 90 * 24 * 60 * 60 },
    { status: 200, headers: NO_STORE },
  );
}

export const dynamic = "force-dynamic";
