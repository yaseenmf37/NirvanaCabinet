export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { canAccessProject, hasModule, canManageWorkflow } from "@/src/core/auth/access";
import { readSession } from "@/src/core/auth/session";
import { readPlatform } from "@/src/services/store/platform-db";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await readSession();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const state = readPlatform();
  const projects = state.projects.filter((project) => canAccessProject(user, project));
  const projectIds = new Set(projects.map((project) => project.id));

  return NextResponse.json({
    user,
    company: state.companies.find((company) => company.id === user.companyId) ?? null,
    projects,
    rooms: state.rooms.filter((room) => projectIds.has(room.projectId) && (hasModule(user, "planning") || hasModule(user, "analysis") || hasModule(user, "cutting"))),
    skpFiles: (state.skpFiles ?? []).filter((file) => projectIds.has(file.projectId)).map(({ storagePath: _storagePath, ...file }) => file),
    componentItems: (state.componentItems ?? []).filter((item) => projectIds.has(item.projectId)),
    assemblyItems: state.assemblyItems.filter(
      (item) => projectIds.has(item.projectId) && hasModule(user, "assembly") && canManageWorkflow(user, item.assigneeId)
    ),
    installationItems: state.installationItems.filter(
      (item) => projectIds.has(item.projectId) && hasModule(user, "installation") && canManageWorkflow(user, item.assigneeId)
    ),
    missingParts: state.missingParts.filter(
      (item) => projectIds.has(item.projectId) && (hasModule(user, "assembly") || hasModule(user, "cutting"))
    ),
    shipments: state.shipments.filter(
      (item) => projectIds.has(item.projectId) && hasModule(user, "logistics")
    ),
    employees: state.users
      .filter((item) => item.companyId === user.companyId && hasModule(user, "employees"))
      .map(({ password: _password, ...safe }) => safe),
    unansweredQuestions: user.role === "project_manager" || user.role === "production_manager" ? state.unansweredQuestions : [],
  }, { headers: NO_STORE });
}
