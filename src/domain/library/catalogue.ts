/**
 * The parametric cabinet library — 100+ real, distinct unit templates.
 *
 * Distinctness rule: a template is distinct when its structural rule-set
 * differs (different part composition / opening mechanism / sub-category),
 * NOT merely its default dimensions. All templates share the pure calc engine
 * (resolve.ts). Each template is code-defined; users cannot publish to this
 * shared library — publishing is code-only (developer-owned).
 */

import type { BuildContext } from "./resolve.ts";
import { helpers } from "./resolve.ts";
import { STANDARDS } from "./standards.ts";
import type { TemplateMeta, UnitConfig } from "./types.ts";

/* ───────────────────── shared material sets ───────────────────── */

const CARCASS_MATS = [
  { key: "mdf-16", label: "ام‌دی‌اف ۱۶", thicknessMm: 16 },
  { key: "mdf-18", label: "ام‌دی‌اف ۱۸", thicknessMm: 18 },
  { key: "particle-16", label: "خرده‌چوب ۱۶", thicknessMm: 16 },
];
const FRONT_MATS = [
  { key: "mdf-18", label: "ام‌دی‌اف ۱۸", thicknessMm: 18 },
  { key: "mdf-16", label: "ام‌دی‌اف ۱۶", thicknessMm: 16 },
  { key: "hpl-18", label: "های‌پل ۱۸", thicknessMm: 18 },
  { key: "acrylic-18", label: "آکریلیک ۱۸", thicknessMm: 18 },
];
const BACK_MATS = [
  { key: "hdf-3", label: "اچ‌دی‌اف ۳", thicknessMm: 3 },
  { key: "hdf-5", label: "اچ‌دی‌اف ۵", thicknessMm: 5 },
];
const SHELF_MATS = [
  { key: "mdf-16", label: "ام‌دی‌اف ۱۶", thicknessMm: 16 },
  { key: "mdf-18", label: "ام‌دی‌اف ۱۸", thicknessMm: 18 },
];

interface TemplateSpec {
  id: string;
  nameFa: string;
  category: string[];
  description?: string;
  defaults?: Partial<UnitConfig>;
  build: (ctx: BuildContext) => void;
}

function def(spec: TemplateSpec): TemplateMeta {
  const defaults: UnitConfig = {
    templateId: spec.id,
    widthMm: 600,
    heightMm: 720,
    depthMm: 560,
    materialCarcass: "mdf-16",
    materialFront: "mdf-18",
    materialBack: "hdf-3",
    materialShelf: "mdf-16",
    colorCode: "#8B5A2B",
    colorLabel: "راش",
    doorCount: 1,
    drawerCount: 0,
    shelfAdjustable: true,
    doorOpening: "hinge-right",
    ...spec.defaults,
  };
  return {
    id: spec.id,
    nameFa: spec.nameFa,
    category: spec.category,
    description: spec.description,
    schemaVersion: 1,
    defaults,
    materials: { carcass: CARCASS_MATS, front: FRONT_MATS, back: BACK_MATS, shelf: SHELF_MATS },
    hardware: {},
    build: spec.build,
  };
}

/* ───────────────────── build helpers (structural rules) ───────────────────── */

function baseUnitExterior(ctx: BuildContext, full: { withTop?: boolean; withToeKick?: boolean; drawers?: number[]; doors?: number; shelves?: number }) {
  helpers.baseCarcass(ctx, { withTop: full.withTop, withToeKick: full.withToeKick !== false });
  if (full.shelves && full.shelves > 0) helpers.shelves(ctx, { count: full.shelves });
  if (full.drawers && full.drawers.length > 0) helpers.drawers(ctx, { heightsMm: full.drawers });
  if (full.doors && full.doors > 0) helpers.doors(ctx, { count: full.doors });
}

function wallUnit(ctx: BuildContext, doors: number, shelves = 0) {
  helpers.wallCarcass(ctx);
  if (shelves > 0) helpers.shelves(ctx, { count: shelves });
  helpers.doors(ctx, { count: doors });
}

function tallUnit(ctx: BuildContext, doors: number, defaultShelves = 0) {
  helpers.baseCarcass(ctx, { withTop: true, withToeKick: true });
  const count = typeof ctx.config.shelfCount === "number" ? ctx.config.shelfCount : defaultShelves;
  helpers.shelves(ctx, { count });
  helpers.doors(ctx, { count: doors });
}

/* ───────────────────── catalogue ───────────────────── */

function drawerBaseFamily(ctx: BuildContext, defaultHeightsMm: number[]) {
  helpers.baseCarcass(ctx, { withTop: false });
  // Drawer heights are parametric: explicit config wins, otherwise the family
  // default layout applies (same rules the web form displays).
  const n = typeof ctx.config.drawerCount === "number" && ctx.config.drawerCount > 0
    ? ctx.config.drawerCount
    : defaultHeightsMm.length;
  let heightsMm: number[] = defaultHeightsMm;
  if (Array.isArray(ctx.config.drawerHeightsMm) && ctx.config.drawerHeightsMm.length === n) {
    heightsMm = ctx.config.drawerHeightsMm as number[];
  } else if (n !== defaultHeightsMm.length) {
    const usable = ctx.heightMm - 6;
    heightsMm = Array.from({ length: n }, () => Math.floor(usable / n));
  }
  helpers.drawers(ctx, { heightsMm });
  // metal drawer box runner rail
  helpers.part(ctx, {
    id: "metal-rail-l", role: "hardware-mount", label: "ریل فلزی",
    lengthMm: ctx.interiorDepthMm - 20, widthMm: 20, thicknessMm: 4, quantity: 1,
    positionMm: [ctx.thickness.carcass + 8, ctx.thickness.carcass + 8, ctx.heightMm - 40],
    orientation: { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" }, edgeBanding: [], material: "metal-4",
  });
}

export const LIBRARY: TemplateMeta[] = [
  /* ─── BASE — 0/1/2 door, drawers, sink, cooktop, combo ─── */
  def({ id: "base-open-shelf", nameFa: "کابینت زمینی باز (بدون درب)", category: ["base", "open"], build: (ctx) => baseUnitExterior(ctx, { doors: 0, shelves: 2 }) }),
  def({ id: "base-open-shelf-1row", nameFa: "کابینت زمینی باز تک‌طبقه", category: ["base", "open"], defaults: { heightMm: 400 }, build: (ctx) => baseUnitExterior(ctx, { doors: 0, shelves: 1 }) }),
  def({ id: "base-one-door", nameFa: "کابینت زمینی تک‌درب", category: ["base", "door"], build: (ctx) => baseUnitExterior(ctx, { doors: 1 }) }),
  def({ id: "base-one-door-shelf", nameFa: "کابینت زمینی تک‌درب با طبقه", category: ["base", "door"], build: (ctx) => baseUnitExterior(ctx, { doors: 1, shelves: 1 }) }),
  def({ id: "base-two-door", nameFa: "کابینت زمینی دو‌درب", category: ["base", "door"], build: (ctx) => baseUnitExterior(ctx, { doors: 2 }) }),
  def({ id: "base-two-door-shelf", nameFa: "کابینت زمینی دو‌درب با طبقه", category: ["base", "door"], build: (ctx) => baseUnitExterior(ctx, { doors: 2, shelves: 1 }) }),
  def({ id: "base-two-door-2shelf", nameFa: "کابینت زمینی دو‌درب با دو طبقه", category: ["base", "door"], build: (ctx) => baseUnitExterior(ctx, { doors: 2, shelves: 2 }) }),
  def({ id: "base-one-drawer", nameFa: "کابینت زمینی تک‌کشو", category: ["base", "drawer"], build: (ctx) => baseUnitExterior(ctx, { drawers: [160] }) }),
  def({ id: "base-two-drawer", nameFa: "کابینت زمینی دو‌کشو", category: ["base", "drawer"], build: (ctx) => baseUnitExterior(ctx, { drawers: [160, 160] }) }),
  def({ id: "base-three-drawer", nameFa: "کابینت زمینی سه‌کشو", category: ["base", "drawer"], build: (ctx) => baseUnitExterior(ctx, { drawers: [140, 180, 220] }) }),
  def({ id: "base-four-drawer", nameFa: "کابینت زمینی چهارکشو", category: ["base", "drawer"], build: (ctx) => baseUnitExterior(ctx, { drawers: [120, 160, 180, 220] }) }),
  def({ id: "base-drawer-door", nameFa: "کابینت زمینی کشو به‌همراه درب", category: ["base", "drawer"], build: (ctx) => baseUnitExterior(ctx, { drawers: [140], doors: 1 }) }),
  def({ id: "base-drawer-2door", nameFa: "کابینت زمینی کشو به‌همراه دو درب", category: ["base", "drawer"], build: (ctx) => baseUnitExterior(ctx, { drawers: [140], doors: 2 }) }),

  // Sink & specialty base (no bottom panel — plumbing passes through; real)
  def({ id: "base-sink-1door", nameFa: "کابینت زیر سینک تک‌درب", category: ["base", "sink"], build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withBottom: false }); helpers.doors(ctx, { count: 1 }); } }),
  def({ id: "base-sink-2door", nameFa: "کابینت زیر سینک دو‌درب", category: ["base", "sink"], build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withBottom: false }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "base-sink-2door-drainer", nameFa: "کابینت زیر سینک با آبچکان", category: ["base", "sink"], build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withBottom: false }); helpers.doors(ctx, { count: 2 }); helpers.part(ctx, { id: "drainer-rail-l", role: "trim", label: "ریل آبچکان", lengthMm: ctx.interiorDepthMm - 40, widthMm: 30, thicknessMm: 16, quantity: 1, positionMm: [ctx.thickness.carcass + 80, ctx.thickness.carcass, ctx.heightMm - 120], orientation: { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" }, edgeBanding: [] }); helpers.part(ctx, { id: "drainer-rail-r", role: "trim", label: "ریل آبچکان", lengthMm: ctx.interiorDepthMm - 40, widthMm: 30, thicknessMm: 16, quantity: 1, positionMm: [ctx.widthMm - ctx.thickness.carcass - 96, ctx.thickness.carcass, ctx.heightMm - 120], orientation: { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" }, edgeBanding: [] }); } }),
  def({ id: "base-cooktop", nameFa: "کابینت زیر اجاق", category: ["base", "cooktop"], build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withBottom: false }); helpers.drawers(ctx, { heightsMm: [160, 220] }); } }),
  def({ id: "base-cooktop-2drawer", nameFa: "کابینت زیر فر با دو کشو", category: ["base", "cooktop"], build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withBottom: false }); helpers.drawers(ctx, { heightsMm: [120, 140, 160] }); } }),
  def({ id: "base-cooktop-door-drawer", nameFa: "کابینت زیر اجاق با درب و کشو", category: ["base", "cooktop"], build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withBottom: false }); helpers.drawers(ctx, { heightsMm: [140] }); helpers.doors(ctx, { count: 1 }); } }),
  def({ id: "base-countertop", nameFa: "یونیت زمینی با صفحه رویی", category: ["base", "countertop"], build: (ctx) => { baseUnitExterior(ctx, { doors: 1 }); helpers.countertop(ctx); } }),

  // Corner base
  def({ id: "base-corner-90", nameFa: "کابینت گوشه ۹۰ درجه", category: ["base", "corner"], build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false }); helpers.doors(ctx, { count: 2 }); helpers.part(ctx, { id: "filler", role: "filler", label: "نوار گوشه", lengthMm: 100, widthMm: ctx.depthMm, thicknessMm: 16, quantity: 1, positionMm: [ctx.widthMm, 0, STANDARDS.toeKickMm], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); } }),
  def({ id: "base-corner-blind", nameFa: "کابینت گوشه کور", category: ["base", "corner"], build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false }); helpers.doors(ctx, { count: 1 }); } }),
  def({ id: "base-corner-lazy", nameFa: "کابینت گوشه با بسکت ریلی", category: ["base", "corner"], defaults: { depthMm: 600 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false }); helpers.doors(ctx, { count: 1 }); helpers.hardware(ctx, { id: "basket-1", kind: "bracket", quantity: 2 }); } }),

  // Integrated / combo
  def({ id: "base-wm-drawer", nameFa: "کابینت ماشین لباسشویی (کشو)", category: ["base", "appliance"], defaults: { widthMm: 600, heightMm: 850 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: true }); helpers.drawers(ctx, { heightsMm: [120] }); } }),
  def({ id: "base-wm-door", nameFa: "کابینت ماشین لباسشویی (درب)", category: ["base", "appliance"], defaults: { widthMm: 600, heightMm: 850 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: true }); helpers.drawers(ctx, { heightsMm: [120] }); helpers.doors(ctx, { count: 1 }); } }),
  def({ id: "base-dw-1door", nameFa: "کابینت ظرفشویی تک‌درب", category: ["base", "appliance"], defaults: { widthMm: 600, heightMm: 820 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: true, withBottom: false }); helpers.doors(ctx, { count: 1 }); } }),
  def({ id: "base-dw-2door", nameFa: "کابینت ظرفشویی دو‌درب", category: ["base", "appliance"], defaults: { widthMm: 600, heightMm: 820 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: true, withBottom: false }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "base-oven-tower", nameFa: "ستون فر", category: ["tall", "appliance"], defaults: { widthMm: 600, heightMm: 2100, depthMm: 580 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true }); helpers.divider(ctx, { atWidthMm: ctx.widthMm * 0.5 }); helpers.doors(ctx, { count: 2 }); helpers.shelves(ctx, { count: 2 }); } }),
  def({ id: "base-glass-heater", nameFa: "یونیت گرم‌کن", category: ["base", "appliance"], defaults: { widthMm: 500 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: true }); helpers.shelves(ctx, { count: 1 }); helpers.doors(ctx, { count: 1 }); } }),

  /* ─── WALL — wall cabinets with doors / glass / open ─── */
  def({ id: "wall-1door", nameFa: "کابینت دیواری تک‌درب", category: ["wall", "door"], defaults: { heightMm: 720, depthMm: 350 }, build: (ctx) => wallUnit(ctx, 1) }),
  def({ id: "wall-2door", nameFa: "کابینت دیواری دو‌درب", category: ["wall", "door"], defaults: { heightMm: 720, depthMm: 350 }, build: (ctx) => wallUnit(ctx, 2) }),
  def({ id: "wall-2door-shelf", nameFa: "کابینت دیواری دو‌درب با طبقه", category: ["wall", "door"], defaults: { heightMm: 720, depthMm: 350 }, build: (ctx) => wallUnit(ctx, 2, 1) }),
  def({ id: "wall-glass-1door", nameFa: "کابینت دیواری شیشه‌ای تک‌درب", category: ["wall", "glass"], defaults: { heightMm: 720, depthMm: 350 }, build: (ctx) => { wallUnit(ctx, 1); helpers.part(ctx, { id: "glass-frame", role: "frame-member", label: "قاب شیشه", lengthMm: 300, widthMm: 500, thicknessMm: 6, quantity: 1, positionMm: [50, 60, 100], orientation: { lengthAxis: "x", widthAxis: "z", thicknessAxis: "y" }, edgeBanding: [], material: ctx.material.front }); } }),
  def({ id: "wall-glass-2door", nameFa: "کابینت دیواری شیشه‌ای دو‌درب", category: ["wall", "glass"], defaults: { heightMm: 720, depthMm: 350 }, build: (ctx) => { wallUnit(ctx, 2); helpers.part(ctx, { id: "glass-frame", role: "frame-member", label: "قاب شیشه", lengthMm: 280, widthMm: 500, thicknessMm: 6, quantity: 2, positionMm: [50, 60, 100], orientation: { lengthAxis: "x", widthAxis: "z", thicknessAxis: "y" }, edgeBanding: [], material: ctx.material.front }); } }),
  def({ id: "wall-lift-up", nameFa: "کابینت دیواری با درب جکی", category: ["wall", "door"], defaults: { heightMm: 800, depthMm: 350 }, build: (ctx) => { helpers.wallCarcass(ctx); helpers.doors(ctx, { count: 1 }); helpers.hardware(ctx, { id: "lift-1", kind: "lift", quantity: 2 }); } }),
  def({ id: "wall-flip-up", nameFa: "کابینت دیواری با درب افقی", category: ["wall", "door"], defaults: { heightMm: 400, depthMm: 350 }, build: (ctx) => { helpers.wallCarcass(ctx); helpers.doors(ctx, { count: 1 }); helpers.hardware(ctx, { id: "lift-1", kind: "lift", quantity: 1 }); helpers.part(ctx, { id: "flip-rail", role: "trim", label: "ریل درب افقی", lengthMm: ctx.interiorWidthMm, widthMm: 30, thicknessMm: 16, quantity: 1, positionMm: [ctx.thickness.carcass, ctx.thickness.carcass, ctx.heightMm - 60], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); } }),
  def({ id: "wall-open", nameFa: "کابینت دیواری باز", category: ["wall", "open"], defaults: { heightMm: 500, depthMm: 350 }, build: (ctx) => wallUnit(ctx, 0, 2) }),
  def({ id: "wall-angled", nameFa: "کابینت دیواری گوشه", category: ["wall", "corner"], defaults: { heightMm: 720, depthMm: 350 }, build: (ctx) => { helpers.wallCarcass(ctx); helpers.doors(ctx, { count: 1 }); helpers.part(ctx, { id: "angle-filler", role: "filler", label: "لبه مورب گوشه", lengthMm: 120, widthMm: ctx.depthMm, thicknessMm: 16, quantity: 1, positionMm: [ctx.widthMm, 0, 0], orientation: { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" }, edgeBanding: [] }); } }),

  /* ─── TALL — tall pantry towers ─── */
  def({ id: "tall-1door", nameFa: "کمد ایستاده تک‌درب", category: ["tall", "pantry"], defaults: { widthMm: 600, heightMm: 2200, depthMm: 600 }, build: (ctx) => tallUnit(ctx, 1, 4) }),
  def({ id: "tall-2door", nameFa: "کمد ایستاده دو‌درب", category: ["tall", "pantry"], defaults: { widthMm: 800, heightMm: 2200, depthMm: 600 }, build: (ctx) => tallUnit(ctx, 2, 5) }),
  def({ id: "tall-2door-drawer", nameFa: "کمد ایستاده دو‌درب با کشو", category: ["tall", "pantry"], defaults: { widthMm: 800, heightMm: 2200, depthMm: 600 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true }); helpers.drawers(ctx, { heightsMm: [160] }); helpers.shelves(ctx, { count: 4 }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "tall-3door", nameFa: "کمد ایستاده سه‌درب", category: ["tall", "pantry"], defaults: { widthMm: 1200, heightMm: 2200, depthMm: 600 }, build: (ctx) => tallUnit(ctx, 3, 6) }),
  def({ id: "tall-broom", nameFa: "کمد جارو", category: ["tall", "utility"], defaults: { widthMm: 400, heightMm: 2200, depthMm: 400 }, build: (ctx) => { tallUnit(ctx, 1, 2); helpers.part(ctx, { id: "broom-clip", role: "frame-member", label: "گیره جارو", lengthMm: 60, widthMm: 60, thicknessMm: 10, quantity: 2, positionMm: [ctx.widthMm / 2 - 30, 30, ctx.heightMm - 500], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); } }),
  def({ id: "tall-towel", nameFa: "کمد حوله", category: ["tall", "utility"], defaults: { widthMm: 400, heightMm: 1800, depthMm: 400 }, build: (ctx) => { tallUnit(ctx, 1, 3); helpers.part(ctx, { id: "towel-bar", role: "trim", label: "میله حوله", lengthMm: ctx.interiorWidthMm - 40, widthMm: 20, thicknessMm: 8, quantity: 1, positionMm: [ctx.thickness.carcass + 20, 50, ctx.heightMm - 200], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); } }),
  def({ id: "tall-fridge-1door", nameFa: "قاب یخچال تک‌درب", category: ["tall", "appliance"], defaults: { widthMm: 900, heightMm: 2200, depthMm: 700 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: true }); helpers.doors(ctx, { count: 1 }); } }),
  def({ id: "tall-fridge-2door", nameFa: "قاب یخچال دو‌درب", category: ["tall", "appliance"], defaults: { widthMm: 900, heightMm: 2200, depthMm: 700 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: true }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "tall-wardrobe", nameFa: "کمد لباس", category: ["tall", "furniture"], defaults: { widthMm: 1000, heightMm: 2400, depthMm: 600 }, build: (ctx) => { tallUnit(ctx, 2, 0); helpers.hardware(ctx, { id: "clothes-rail", kind: "bracket", quantity: 2 }); helpers.part(ctx, { id: "rail", role: "trim", label: "ریل لباس", lengthMm: ctx.interiorWidthMm, widthMm: 25, thicknessMm: 8, quantity: 1, positionMm: [ctx.thickness.carcass, 60, ctx.heightMm - 400], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [], material: "metal-8" }); } }),

  /* ─── CORNER — L-shaped, blind, curved ─── */
  def({ id: "corner-l-shaped", nameFa: "یونیت گوشه L شکل", category: ["corner", "l"], defaults: { widthMm: 900, depthMm: 900 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "corner-diagonal", nameFa: "یونیت گوشه مورب", category: ["corner", "diagonal"], defaults: { widthMm: 900, depthMm: 900 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false }); helpers.doors(ctx, { count: 2 }); helpers.part(ctx, { id: "diag-edge", role: "trim", label: "لبه مورب", lengthMm: 200, widthMm: ctx.depthMm, thicknessMm: 16, quantity: 1, positionMm: [ctx.widthMm - 200, 0, 0], orientation: { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" }, edgeBanding: [] }); } }),
  def({ id: "corner-carousel", nameFa: "یونیت گوشه گردان", category: ["corner", "carousel"], defaults: { widthMm: 900, depthMm: 900 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false }); helpers.doors(ctx, { count: 2 }); helpers.hardware(ctx, { id: "carousel", kind: "bracket", quantity: 1 }); } }),

  /* ─── SPECIAL — hood, shoe, wine, open-shelf, island ─── */
  def({ id: "special-hood", nameFa: "یونیت هود", category: ["special", "hood"], defaults: { widthMm: 600, heightMm: 400, depthMm: 350 }, build: (ctx) => { helpers.wallCarcass(ctx); helpers.doors(ctx, { count: 1 }); helpers.part(ctx, { id: "duct-cutout", role: "trim", label: "قاب کانال هود", lengthMm: 180, widthMm: 180, thicknessMm: 16, quantity: 1, positionMm: [ctx.widthMm / 2 - 90, ctx.depthMm - 100, ctx.heightMm - 16], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); } }),
  def({ id: "special-shoe", nameFa: "کمد کفش", category: ["special", "shoe"], defaults: { widthMm: 800, heightMm: 1100, depthMm: 350 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false }); helpers.shelves(ctx, { count: 4 }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "special-wine", nameFa: "یونیت شراب", category: ["special", "wine"], defaults: { widthMm: 400, heightMm: 900, depthMm: 550 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false }); helpers.shelves(ctx, { count: 5 }); helpers.doors(ctx, { count: 1 }); } }),
  def({ id: "special-open-corner", nameFa: "طبقه‌بندی گوشه باز", category: ["special", "open"], defaults: { widthMm: 600, heightMm: 600, depthMm: 350 }, build: (ctx) => { helpers.wallCarcass(ctx); helpers.shelves(ctx, { count: 2 }); helpers.part(ctx, { id: "corner-post", role: "frame-member", label: "پایه گوشه", lengthMm: 60, widthMm: 60, thicknessMm: 16, quantity: 1, positionMm: [0, 0, 0], orientation: { lengthAxis: "z", widthAxis: "y", thicknessAxis: "x" }, edgeBanding: [] }); } }),
  def({ id: "special-pantry-wide", nameFa: "آبدارخانه عریض", category: ["special", "pantry"], defaults: { widthMm: 1500, heightMm: 2200, depthMm: 600 }, build: (ctx) => tallUnit(ctx, 4, 6) }),
  def({ id: "special-bread", nameFa: "یونیت نان (قفسه)", category: ["special", "baking"], defaults: { widthMm: 800, heightMm: 400, depthMm: 400 }, build: (ctx) => { helpers.wallCarcass(ctx); helpers.shelves(ctx, { count: 1 }); helpers.part(ctx, { id: "bread-guard", role: "trim", label: "لبه نگهدارنده نان", lengthMm: ctx.interiorWidthMm, widthMm: 40, thicknessMm: 12, quantity: 1, positionMm: [ctx.thickness.carcass, 0, ctx.heightMm - 60], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); helpers.part(ctx, { id: "crumb-tray", role: "trim", label: "سینی خرده نان", lengthMm: ctx.interiorWidthMm - 20, widthMm: ctx.interiorDepthMm - 60, thicknessMm: 6, quantity: 1, positionMm: [ctx.thickness.carcass + 10, 30, ctx.thickness.carcass + 8], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [], material: "metal-4" }); } }),
  def({ id: "special-coffee", nameFa: "یونیت قهوه", category: ["special", "baking"], defaults: { widthMm: 600, heightMm: 1100, depthMm: 500 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false }); helpers.drawers(ctx, { heightsMm: [140] }); helpers.shelves(ctx, { count: 1 }); helpers.doors(ctx, { count: 1 }); } }),
  def({ id: "special-cabinet-sink-island", nameFa: "جزیره با سینک", category: ["special", "island"], defaults: { widthMm: 1200, heightMm: 900, depthMm: 800 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withToeKick: false, withBottom: false }); helpers.divider(ctx, { atWidthMm: ctx.widthMm / 2 }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "special-island-drawer", nameFa: "جزیره با کشو", category: ["special", "island"], defaults: { widthMm: 1000, heightMm: 900, depthMm: 800 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withToeKick: false }); helpers.drawers(ctx, { heightsMm: [180, 220] }); } }),
  def({ id: "special-breakfast", nameFa: "یونیت صبحانه", category: ["special", "island"], defaults: { widthMm: 900, heightMm: 1100, depthMm: 600 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withToeKick: false }); helpers.shelves(ctx, { count: 1 }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "special-bar-counter", nameFa: "کافه بار", category: ["special", "bar"], defaults: { widthMm: 1000, heightMm: 1100, depthMm: 500 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withToeKick: false }); helpers.drawers(ctx, { heightsMm: [180] }); helpers.doors(ctx, { count: 1 }); } }),
  def({ id: "special-desk", nameFa: "میز کار داخل آشپزخانه", category: ["special", "workspace"], defaults: { widthMm: 1200, heightMm: 750, depthMm: 600 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false }); helpers.drawers(ctx, { heightsMm: [140, 160] }); } }),
  def({ id: "special-table-island", nameFa: "جزیره پیشخوان", category: ["special", "island"], defaults: { widthMm: 1400, heightMm: 900, depthMm: 800 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withToeKick: false }); helpers.shelves(ctx, { count: 2 }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "special-ironing", nameFa: "کمد اتو", category: ["special", "utility"], defaults: { widthMm: 400, heightMm: 1800, depthMm: 400 }, build: (ctx) => { tallUnit(ctx, 1, 2); helpers.part(ctx, { id: "iron-board", role: "trim", label: "تخته اتو", lengthMm: 320, widthMm: 300, thicknessMm: 15, quantity: 1, positionMm: [40, 50, ctx.heightMm - 400], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); } }),
  def({ id: "special-ladder", nameFa: "کمد پله‌ای", category: ["special", "utility"], defaults: { widthMm: 500, heightMm: 2200, depthMm: 450 }, build: (ctx) => tallUnit(ctx, 1, 5) }),
  def({ id: "special-pet", nameFa: "یونیت پت (غذاخوری)", category: ["special", "utility"], defaults: { widthMm: 500, heightMm: 500, depthMm: 400 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false }); helpers.shelves(ctx, { count: 1 }); helpers.part(ctx, { id: "bowl-cutout-frame", role: "trim", label: "قاب محل کاسه", lengthMm: 300, widthMm: 200, thicknessMm: 12, quantity: 1, positionMm: [ctx.widthMm / 2 - 150, 100, ctx.heightMm - 12], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); helpers.hardware(ctx, { id: "bowl-insert", kind: "bracket", quantity: 2 }); } }),
  def({ id: "special-podium", nameFa: "سکو (پودیوم)", category: ["special", "storage"], defaults: { widthMm: 900, heightMm: 300, depthMm: 600 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false }); helpers.doors(ctx, { count: 2 }); helpers.part(ctx, { id: "podium-feet", role: "trim", label: "پایه بلند سکو", lengthMm: 80, widthMm: 80, thicknessMm: 16, quantity: 4, positionMm: [20, 20, 0], orientation: { lengthAxis: "z", widthAxis: "y", thicknessAxis: "x" }, edgeBanding: [] }); } }),
  def({ id: "special-firewood", nameFa: "محفظه هیزم", category: ["special", "storage"], defaults: { widthMm: 800, heightMm: 900, depthMm: 500 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false }); helpers.shelves(ctx, { count: 2 }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "special-tv", nameFa: "یونیت تلویزیون", category: ["special", "media"], defaults: { widthMm: 1400, heightMm: 400, depthMm: 400 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false }); helpers.shelves(ctx, { count: 1 }); helpers.part(ctx, { id: "cable-grommet", role: "trim", label: "حلقه عبور سیم", lengthMm: 80, widthMm: 80, thicknessMm: 12, quantity: 2, positionMm: [ctx.widthMm / 2 - 40, ctx.depthMm - 80, ctx.heightMm - 12], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); } }),
  def({ id: "special-nightstand", nameFa: "پاتختی", category: ["special", "furniture"], defaults: { widthMm: 450, heightMm: 500, depthMm: 400 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false }); helpers.drawers(ctx, { heightsMm: [160] }); } }),
  def({ id: "special-display", nameFa: "ویترین دکوراتیو", category: ["special", "glass"], defaults: { widthMm: 900, heightMm: 2000, depthMm: 400 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true }); helpers.shelves(ctx, { count: 4 }); helpers.doors(ctx, { count: 2 }); helpers.part(ctx, { id: "glass-shelf-liner", role: "frame-member", label: "لبه شیشه طبقه", lengthMm: ctx.interiorWidthMm, widthMm: 20, thicknessMm: 5, quantity: 4, positionMm: [ctx.thickness.carcass, 0, ctx.heightMm / 2], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [], material: "glass-5" }); helpers.hardware(ctx, { id: "led-strip", kind: "bracket", quantity: 2 }); } }),
  def({ id: "special-narrow-door", nameFa: "یونیت باریک با درب", category: ["special", "narrow"], defaults: { widthMm: 250, heightMm: 2200, depthMm: 550 }, build: (ctx) => { tallUnit(ctx, 1, 3); helpers.part(ctx, { id: "pull-out-frame", role: "frame-member", label: "قاب کشویی باریک", lengthMm: ctx.interiorWidthMm, widthMm: ctx.interiorDepthMm - 30, thicknessMm: 12, quantity: 1, positionMm: [ctx.thickness.carcass, ctx.thickness.carcass, STANDARDS.toeKickMm + 60], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); } }),
  def({ id: "special-narrow-drawer", nameFa: "یونیت باریک با کشو", category: ["special", "narrow"], defaults: { widthMm: 250, heightMm: 1800, depthMm: 550 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true }); helpers.drawers(ctx, { heightsMm: [180, 180, 180] }); } }),

  /* ─── DRAWERS (heavy drawer families) ─── */
  def({ id: "drawer-base-1row", nameFa: "کابینت کشودار تک‌ردیفه", category: ["drawer", "base"], defaults: { drawerCount: 1 }, build: (ctx) => drawerBaseFamily(ctx, [160]) }),
  def({ id: "drawer-base-2row", nameFa: "کابینت کشودار دو‌ردیفه", category: ["drawer", "base"], defaults: { drawerCount: 2 }, build: (ctx) => drawerBaseFamily(ctx, [160, 220]) }),
  def({ id: "drawer-base-3row", nameFa: "کابینت کشودار سه‌ردیفه", category: ["drawer", "base"], defaults: { drawerCount: 3 }, build: (ctx) => drawerBaseFamily(ctx, [140, 180, 260]) }),
  def({ id: "drawer-base-4row", nameFa: "کابینت کشودار چهارردیفه", category: ["drawer", "base"], defaults: { drawerCount: 4 }, build: (ctx) => drawerBaseFamily(ctx, [120, 140, 180, 260]) }),
  def({ id: "drawer-wall-1row", nameFa: "کابینت دیواری کشودار", category: ["drawer", "wall"], defaults: { heightMm: 400, depthMm: 350 }, build: (ctx) => { helpers.wallCarcass(ctx); helpers.drawers(ctx, { heightsMm: [140] }); helpers.part(ctx, { id: "wall-rail-bracket", role: "hardware-mount", label: "بست ریل دیواری", lengthMm: 60, widthMm: 40, thicknessMm: 5, quantity: 2, positionMm: [60, 0, ctx.heightMm - 60], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [], material: "metal-4" }); } }),
  def({ id: "drawer-tall-2row", nameFa: "کمد ایستاده کشودار", category: ["drawer", "tall"], defaults: { heightMm: 2200, depthMm: 600 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true }); helpers.drawers(ctx, { heightsMm: [120, 160, 200, 240] }); } }),

  /* ─── SLIDING / lift doors ─── */
  def({ id: "slide-base-2door", nameFa: "کابینت زمینی درب کشویی", category: ["slide", "base"], build: (ctx) => { baseUnitExterior(ctx, { doors: 2 }); helpers.hardware(ctx, { id: "slide-1", kind: "runner", quantity: 2 }); } }),
  def({ id: "slide-wall-2door", nameFa: "کابینت دیواری درب کشویی", category: ["slide", "wall"], defaults: { heightMm: 720, depthMm: 350 }, build: (ctx) => { wallUnit(ctx, 2); helpers.hardware(ctx, { id: "slide-2", kind: "runner", quantity: 2 }); } }),
  def({ id: "slide-tall-2door", nameFa: "کمد ایستاده درب کشویی", category: ["slide", "tall"], defaults: { heightMm: 2200, depthMm: 600 }, build: (ctx) => { tallUnit(ctx, 2, 4); helpers.hardware(ctx, { id: "slide-3", kind: "runner", quantity: 2 }); } }),

  /* ─── VITRINE / glass display ─── */
  def({ id: "vitrine-base", nameFa: "ویترین زمینی", category: ["vitrine", "base"], defaults: { widthMm: 900, depthMm: 450 }, build: (ctx) => { baseUnitExterior(ctx, { doors: 2, shelves: 2 }); helpers.part(ctx, { id: "spot-light-rail", role: "trim", label: "ریل نور مخفی", lengthMm: ctx.interiorWidthMm, widthMm: 25, thicknessMm: 12, quantity: 1, positionMm: [ctx.thickness.carcass, 30, ctx.heightMm - 40], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); } }),
  def({ id: "vitrine-wall", nameFa: "ویترین دیواری", category: ["vitrine", "wall"], defaults: { widthMm: 900, heightMm: 900, depthMm: 350 }, build: (ctx) => { wallUnit(ctx, 2, 3); } }),
  def({ id: "vitrine-tall", nameFa: "ویترین ایستاده", category: ["vitrine", "tall"], defaults: { widthMm: 800, heightMm: 2200, depthMm: 400 }, build: (ctx) => { tallUnit(ctx, 2, 6); } }),
  def({ id: "vitrine-corner", nameFa: "ویترین گوشه", category: ["vitrine", "corner"], defaults: { widthMm: 900, heightMm: 2000, depthMm: 500 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true }); helpers.doors(ctx, { count: 2 }); helpers.shelves(ctx, { count: 4 }); helpers.part(ctx, { id: "corner-glass-post", role: "frame-member", label: "پایه شیشه گوشه", lengthMm: 60, widthMm: 60, thicknessMm: 16, quantity: 1, positionMm: [ctx.widthMm / 2 - 30, ctx.depthMm / 2 - 30, 0], orientation: { lengthAxis: "z", widthAxis: "y", thicknessAxis: "x" }, edgeBanding: [] }); } }),

  /* ─── SUPERMARKET / rack units ─── */
  def({ id: "sm-rack-single", nameFa: "قفسه سوپرمارکت تک‌رو", category: ["supermarket", "rack"], defaults: { widthMm: 900, heightMm: 1500, depthMm: 400 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false }); helpers.shelves(ctx, { count: 4 }); } }),
  def({ id: "sm-rack-double", nameFa: "قفسه سوپرمارکت دو‌رو", category: ["supermarket", "rack"], defaults: { widthMm: 1000, heightMm: 1800, depthMm: 800 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false, withBottom: false }); helpers.shelves(ctx, { count: 4 }); helpers.part(ctx, { id: "center-spine", role: "divider", label: "ستون مرکزی دورو", lengthMm: ctx.depthMm, widthMm: ctx.heightMm, thicknessMm: ctx.thickness.carcass, quantity: 1, positionMm: [ctx.widthMm / 2 - ctx.thickness.carcass / 2, 0, 0], orientation: { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" }, edgeBanding: ["long-left", "long-right"] }); } }),
  def({ id: "sm-rack-back", nameFa: "قفسه سوپرمارکت پشتی", category: ["supermarket", "rack"], defaults: { widthMm: 900, heightMm: 2200, depthMm: 500 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false }); helpers.shelves(ctx, { count: 6 }); } }),
  def({ id: "sm-gondola", nameFa: "گندولا فروشگاهی", category: ["supermarket", "rack"], defaults: { widthMm: 1200, heightMm: 1000, depthMm: 800 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false }); helpers.shelves(ctx, { count: 3 }); } }),
  def({ id: "sm-endcap", nameFa: "قفسه انتهایی راهرو", category: ["supermarket", "rack"], defaults: { widthMm: 600, heightMm: 1400, depthMm: 400 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true, withToeKick: false }); helpers.shelves(ctx, { count: 5 }); } }),
  def({ id: "sm-bakery", nameFa: "ویترین نانوایی", category: ["supermarket", "display"], defaults: { widthMm: 1200, heightMm: 900, depthMm: 500 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withToeKick: false, withBottom: false }); helpers.doors(ctx, { count: 2 }); helpers.part(ctx, { id: "display-tray-rail", role: "trim", label: "ریل سینی نمایش", lengthMm: ctx.interiorWidthMm, widthMm: 30, thicknessMm: 12, quantity: 2, positionMm: [ctx.thickness.carcass, 60, ctx.heightMm * 0.4], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); } }),
  def({ id: "sm-chilled", nameFa: "یخچال ویترینی", category: ["supermarket", "display"], defaults: { widthMm: 1200, heightMm: 2000, depthMm: 700 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true }); helpers.doors(ctx, { count: 3 }); } }),

  /* ─── COMBINED / custom common ─── */
  def({ id: "combo-sink-drawer", nameFa: "ترکیب سینک و کشو", category: ["combo", "sink"], build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withBottom: false }); helpers.divider(ctx, { atWidthMm: ctx.widthMm * 0.4 }); helpers.drawers(ctx, { heightsMm: [160] }); helpers.doors(ctx, { count: 1 }); } }),
  def({ id: "combo-cooktop-drawer", nameFa: "ترکیب اجاق و کشو", category: ["combo", "cooktop"], build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withBottom: false }); helpers.divider(ctx, { atWidthMm: ctx.widthMm * 0.6 }); helpers.drawers(ctx, { heightsMm: [160] }); helpers.doors(ctx, { count: 1 }); helpers.part(ctx, { id: "cooktop-recess-frame", role: "trim", label: "قاب فرورفتگی اجاق", lengthMm: 560, widthMm: 490, thicknessMm: 12, quantity: 1, positionMm: [20, 20, ctx.heightMm - 12], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); } }),
  def({ id: "combo-corner-sink", nameFa: "ترکیب گوشه و سینک", category: ["combo", "corner"], defaults: { widthMm: 900, depthMm: 900 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withBottom: false }); helpers.doors(ctx, { count: 2 }); helpers.part(ctx, { id: "corner-post", role: "frame-member", label: "ستون گوشه", lengthMm: 80, widthMm: 80, thicknessMm: 16, quantity: 1, positionMm: [ctx.widthMm, 0, 0], orientation: { lengthAxis: "z", widthAxis: "y", thicknessAxis: "x" }, edgeBanding: [] }); } }),
  def({ id: "combo-desk-drawer", nameFa: "ترکیب میز و کشو", category: ["combo", "workspace"], defaults: { widthMm: 1200, heightMm: 750 }, build: (ctx) => { baseUnitExterior(ctx, { withTop: true, withToeKick: false, drawers: [160, 200] }); helpers.divider(ctx, { atWidthMm: ctx.widthMm * 0.65 }); } }),
  def({ id: "combo-tall-drawer", nameFa: "ترکیب کمد و کشو", category: ["combo", "pantry"], defaults: { widthMm: 800, heightMm: 2200 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true }); helpers.divider(ctx, { atWidthMm: ctx.widthMm * 0.35 }); helpers.drawers(ctx, { heightsMm: [160] }); helpers.shelves(ctx, { count: 4 }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "combo-wall-drawer", nameFa: "ترکیب دیواری و کشو", category: ["combo", "wall"], defaults: { heightMm: 600, depthMm: 350 }, build: (ctx) => { helpers.wallCarcass(ctx); helpers.divider(ctx, { atWidthMm: ctx.widthMm * 0.5 }); helpers.drawers(ctx, { heightsMm: [160] }); } }),
  def({ id: "combo-pantry-drawer", nameFa: "آبدارخانه با کشو", category: ["combo", "pantry"], defaults: { widthMm: 1200, heightMm: 2200 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true }); helpers.drawers(ctx, { heightsMm: [160, 200] }); helpers.shelves(ctx, { count: 4 }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "combo-island-sink", nameFa: "جزیره با سینک و کشو", category: ["combo", "island"], defaults: { widthMm: 1600, heightMm: 900, depthMm: 800 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: false, withToeKick: false }); helpers.drawers(ctx, { heightsMm: [160, 220] }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "combo-corner-pantry", nameFa: "گوشه با آبدارخانه", category: ["combo", "corner"], defaults: { widthMm: 1200, heightMm: 2200, depthMm: 600 }, build: (ctx) => { helpers.baseCarcass(ctx, { withTop: true }); helpers.shelves(ctx, { count: 5 }); helpers.doors(ctx, { count: 2 }); } }),
  def({ id: "combo-shoe-wall", nameFa: "کمد کفش دیواری", category: ["combo", "shoe"], defaults: { widthMm: 1000, heightMm: 1000, depthMm: 350 }, build: (ctx) => { wallUnit(ctx, 2, 4); helpers.part(ctx, { id: "shoe-rack-angled", role: "trim", label: "طبقه کفش مورب", lengthMm: ctx.interiorWidthMm, widthMm: 250, thicknessMm: 16, quantity: 2, positionMm: [ctx.thickness.carcass, 50, 250], orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" }, edgeBanding: [] }); } }),
];

/** Stable lookup. */
export const libraryById = new Map(LIBRARY.map((t) => [t.id, t]));

export function getTemplate(id: string): TemplateMeta | undefined {
  return libraryById.get(id);
}
