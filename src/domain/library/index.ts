export * from "./types.ts";
export * from "./standards.ts";
export * from "./resolve.ts";
export * from "./catalogue.ts";
export * from "./forms.ts";

import { LIBRARY, getTemplate } from "./catalogue.ts";
import { resolveUnit } from "./resolve.ts";
import type { ResolvedUnit, TemplateMeta, UnitConfig } from "./types.ts";

/** All published templates (the shared, code-owned library). */
export function listTemplates(): TemplateMeta[] {
  return LIBRARY;
}

export function templateById(id: string): TemplateMeta | undefined {
  return getTemplate(id);
}

/** Resolve one unit — used by UI preview, extension, and future Excel. */
export function buildUnit(id: string, config: UnitConfig = {}): ResolvedUnit | undefined {
  const template = getTemplate(id);
  return template ? resolveUnit(template, config) : undefined;
}
