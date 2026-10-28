export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readSession } from "@/src/core/auth/session";
import { canAccessProject } from "@/src/core/auth/access";
import { readPlatform } from "@/src/services/store/platform-db";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });

  const state = readPlatform();
  const projectIds = new Set(
    state.projects.filter((project) => canAccessProject(user, project)).map((project) => project.id)
  );

  const tasks = [...state.assemblyItems, ...state.installationItems].filter((item) =>
    projectIds.has(item.projectId)
  );
  return NextResponse.json(tasks, { headers: NO_STORE });
}
