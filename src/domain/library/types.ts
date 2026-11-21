/**
 * Library domain types — parametric cabinet unit definitions.
 *
 * Model: a UnitTemplate declares its category, parameters, and a set of
 * component rules. resolveUnit(template, config) runs the rules to produce a
 * ResolvedUnit: fully-calculated parts with mm dimensions, positions,
 * materials, and machining metadata. This is the single source of truth for
 * the web UI, the SketchUp extension, and the future analysis/Excel engine.
 */

export type CategoryPath = string[]; // e.g. ["base", "sink"]

export type ParamKind = "length" | "count" | "enum" | "bool" | "material" | "color" | "select";

export interface ParamRange {
  min: number;
  max: number;
  step?: number;
}

export interface ParamOption {
  value: string;
  label: string; // Persian label
}

export interface ParamSpec {
  key: string;
  label: string; // Persian
  kind: ParamKind;
  unit?: "mm";
  range?: ParamRange;
  options?: ParamOption[];
  required?: boolean;
  /** Hide the field when this returns false (adaptive form). */
  visibleWhen?: (config: UnitConfig) => boolean;
  /** Hide the field entirely in UI (internal param, e.g. computed). */
  hidden?: boolean;
}

/** User-supplied configuration for a unit instance. */
export interface UnitConfig {
  templateId?: string;
  templateSchemaVersion?: number;
  widthMm?: number;
  heightMm?: number;
  depthMm?: number;
  materialCarcass?: string;
  materialFront?: string;
  materialBack?: string;
  materialShelf?: string;
  thicknessCarcassMm?: number;
  thicknessFrontMm?: number;
  thicknessBackMm?: number;
  thicknessShelfMm?: number;
  colorCode?: string;
  colorLabel?: string;
  shelfCount?: number;
  shelfPositionsMm?: number[];
  shelfAdjustable?: boolean;
  doorCount?: number;
  doorStyle?: string;
  doorOpening?: "hinge-left" | "hinge-right" | "lift-up" | "slide" | "flip-up";
  drawerCount?: number;
  drawerHeightsMm?: number[];
  hingeModel?: string;
  liftModel?: string;
  runnerModel?: string;
  handleModel?: string;
  [key: string]: unknown;
}

export type PartRole =
  | "carcass-side"
  | "carcass-top"
  | "carcass-bottom"
  | "carcass-back"
  | "shelf"
  | "divider"
  | "door-front"
  | "drawer-front"
  | "drawer-side"
  | "drawer-back"
  | "drawer-bottom"
  | "toe-kick"
  | "countertop"
  | "filler"
  | "trim"
  | "frame-member"
  | "hardware-mount";

export type EdgeFace = "long-left" | "long-right" | "short-top" | "short-bottom";

export interface PartSpec {
  id: string;
  role: PartRole;
  label: string; // Persian
  lengthMm: number; // longest in-plane side
  widthMm: number; // other in-plane side
  thicknessMm: number;
  quantity: number;
  /** Position relative to the unit's origin (mm), cabinet-local. */
  positionMm: [number, number, number];
  /** Axis orientation: which local axis is the part's length, width, thickness. */
  orientation: { lengthAxis: "x" | "y" | "z"; widthAxis: "x" | "y" | "z"; thicknessAxis: "x" | "y" | "z" };
  material: string; // material key, e.g. "mdf-18"
  colorCode?: string;
  edgeBanding: EdgeFace[];
  machining: MachiningSpec[];
  quantitySource?: "spec" | "derived";
  confidence: "specified";
}

export interface MachiningSpec {
  id: string;
  op: "groove" | "rebate" | "dado" | "rabbet" | "hole" | "hinge-cup" | "rail-hole" | "handle-bore" | "edge-profile" | "notch" | "miter" | "cnc-pocket" | "vent-slot";
  /** Reference edge (part-local) for offsets. */
  datum: string;
  offsetMm?: number;
  widthMm?: number;
  heightMm?: number;
  depthMm: number;
  through: boolean;
  diameterMm?: number;
  quantity: number;
  source: "spec";
}

export type HardwareKind = "hinge" | "lift" | "runner" | "handle" | "leg" | "bracket" | "suspension";

export interface HardwareSpec {
  id: string;
  kind: HardwareKind;
  model?: string;
  quantity: number;
  positionMm?: [number, number, number];
  /** Load limits or compatibility notes (kept for future analysis). */
  notes?: string;
}

export interface MaterialSpec {
  key: string;
  label: string;
  kind: "mdf" | "particle" | "ply" | "hpl" | "acrylic" | "glass" | "metal" | "wood" | "veneer" | "other";
  thicknessMm: number;
  defaultColorCode?: string;
}

/** Fully-resolved unit geometry (all parts, machining, materials, hardware). */
export interface ResolvedUnit {
  id: string;
  templateId: string;
  templateSchemaVersion: number;
  displayName: string;
  category: CategoryPath;
  envelopeMm: { widthMm: number; heightMm: number; depthMm: number };
  config: UnitConfig;
  parts: PartSpec[];
  materials: MaterialSpec[];
  hardware: HardwareSpec[];
  warnings: ResolveWarning[];
}

export interface ResolveWarning {
  code: string;
  severity: "warning" | "error";
  message: string;
}

/** One material option a template accepts. */
export interface MaterialOption {
  key: string;
  label: string;
  thicknessMm: number;
}

export interface TemplateMeta {
  id: string;
  nameFa: string;
  category: CategoryPath;
  description?: string;
  schemaVersion: number;
  /** Default config used when the user changes nothing. */
  defaults: UnitConfig;
  /** Allowed materials per slot (only these render in the form). */
  materials: {
    carcass: MaterialOption[];
    front?: MaterialOption[];
    back?: MaterialOption[];
    shelf?: MaterialOption[];
  };
  /** Hardware options per device, used by adaptive form. */
  hardware: Record<string, MaterialOption[]>;
  /** Structural build rule — emits parts/hardware into the BuildContext. */
  build: (ctx: import("./resolve.ts").BuildContext) => void;
}
