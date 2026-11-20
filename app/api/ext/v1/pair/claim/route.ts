import { NextResponse } from "next/server";
import { consumeIntentDb, setRefreshTokenDb } from "@/src/services/store/device-db";
import { createDeviceToken, newJti } from "@/src/core/auth/device-token";
import { findUserDb } from "@/src/services/store/core-db";

const NO_STORE = { "Cache-Control": "no-store" };

interface ClaimBody {
  pairingCode?: unknown;
  deviceName?: unknown;
  fingerprint?: unknown;
  sketchupVersion?: unknown;
  os?: unknown;
  extensionVersion?: unknown;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** POST /api/ext/v1/pair/claim — extension-side: exchange pairing code for tokens. */
export async function POST(request: Request) {
  let body: ClaimBody;
  try {
    body = (await request.json()) as ClaimBody;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400, headers: NO_STORE });
  }
  if (!isNonEmptyString(body.pairingCode) || !isNonEmptyString(body.deviceName) || !isNonEmptyString(body.fingerprint)) {
    return NextResponse.json({ error: "pairingCode, deviceName, fingerprint are required" }, { status: 400, headers: NO_STORE });
  }

  try {
    const { deviceId, userId } = await consumeIntentDb(body.pairingCode.trim().toUpperCase(), {
      name: body.deviceName.trim().slice(0, 80),
      fingerprint: body.fingerprint.trim().slice(0, 120),
      sketchupVersion: isNonEmptyString(body.sketchupVersion) ? body.sketchupVersion.slice(0, 40) : "",
      os: isNonEmptyString(body.os) ? body.os.slice(0, 40) : "",
      extensionVersion: isNonEmptyString(body.extensionVersion) ? body.extensionVersion.slice(0, 40) : "",
    });

    const owner = await findUserDb(userId);
    if (!owner) throw new Error("intent owner no longer exists");

    const refreshJti = newJti();
    const refresh = createDeviceToken("refresh", { sub: owner.id, devId: deviceId, jti: refreshJti });
    const access = createDeviceToken("access", { sub: owner.id, devId: deviceId, jti: newJti() });
    setRefreshTokenDb(deviceId, refresh, refreshJti);

    return NextResponse.json(
      {
        deviceId,
        accessToken: access,
        accessTokenExpiresIn: 900,
        refreshToken: refresh,
        refreshTokenExpiresIn: 90 * 24 * 60 * 60,
        user: { id: owner.id, name: owner.name, role: owner.role },
        company: { id: owner.companyId },
      },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "pairing failed";
    return NextResponse.json({ error: "pairing failed", detail: message }, { status: 400, headers: NO_STORE });
  }
}

export const dynamic = "force-dynamic";
