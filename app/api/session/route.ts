export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readSession } from "@/src/core/auth/session";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await readSession();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401, headers: NO_STORE });
  }
  return NextResponse.json({ user }, { headers: NO_STORE });
}
