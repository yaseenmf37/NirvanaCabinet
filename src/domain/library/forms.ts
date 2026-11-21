/**
 * Dynamic form engine — derives the parameter form for any template from its
 * structural capabilities (what its build actually consumes), so no per-unit
 * form is hand-written for 103 templates.
 *
 * A field appears when the template's capability map says the unit uses it;
 * ranges/limits come from LIMITS and the template's materials lists.
 */

import type { TemplateMeta, UnitConfig, ParamSpec, MaterialOption } from "./types.ts";
import { resolveUnit } from "./resolve.ts";

/** Absolute hard limits (mm) — clamped again in resolveUnit. */
export const LIMITS = {
  widthMm: { min: 150, max: 2400, step: 10 },
  heightMm: { min: 100, max: 2800, step: 10 },
  depthMm: { min: 100, max: 1200, step: 10 },
  shelfCount: { min: 0, max: 10, step: 1 },
  doorCount: { min: 0, max: 4, step: 1 },
  drawerCount: { min: 0, max: 6, step: 1 },
} as const;

/** Structural capability keys per template, from its id family/build traits. */
export interface TemplateCapabilities {
  width: boolean;
  height: boolean;
  depth: boolean;
  shelves: boolean;
  doors: boolean;
  drawers: boolean;
  color: boolean;
}

/** Probes a template's structure by resolving it with alternative values. */
function probeCapabilities(template: TemplateMeta): TemplateCapabilities {
  const base = resolveUnit(template, {});
  const roleCounts = (parts: Array<{ role: string }>) => {
    const m = new Map<string, number>();
    for (const p of parts) m.set(p.role, (m.get(p.role) ?? 0) + 1);
    return m;
  };
  const baseRoles = roleCounts(base.parts);
  const defDoors = typeof template.defaults.doorCount === "number" ? template.defaults.doorCount : 0;
  const defShelves = typeof template.defaults.shelfCount === "number" ? template.defaults.shelfCount : 0;
  const defDrawers = typeof template.defaults.drawerCount === "number" ? template.defaults.drawerCount : 0;

  // Probe with values DIFFERENT from defaults — a template whose build ignores
  // config keeps producing the same structure (fixed), a responsive one changes.
  const altDoors = defDoors >= 2 ? 1 : defDoors + 2;
  const withDoors = resolveUnit(template, { doorCount: altDoors });
  const doorResponsive = roleCounts(withDoors.parts).get("door-front") !== baseRoles.get("door-front") || doorLabelChanged(template, altDoors);

  const withShelves = resolveUnit(template, { shelfCount: defShelves + 2 });
  const shelfResponsive = roleCounts(withShelves.parts).get("shelf") !== baseRoles.get("shelf");

  const withDrawers = resolveUnit(template, { drawerCount: defDrawers + 1 });
  const drawerResponsive = (roleCounts(withDrawers.parts).get("drawer-front") ?? 0) > (baseRoles.get("drawer-front") ?? 0);

  return {
    width: true,
    height: true,
    depth: true,
    shelves: shelfResponsive,
    doors: doorResponsive,
    drawers: drawerResponsive,
    color: true,
  };
}

function doorLabelChanged(template: TemplateMeta, altDoors: number): boolean {
  const alt = resolveUnit(template, { doorCount: altDoors });
  return alt.parts.some((p) => p.role === "door-front" && /لولا/.test(p.label));
}

const capabilityCache = new Map<string, TemplateCapabilities>();

export function templateCapabilities(template: TemplateMeta): TemplateCapabilities {
  let caps = capabilityCache.get(template.id);
  if (!caps) {
    caps = probeCapabilities(template);
    capabilityCache.set(template.id, caps);
  }
  return caps;
}

const DOOR_OPENING_OPTIONS = [
  { value: "hinge-right", label: "لولا راست" },
  { value: "hinge-left", label: "لولا چپ" },
  { value: "lift-up", label: "جکی (بالا)" },
  { value: "slide", label: "کشویی" },
  { value: "flip-up", label: "افقی" },
];

/** Builds the adaptive ParamSpec list for one template. */
export function formFields(template: TemplateMeta): ParamSpec[] {
  const caps = templateCapabilities(template);
  const fields: ParamSpec[] = [];

  fields.push({
    key: "widthMm", label: "عرض (میلی‌متر)", kind: "length", unit: "mm",
    range: LIMITS.widthMm, required: true,
  });
  fields.push({
    key: "heightMm", label: "ارتفاع (میلی‌متر)", kind: "length", unit: "mm",
    range: LIMITS.heightMm, required: true,
  });
  fields.push({
    key: "depthMm", label: "عمق (میلی‌متر)", kind: "length", unit: "mm",
    range: LIMITS.depthMm, required: true,
  });

  // Materials with thickness coupled to the chosen option.
  fields.push({
    key: "materialCarcass", label: "متریال بدنه", kind: "material",
    options: template.materials.carcass.map(toOption),
  });
  if (template.materials.front && template.materials.front.length > 0) {
    fields.push({
      key: "materialFront", label: "متریال نما", kind: "material",
      options: template.materials.front.map(toOption),
    });
  }

  fields.push({
    key: "colorCode", label: "کد رنگ", kind: "color",
  });

  if (caps.shelves) {
    fields.push({
      key: "shelfCount", label: "تعداد طبقات", kind: "count",
      range: LIMITS.shelfCount,
    });
  }
  if (caps.doors) {
    fields.push({
      key: "doorCount", label: "تعداد درب", kind: "count",
      range: LIMITS.doorCount,
    });
    fields.push({
      key: "doorOpening", label: "جهت باز شدن درب", kind: "enum",
      options: DOOR_OPENING_OPTIONS,
      visibleWhen: (cfg) => (typeof cfg.doorCount === "number" ? cfg.doorCount : Number(template.defaults.doorCount ?? 0)) > 0,
    });
    fields.push({
      key: "hingeModel", label: "مدل لولا", kind: "select",
      visibleWhen: (cfg) => (typeof cfg.doorCount === "number" ? cfg.doorCount : Number(template.defaults.doorCount ?? 0)) > 0,
    });
  }
  if (caps.drawers) {
    fields.push({
      key: "drawerCount", label: "تعداد کشو", kind: "count",
      range: LIMITS.drawerCount,
    });
  }

  return fields;
}

function toOption(m: MaterialOption): { value: string; label: string } {
  return { value: m.key, label: `${m.label} (${m.thicknessMm}mm)` };
}

/**
 * Validates a config against the template. Returns a list of Persian issues;
 * empty means valid. Range violations are reported, not silently clamped.
 */
export function validateConfig(template: TemplateMeta, config: UnitConfig): string[] {
  const issues: string[] = [];
  const fields = formFields(template);
  for (const f of fields) {
    const v = config[f.key];
    if (v === undefined || v === "") continue; // default applies at resolve
    if (f.range && (f.kind === "length" || f.kind === "count")) {
      const n = Number(v);
      if (!Number.isFinite(n)) {
        issues.push(`${f.label}: مقدار عددی معتبر نیست.`);
      } else if (n < f.range.min || n > f.range.max) {
        issues.push(`${f.label}: باید بین ${f.range.min} و ${f.range.max} باشد.`);
      } else if (f.kind === "count" && !Number.isInteger(n)) {
        issues.push(`${f.label}: باید عدد صحیح باشد.`);
      }
    }
    if (f.kind === "material" && f.options && typeof v === "string") {
      if (!f.options.some((o) => o.value === v)) {
        issues.push(`${f.label}: گزینه انتخابی مجاز نیست.`);
      }
    }
  }
  return issues;
}

/** Merges template defaults with a (possibly partial) config — used by UI/extension. */
export function effectiveFormValues(template: TemplateMeta, config: UnitConfig): UnitConfig {
  return { ...template.defaults, ...config, templateId: template.id, templateSchemaVersion: template.schemaVersion };
}
