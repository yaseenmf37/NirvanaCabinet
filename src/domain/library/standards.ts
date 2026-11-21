/**
 * Industry-standard cabinet dimensions and shared calc constants.
 * All values in mm unless noted. Sources: common Iranian/European practice
 * (60cm-wide base modules, 72cm + 4cm legs is typical Iranian kitchen stock,
 * wall cabinets 70–75cm tall, toe-kick 10cm, countertop ~4cm).
 */

export const STANDARDS = {
  /** Standard toe-kick (پایه) height. */
  toeKickMm: 100,
  /** Countertop thickness default. */
  countertopMm: 40,
  /** Standard carcass thickness options. */
  carcassThicknessMm: [16, 18] as const,
  /** Back panel default thickness. */
  backThicknessMm: 3,
  /** Standard shelf thickness. */
  shelfThicknessMm: 16,
  /** Typical hinge count by door height. */
  hingeCountForDoorHeightMm(heightMm: number): number {
    if (heightMm <= 900) return 2;
    if (heightMm <= 1600) return 3;
    return 4;
  },
  /** Hinge cup drilling: distance from door top/bottom edge to cup center. */
  hingeCupEdgeOffsetMm: 21,
  /** Gap between door and carcass (reveal). */
  doorRevealMm: 3,
  /** Drawer side thickness (metal box side) default. */
  drawerSideMm: 13,
  /** Standard runner lengths (mm) matching cabinet depths. */
  runnerLengthsMm: [250, 300, 350, 400, 450, 500, 550] as const,
  /** Common carcass depths. */
  carcassDepthsMm: [300, 350, 400, 450, 500, 550, 600] as const,
} as const;
