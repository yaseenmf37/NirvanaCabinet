import { NextResponse } from "next/server";
import { requireDeviceAuth, listAccessibleProjects, NO_STORE } from "@/src/core/auth/ext-auth";

export async function GET(request: Request) {
  const ctx = await requireDeviceAuth(request);
  if (ctx instanceof Response) return ctx;
  return NextResponse.json({ projects: await listAccessibleProjects(ctx) }, { headers: NO_STORE });
}

export const dynamic = "force-dynamic";
