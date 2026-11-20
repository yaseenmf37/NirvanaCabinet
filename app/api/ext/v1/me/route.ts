import { NextResponse } from "next/server";
import { requireDeviceAuth, NO_STORE } from "@/src/core/auth/ext-auth";
import { findUserDb, findCompanyDb, listProjectsForUserDb } from "@/src/services/store/core-db";
import { findDeviceDb } from "@/src/services/store/device-db";

export async function GET(request: Request) {
  const ctx = await requireDeviceAuth(request);
  if (ctx instanceof Response) return ctx;

  const user = await findUserDb(ctx.userId);
  const company = user ? await findCompanyDb(user.companyId) : undefined;
  const device = await findDeviceDb(ctx.deviceId);
  const projects = await listProjectsForUserDb(ctx.userId);

  return NextResponse.json(
    {
      account: {
        userId: ctx.userId,
        userName: user?.name ?? "",
        role: ctx.role,
        companyId: ctx.companyId,
        companyName: company?.name ?? "",
      },
      device: device ? { id: device.id, name: device.name, status: device.status, lastSeenAt: device.lastSeenAt } : null,
      projects: projects.map((project) => ({ id: project.id, name: project.name, client: project.client, stage: project.stage, status: project.status, progress: project.progress, updatedAt: project.updatedAt })),
      capabilities: {
        unitLibrary: false,
        submitUnit: false,
        geometryExtract: false,
        analysisResults: false,
        sync: false,
      },
      serverTime: new Date().toISOString(),
    },
    { headers: NO_STORE },
  );
}

export const dynamic = "force-dynamic";
