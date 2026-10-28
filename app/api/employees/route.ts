export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { hasModule } from "@/src/core/auth/access";
import { readSession } from "@/src/core/auth/session";
import { publicUser, readPlatform } from "@/src/services/store/platform-db";

const NO_STORE = { "Cache-Control": "no-store" };

const deprecated = () =>
  NextResponse.json(
    { error: "این API منسوخ شده است؛ مدیریت کارکنان از رابط مدیریت انجام می‌شود." },
    { status: 403, headers: NO_STORE }
  );

export async function GET() {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  if (!hasModule(user, "employees")) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });

  const employees = readPlatform()
    .users.filter((item) => item.companyId === user.companyId)
    .map((item) => publicUser(item));
  return NextResponse.json(employees, { headers: NO_STORE });
}

export const POST = deprecated;
export const PUT = deprecated;
