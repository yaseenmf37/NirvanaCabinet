import { NextResponse } from "next/server";
import { requireDeviceAuth, NO_STORE } from "@/src/core/auth/ext-auth";
import { buildUnit, getTemplate } from "@/src/domain/library/index";

interface Body { templateId?: unknown; config?: unknown }

/** POST /api/ext/v1/library/resolve — resolve one unit to full geometry. */
export async function POST(request: Request) {
  const ctx = await requireDeviceAuth(request);
  if (ctx instanceof Response) return ctx;

  let body: Body;
  try { body = (await request.json()) as Body; } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400, headers: NO_STORE });
  }
  const templateId = typeof body.templateId === "string" ? body.templateId : "";
  const config = (typeof body.config === "object" && body.config !== null ? body.config : {}) as Record<string, unknown>;
  if (!templateId) return NextResponse.json({ error: "templateId required" }, { status: 400, headers: NO_STORE });

  const template = getTemplate(templateId);
  if (!template) return NextResponse.json({ error: "template not found", code: "TEMPLATE_NOT_FOUND" }, { status: 404, headers: NO_STORE });

  const unit = buildUnit(templateId, config as never);
  if (!unit) return NextResponse.json({ error: "resolve failed" }, { status: 422, headers: NO_STORE });

  return NextResponse.json({ unit }, { headers: NO_STORE });
}

export const dynamic = "force-dynamic";
