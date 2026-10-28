import type { ProjectStage, ProjectStatus } from "@/src/core/types";

export function validateWorkflowTitle(value: unknown) {
  const title = typeof value === "string" ? value.trim() : "";
  if (!title || title.length > 200) return null;
  return title;
}

export function validateProjectText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text && text.length <= 160 ? text : null;
}

export function normalizePhone(value: unknown) {
  if (typeof value !== "string") return null;
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("98") && digits.length === 12 ? `0${digits.slice(2)}` : digits;
  if (!/^09\d{9}$/.test(normalized)) return null;
  return normalized;
}

export function normalizeProgress(value: unknown, fallback: number) {
  if (value === undefined) return fallback;
  const progress = Number(value);
  if (!Number.isFinite(progress)) return null;
  return Math.min(100, Math.max(0, progress));
}

export function isProjectStage(value: unknown): value is ProjectStage {
  return ["planning", "analysis", "cutting", "assembly", "logistics", "installation"].includes(value as string);
}

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return ["review", "active", "waiting_approval", "completed", "paused"].includes(value as string);
}

export function isWorkflowKind(value: unknown): value is "assembly" | "installation" {
  return value === "assembly" || value === "installation";
}

export function isComponentStatus(value: unknown): value is "pending" | "completed" | "problem" {
  return value === "pending" || value === "completed" || value === "problem";
}

export function isMissingPartStatus(value: unknown): value is "reported" | "in_progress" | "resolved" {
  return value === "reported" || value === "in_progress" || value === "resolved";
}

export function isShipmentPhase(value: unknown): value is "dispatch" | "receipt" {
  return value === "dispatch" || value === "receipt";
}

export function isActionType(value: unknown): value is "save_room" | "set_workflow" | "set_component_status" | "confirm_shipment" | "create_workflow" | "create_project" | "update_project" | "update_missing_part" | "publish_faq_answer" | "add_employee" | "remove_employee" {
  return ["save_room", "set_workflow", "set_component_status", "confirm_shipment", "create_workflow", "create_project", "update_project", "update_missing_part", "publish_faq_answer", "add_employee", "remove_employee"].includes(value as string);
}

export function isSkpFileName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 200 && /\.skp$/i.test(value.trim());
}

export function isSkpSize(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 25 * 1024 * 1024;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyId(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 200;
}

export function isNonNegativeQuantity(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1_000_000;
}
