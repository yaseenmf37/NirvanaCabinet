/**
 * resolveUnit — pure, deterministic: (template, config) → ResolvedUnit.
 *
 * A template declares `build(ctx)` where ctx gives helpers and the resolved
 * dimensions. The build function returns parts/hardware/warnings. There is no
 * I/O here; everything is derived from spec so the same input always yields
 * the same output (golden tests rely on this).
 */

import type {
  EdgeFace,
  HardwareSpec,
  MachiningSpec,
  MaterialOption,
  MaterialSpec,
  PartSpec,
  ResolvedUnit,
  ResolveWarning,
  TemplateMeta,
  UnitConfig,
} from "./types.ts";
import { STANDARDS } from "./standards.ts";

export interface BuildContext {
  widthMm: number;
  heightMm: number;
  depthMm: number;
  thickness: {
    carcass: number;
    front: number;
    back: number;
    shelf: number;
  };
  material: {
    carcass: string;
    front: string;
    back: string;
    shelf: string;
  };
  config: UnitConfig;
  interiorDepthMm: number;
  interiorWidthMm: number;
  interiorHeightMm: number;
  parts: PartSpec[];
  hardware: HardwareSpec[];
  warnings: ResolveWarning[];
  materials: Map<string, MaterialSpec>;
  helpers: typeof helpers;
}

type PartInit = Omit<PartSpec, "material" | "colorCode" | "confidence" | "quantitySource" | "edgeBanding" | "machining"> & {
  material?: string;
  colorCode?: string;
  edgeBanding?: EdgeFace[];
  machining?: MachiningSpec[];
};

export const helpers = {
  part(ctx: BuildContext, init: PartInit): PartSpec {
    const materialKey = init.material ?? ctx.material.carcass;
    const spec: PartSpec = {
      ...init,
      material: materialKey,
      colorCode: init.colorCode ?? ctx.config.colorCode,
      edgeBanding: init.edgeBanding ?? [],
      machining: init.machining ?? [],
      confidence: "specified",
      quantitySource: init.quantity > 1 ? "spec" : "derived",
    };
    ctx.parts.push(spec);
    return spec;
  },

  hardware(ctx: BuildContext, hw: Omit<HardwareSpec, "notes"> & { notes?: string }) {
    ctx.hardware.push(hw);
  },

  material(ctx: BuildContext, spec: MaterialSpec) {
    ctx.materials.set(spec.key, spec);
  },

  useMaterialSet(ctx: BuildContext, slot: "carcass" | "front" | "back" | "shelf") {
    const key = ctx.material[slot];
    const thickness = ctx.thickness[slot];
    helpers.material(ctx, {
      key,
      label: key,
      kind: key.startsWith("mdf") ? "mdf" : key.startsWith("particle") ? "particle" : key.startsWith("ply") ? "ply" : key.startsWith("hdf") ? "other" : "other",
      thicknessMm: thickness,
    });
  },

  /** Standard base-cabinet carcass: 2 sides, bottom (+top), back, toe-kick. */
  baseCarcass(ctx: BuildContext, opts: { withTop?: boolean; withBottom?: boolean; withToeKick?: boolean } = {}) {
    const { widthMm, heightMm, depthMm, thickness, interiorDepthMm, helpers: h } = ctx;
    const t = thickness.carcass;
    const kickH = opts.withToeKick ? STANDARDS.toeKickMm : 0;
    const sides = heightMm - kickH;

    h.part(ctx, {
      id: "side-left",
      role: "carcass-side",
      label: "پهلوی چپ بدنه",
      lengthMm: depthMm,
      widthMm: sides,
      thicknessMm: t,
      quantity: 1,
      positionMm: [0, 0, kickH],
      orientation: { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" },
      edgeBanding: ["long-left"],
    });
    h.part(ctx, {
      id: "side-right",
      role: "carcass-side",
      label: "پهلوی راست بدنه",
      lengthMm: depthMm,
      widthMm: sides,
      thicknessMm: t,
      quantity: 1,
      positionMm: [widthMm - t, 0, kickH],
      orientation: { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" },
      edgeBanding: ["long-right"],
    });

    if (opts.withBottom !== false) {
      h.part(ctx, {
        id: "bottom",
        role: "carcass-bottom",
        label: "کف بدنه",
        lengthMm: ctx.interiorWidthMm,
        widthMm: interiorDepthMm,
        thicknessMm: t,
        quantity: 1,
        positionMm: [t, t, kickH],
        orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" },
        edgeBanding: [],
      });
    }
    if (opts.withTop) {
      h.part(ctx, {
        id: "top",
        role: "carcass-top",
        label: "سقف بدنه",
        lengthMm: ctx.interiorWidthMm,
        widthMm: interiorDepthMm,
        thicknessMm: t,
        quantity: 1,
        positionMm: [t, t, heightMm - t],
        orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" },
        edgeBanding: [],
      });
    }
    h.part(ctx, {
      id: "back",
      role: "carcass-back",
      label: "پشت‌بند",
      lengthMm: widthMm,
      widthMm: sides,
      thicknessMm: thickness.back,
      quantity: 1,
      positionMm: [0, depthMm - thickness.back, kickH],
      orientation: { lengthAxis: "x", widthAxis: "z", thicknessAxis: "y" },
      edgeBanding: [],
      material: ctx.material.back,
    });

    if (opts.withToeKick) {
      h.part(ctx, {
        id: "toe-kick",
        role: "toe-kick",
        label: "پایه",
        lengthMm: widthMm - 2 * t,
        widthMm: kickH,
        thicknessMm: t,
        quantity: 1,
        positionMm: [t, 60, 0],
        orientation: { lengthAxis: "x", widthAxis: "z", thicknessAxis: "y" },
        edgeBanding: [],
      });
    }
  },

  /** Wall-cabinet carcass: sides + top + bottom + back, no toe kick. */
  wallCarcass(ctx: BuildContext) {
    helpers.baseCarcass(ctx, { withTop: true, withBottom: true, withToeKick: false });
  },

  /** N adjustable shelves evenly distributed (uses config.shelfCount by default). */
  shelves(ctx: BuildContext, opts: { count?: number; positionsMm?: number[]; startZ?: number; endZ?: number } = {}) {
    const { thickness, interiorDepthMm, helpers: h } = ctx;
    const t = thickness.shelf;
    const count = opts.count ?? (typeof ctx.config.shelfCount === "number" ? ctx.config.shelfCount : 0);
    if (count <= 0) return;
    const startZ = opts.startZ ?? thickness.carcass;
    const endZ = opts.endZ ?? ctx.heightMm - thickness.carcass;
    const usable = endZ - startZ;
    const positions =
      opts.positionsMm && opts.positionsMm.length > 0
        ? opts.positionsMm
        : Array.from({ length: count }, (_, i) => startZ + (usable * (i + 1)) / (count + 1));
    positions.forEach((z, i) => {
      h.part(ctx, {
        id: `shelf-${i + 1}`,
        role: "shelf",
        label: `طبقهٔ ${i + 1}`,
        lengthMm: ctx.interiorWidthMm,
        widthMm: interiorDepthMm - 10,
        thicknessMm: t,
        quantity: 1,
        positionMm: [thickness.carcass, thickness.carcass, Math.max(0, Math.min(z, ctx.heightMm - t))],
        orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" },
        edgeBanding: ["long-left", "long-right"],
        material: ctx.material.shelf,
      });
    });
  },

  /** Doors with hinge counts (count from opts or config.doorCount). */
  doors(ctx: BuildContext, opts: { count?: number; opening?: string } = {}) {
    const { widthMm, heightMm, thickness, helpers: h } = ctx;
    const count = opts.count ?? (typeof ctx.config.doorCount === "number" ? ctx.config.doorCount : 0);
    if (count <= 0) return;
    const t = thickness.front;
    const reveal = STANDARDS.doorRevealMm;
    const doorH = heightMm - 2 * reveal;
    const doorW = (widthMm - (count + 1) * reveal) / count;
    const hinges = STANDARDS.hingeCountForDoorHeightMm(doorH);
    for (let i = 0; i < count; i++) {
      // Hinge side per door: first door opens left-hinged when the config asks
      // for hinge-left; otherwise last door is left-hinged and the rest mirror.
      // This is a display/assembly hint — geometry is identical either way.
      const hingeSide =
        ctx.config.doorOpening === "hinge-left"
          ? i === 0
            ? "left"
            : "right"
          : i === count - 1
            ? "left"
            : "right";
      h.part(ctx, {
        id: `door-${i + 1}`,
        role: "door-front",
        label: `درب ${i + 1} (لولا ${hingeSide === "left" ? "چپ" : "راست"})`,
        lengthMm: Math.max(doorW, 50),
        widthMm: doorH,
        thicknessMm: t,
        quantity: 1,
        positionMm: [reveal + i * (doorW + reveal), reveal, reveal],
        orientation: { lengthAxis: "x", widthAxis: "z", thicknessAxis: "y" },
        edgeBanding: ["long-left", "long-right", "short-top", "short-bottom"],
        material: ctx.material.front,
        machining: [
          {
            id: `hinge-cups-${i + 1}`,
            op: "hinge-cup",
            datum: hingeSide === "left" ? "part-left-edge" : "part-right-edge",
            offsetMm: STANDARDS.hingeCupEdgeOffsetMm,
            diameterMm: 35,
            depthMm: 12,
            through: false,
            quantity: hinges,
            source: "spec",
          },
        ],
      });
      h.hardware(ctx, {
        id: `hinge-set-${i + 1}`,
        kind: "hinge",
        model: ctx.config.hingeModel,
        quantity: hinges,
        positionMm: [reveal + i * (doorW + reveal), 0, STANDARDS.hingeCupEdgeOffsetMm],
        notes: `hinge side: ${hingeSide}`,
      });
    }
  },

  /** A bank of drawers: fronts + boxes + runners + handles.
   *  heightsMm explicit wins; else derives from config.drawerCount / drawerHeightsMm. */
  drawers(ctx: BuildContext, opts: { heightsMm?: number[]; frontMaterial?: string } = {}) {
    const { widthMm, depthMm, thickness, helpers: h, interiorWidthMm } = ctx;
    let heightsMm = opts.heightsMm;
    if (!heightsMm || heightsMm.length === 0) {
      const n = typeof ctx.config.drawerCount === "number" ? ctx.config.drawerCount : 0;
      if (n <= 0) return;
      if (Array.isArray(ctx.config.drawerHeightsMm) && ctx.config.drawerHeightsMm.length === n) {
        heightsMm = ctx.config.drawerHeightsMm as number[];
      } else {
        // Even split of the usable front height.
        const usable = ctx.heightMm - 2 * STANDARDS.doorRevealMm;
        heightsMm = Array.from({ length: n }, () => Math.floor(usable / n));
      }
    }
    const t = thickness.front;
    const boxT = STANDARDS.drawerSideMm;
    const reveal = STANDARDS.doorRevealMm;
    let z = ctx.heightMm;
    heightsMm.forEach((fh, i) => {
      z -= fh;
      h.part(ctx, {
        id: `drawer-front-${i + 1}`,
        role: "drawer-front",
        label: `جلوکشوی ${i + 1}`,
        lengthMm: widthMm - 2 * reveal,
        widthMm: fh - 2 * reveal,
        thicknessMm: t,
        quantity: 1,
        positionMm: [reveal, reveal, z + reveal],
        orientation: { lengthAxis: "x", widthAxis: "z", thicknessAxis: "y" },
        edgeBanding: ["long-left", "long-right", "short-top", "short-bottom"],
        material: opts.frontMaterial ?? ctx.material.front,
      });
      const boxH = Math.max(60, Math.min(fh - 40, 120));
      const boxW = interiorWidthMm - 2 * boxT - 26;
      const boxD = depthMm - thickness.back - 40;
      h.part(ctx, {
        id: `drawer-side-l-${i + 1}`,
        role: "drawer-side",
        label: `ضلع چپ جعبهٔ کشو ${i + 1}`,
        lengthMm: boxD,
        widthMm: boxH,
        thicknessMm: boxT,
        quantity: 1,
        positionMm: [thickness.carcass + 13, thickness.carcass + 13, z + 20],
        orientation: { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" },
        edgeBanding: [],
      });
      h.part(ctx, {
        id: `drawer-side-r-${i + 1}`,
        role: "drawer-side",
        label: `ضلع راست جعبهٔ کشو ${i + 1}`,
        lengthMm: boxD,
        widthMm: boxH,
        thicknessMm: boxT,
        quantity: 1,
        positionMm: [widthMm - thickness.carcass - 13 - boxT, thickness.carcass + 13, z + 20],
        orientation: { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" },
        edgeBanding: [],
      });
      h.part(ctx, {
        id: `drawer-back-${i + 1}`,
        role: "drawer-back",
        label: `پشت جعبهٔ کشو ${i + 1}`,
        lengthMm: boxW,
        widthMm: boxH,
        thicknessMm: boxT,
        quantity: 1,
        positionMm: [thickness.carcass + 13 + boxT, depthMm - thickness.back - 20 - boxT, z + 20],
        orientation: { lengthAxis: "x", widthAxis: "z", thicknessAxis: "y" },
        edgeBanding: [],
      });
      h.part(ctx, {
        id: `drawer-bottom-${i + 1}`,
        role: "drawer-bottom",
        label: `کف جعبهٔ کشو ${i + 1}`,
        lengthMm: boxW + 2 * boxT,
        widthMm: boxD + boxT,
        thicknessMm: 8,
        quantity: 1,
        positionMm: [thickness.carcass + 13, thickness.carcass + 13, z + 20],
        orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" },
        edgeBanding: [],
      });
      h.hardware(ctx, { id: `runner-${i + 1}`, kind: "runner", model: ctx.config.runnerModel, quantity: 2, positionMm: [thickness.carcass, thickness.carcass, z + 30] });
      h.hardware(ctx, { id: `handle-${i + 1}`, kind: "handle", model: ctx.config.handleModel, quantity: 1, positionMm: [widthMm / 2, 0, z + fh / 2] });
    });
  },

  /** Countertop slab overhanging 20mm at the front. */
  /** Vertical divider splitting the carcass interior (combo units). */
  divider(ctx: BuildContext, opts: { atWidthMm?: number } = {}) {
    const at = opts.atWidthMm ?? ctx.widthMm / 2;
    helpers.part(ctx, {
      id: "divider",
      role: "divider",
      label: "پارتیشن میانی",
      lengthMm: ctx.depthMm,
      widthMm: ctx.heightMm - STANDARDS.toeKickMm,
      thicknessMm: ctx.thickness.carcass,
      quantity: 1,
      positionMm: [Math.max(at, ctx.thickness.carcass), 0, STANDARDS.toeKickMm],
      orientation: { lengthAxis: "y", widthAxis: "z", thicknessAxis: "x" },
      edgeBanding: ["long-left", "long-right"],
    });
  },

  countertop(ctx: BuildContext, opts: { overhangMm?: number } = {}) {
    const overhang = opts.overhangMm ?? 20;
    helpers.part(ctx, {
      id: "countertop",
      role: "countertop",
      label: "صفحهٔ رویه",
      lengthMm: ctx.widthMm,
      widthMm: ctx.depthMm + overhang,
      thicknessMm: STANDARDS.countertopMm,
      quantity: 1,
      positionMm: [0, -overhang, ctx.heightMm],
      orientation: { lengthAxis: "x", widthAxis: "y", thicknessAxis: "z" },
      edgeBanding: ["long-left"],
      material: ctx.material.front,
    });
  },
};

/** Merge defaults with overrides. */
export function effectiveConfig(template: TemplateMeta, config: UnitConfig): UnitConfig {
  return { ...template.defaults, ...config, templateId: template.id, templateSchemaVersion: template.schemaVersion };
}

function pickMaterial(options: MaterialOption[] | undefined, key: string | undefined, fallback: string): string {
  if (!options || options.length === 0) return fallback;
  if (key && options.some((o) => o.key === key)) return key;
  return options[0].key;
}

function pickThickness(options: MaterialOption[] | undefined, key: string | undefined, fallback: number): number {
  if (!options || options.length === 0) return fallback;
  const chosen = options.find((o) => o.key === key) ?? options[0];
  return chosen.thicknessMm;
}

export function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.round(v)));
}

/** Resolve a unit template with a config into full part/machining geometry. */
export function resolveUnit(template: TemplateMeta, config: UnitConfig = {}): ResolvedUnit {
  const cfg = effectiveConfig(template, config);

  const widthMm = clamp(cfg.widthMm ?? 600, 150, 3000);
  const heightMm = clamp(cfg.heightMm ?? 720, 100, 2800);
  const depthMm = clamp(cfg.depthMm ?? 560, 100, 1200);

  const material = {
    carcass: pickMaterial(template.materials.carcass, cfg.materialCarcass, "mdf-16"),
    front: pickMaterial(template.materials.front, cfg.materialFront, "mdf-18"),
    back: pickMaterial(template.materials.back, cfg.materialBack, "hdf-3"),
    shelf: pickMaterial(template.materials.shelf, cfg.materialShelf, "mdf-16"),
  };
  const thickness = {
    carcass: pickThickness(template.materials.carcass, material.carcass, 16),
    front: pickThickness(template.materials.front, material.front, 18),
    back: pickThickness(template.materials.back, material.back, STANDARDS.backThicknessMm),
    shelf: pickThickness(template.materials.shelf, material.shelf, STANDARDS.shelfThicknessMm),
  };

  const ctx: BuildContext = {
    widthMm,
    heightMm,
    depthMm,
    thickness,
    material,
    config: cfg,
    interiorDepthMm: depthMm - thickness.back,
    interiorWidthMm: widthMm - 2 * thickness.carcass,
    interiorHeightMm: heightMm - 2 * thickness.carcass,
    parts: [],
    hardware: [],
    warnings: [],
    materials: new Map(),
    helpers,
  };

  template.build(ctx);

  (Object.keys(material) as Array<keyof typeof material>).forEach((slot) => {
    helpers.useMaterialSet(ctx, slot);
  });

  return {
    id: template.id,
    templateId: template.id,
    templateSchemaVersion: template.schemaVersion,
    displayName: template.nameFa,
    category: template.category,
    envelopeMm: { widthMm, heightMm, depthMm },
    config: cfg,
    parts: ctx.parts,
    materials: [...ctx.materials.values()],
    hardware: ctx.hardware,
    warnings: ctx.warnings,
  };
}
