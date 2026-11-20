import { NextResponse } from "next/server";
import { readSession } from "@/src/core/auth/session";
import { createIntentDb, DeviceStorageError } from "@/src/services/store/device-db";

const NO_STORE = { "Cache-Control": "no-store" };

/** POST /api/ext/v1/pair/intent — browser-side: user starts pairing a device. */
export async function POST() {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });

  try {
    const { code, expiresAt, expiresInSec } = await createIntentDb(user.id, user.companyId, 600);
    return NextResponse.json(
      { pairingCode: code, expiresAt, expiresInSec },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    const message = error instanceof DeviceStorageError ? error.message : "خطای ذخیره‌سازی";
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE });
  }
}
