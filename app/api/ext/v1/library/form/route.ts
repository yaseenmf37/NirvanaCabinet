import { NextResponse } from "next/server";
import { requireDeviceAuth, NO_STORE } from "@/src/core/auth/ext-auth";
import { buildUnit, getTemplate, formFields, templateCapabilities, validateConfig, effectiveFormValues } from "@/src/domain/library/index";

interface Body { templateId?: unknown; config?: unknown }

/**
 * POST /api/ext/v1/library/form — adaptive form spec + live preview for one
 * template. One round-trip drives the whole panel: fields, defaults, resolved
 * summary (part counts / envelope / materials), and validation issues.
 */
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

  const fields = formFields(template);
  const capabilities = templateCapabilities(template);
  const effective = effectiveFormValues(template, config);
  const issues = validateConfig(template, effective);

  let preview: Record<string, unknown> | null = null;
  if (issues.length === 0) {
    const unit = buildUnit(templateId, effective);
    if (unit) {
      preview = {
        displayName: unit.displayName,
        envelopeMm: unit.envelopeMm,
        partCount: unit.parts.length,
        hardwareCount: unit.hardware.reduce((s, h) => s + h.quantity, 0),
        materialKeys: [...new Set(unit.parts.map((p) => p.material))],
        parts: unit.parts.map((p) => ({
          id: p.id, role: p.role, label: p.label,
          lengthMm: p.lengthMm, widthMm: p.widthMm, thicknessMm: p.thicknessMm, quantity: p.quantity,
          material: p.material, colorCode: p.colorCode ?? null,
        })),
        // Lightweight 2D front elevation for the panel preview (no geometry in
        // the SketchUp model is touched).
        outline: frontOutline(unit),
      };
    }
  }

  return NextResponse.json(
    { fields, capabilities, effective, issues, preview },
    { headers: NO_STORE },
  );
}

/** 2D front elevation rectangles (mm) for a lightweight panel preview. */
function frontOutline(unit: NonNullable<ReturnType<typeof buildUnit>>) {
  const { widthMm, heightMm } = unit.envelopeMm;
  // Project parts onto the XZ plane (front view), keeping the widest footprint
  // per part. Depth (Y) is ignored — this is an elevation, not a plan.
  const rects = unit.parts
    .filter((p) => p.role !== "carcass-back")
    .map((p) => {
      const horiz = p.orientation.lengthAxis === "x";
      const w = horiz ? p.lengthMm : Math.min(p.widthMm, widthMm);
      const h = horiz ? p.widthMm : p.lengthMm;
      return {
        x: Math.max(0, Math.min(p.positionMm[0], widthMm)),
        z: Math.max(0, Math.min(p.positionMm[2], heightMm)),
        w: Math.min(Math.max(w, 1), widthMm),
        h: Math.min(Math.max(h, 1), heightMm),
        role: p.role,
        label: p.label,
      };
    });
  return { widthMm, heightMm, rects };
}

export const dynamic = "force-dynamic";
