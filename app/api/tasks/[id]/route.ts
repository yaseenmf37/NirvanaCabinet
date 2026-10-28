import { NextResponse } from "next/server";

const NO_STORE = { "Cache-Control": "no-store" };

export function GET() {
  return NextResponse.json({ error: "این API منسوخ شده است." }, { status: 410, headers: NO_STORE });
}
