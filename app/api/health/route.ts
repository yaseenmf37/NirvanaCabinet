import { NextResponse } from "next/server";
import { checkPlatformReadiness } from "@/src/services/store/platform-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const ready = checkPlatformReadiness();
  return NextResponse.json(
    ready ? { status: "ok", service: "new-nirvana" } : { status: "error", service: "new-nirvana" },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
