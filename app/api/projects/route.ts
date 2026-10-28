export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { canAccessProject } from "@/src/core/auth/access";
import { readSession } from "@/src/core/auth/session";
import { readPlatform } from "@/src/services/store/platform-db";

const NO_STORE = { "Cache-Control": "no-store" };

const deprecated = () =>
  NextResponse.json(
    { error: "این API منسوخ شده است؛ برای تغییرات از /api/platform/actions استفاده کنید." },
    { status: 403, headers: NO_STORE }
  );

export async function GET() {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  const projects = readPlatform().projects.filter((project) => canAccessProject(user, project));
  return NextResponse.json(projects, { headers: NO_STORE });
}

export const POST = deprecated;
export const PUT = deprecated;
