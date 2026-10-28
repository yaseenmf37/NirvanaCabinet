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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });

  const { id } = await params;
  const project = readPlatform().projects.find((item) => item.id === id);
  if (!project || !canAccessProject(user, project)) {
    return NextResponse.json({ error: "پروژه یافت نشد." }, { status: 404, headers: NO_STORE });
  }
  return NextResponse.json(project, { headers: NO_STORE });
}

export const PUT = deprecated;
export const DELETE = deprecated;
