import type { Point2D, RoomModel, RoomWallProfile } from "@/src/core/types";

export function wallLength(a: Point2D, b: Point2D) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function roomBounds(vertices: Point2D[]) {
  const xs = vertices.map((p) => p.x);
  const ys = vertices.map((p) => p.y);
  return {
    minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs), depth: Math.max(...ys) - Math.min(...ys),
  };
}

export function wallAngleDegrees(a: Point2D, b: Point2D) {
  return ((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 360) % 360;
}

export function normalizeOpeningKind(kind: unknown): RoomModel["openings"][number]["kind"] | null {
  if (kind === "door" || kind === "window") return kind;
  if (kind === "arch") return "door";
  if (kind === "other") return "window";
  return null;
}

export function wallTopEdgePoints(start: Point2D, end: Point2D, heightCm: number, profile?: RoomWallProfile) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(Math.hypot(dx, dy), 1);
  const nx = -dy / length;
  const ny = dx / length;
  const tx = dx / length;
  const ty = dy / length;
  const startLean = profile?.startLeanCm ?? 0;
  const endLean = profile?.endLeanCm ?? 0;
  const startShift = profile?.startShiftCm ?? 0;
  const endShift = profile?.endShiftCm ?? 0;
  return {
    start: { x: start.x + nx * startLean + tx * startShift, y: start.y + ny * startLean + ty * startShift, z: profile?.startHeightCm ?? heightCm },
    end: { x: end.x + nx * endLean + tx * endShift, y: end.y + ny * endLean + ty * endShift, z: profile?.endHeightCm ?? heightCm },
  };
}

export function validateRoom(room: RoomModel) {
  const issues: string[] = [];
  if (room.vertices.length < 3) issues.push("برای ساخت فضا حداقل سه رأس لازم است.");
  if (!Number.isFinite(room.heightCm) || room.heightCm <= 0) issues.push("ارتفاع اتاق باید بزرگ‌تر از صفر باشد.");
  room.vertices.forEach((vertex, index) => { if (!Number.isFinite(vertex.x) || !Number.isFinite(vertex.y)) issues.push(`رأس ${index + 1} مختصات معتبر ندارد.`); });
  if (room.notes !== undefined && room.notes.length > 5000) issues.push("یادداشت اتاق نمی‌تواند بیشتر از ۵۰۰۰ نویسه باشد.");
  const wallProfiles = room.wallProfiles ?? [];
  const profileIndexes = new Set<number>();
  wallProfiles.forEach((profile, index) => {
    const values = [profile.startHeightCm, profile.endHeightCm, profile.startLeanCm, profile.endLeanCm, profile.startShiftCm, profile.endShiftCm].filter((value) => value !== undefined);
    if (!Number.isInteger(profile.wallIndex) || profile.wallIndex < 0 || profile.wallIndex >= room.vertices.length || profileIndexes.has(profile.wallIndex) || values.some((value) => !Number.isFinite(value)) || [profile.startHeightCm, profile.endHeightCm].some((value) => value !== undefined && value <= 0)) issues.push(`پروفایل شیب دیوار ${index + 1} معتبر نیست.`);
    profileIndexes.add(profile.wallIndex);
  });
  room.openings.forEach((opening, index) => {
    const kind = normalizeOpeningKind((opening as { kind?: unknown }).kind);
    if (!kind || !Number.isInteger(opening.wallIndex) || opening.wallIndex < 0 || opening.wallIndex >= room.vertices.length || !Number.isFinite(opening.offsetCm) || opening.offsetCm < 0 || !Number.isFinite(opening.widthCm) || opening.widthCm <= 0 || !Number.isFinite(opening.heightCm) || opening.heightCm <= 0 || !Number.isFinite(opening.sillHeightCm) || opening.sillHeightCm < 0) { issues.push(`ابعاد یا دیوار بازشوی ${index + 1} معتبر نیست.`); return; }
    const a = room.vertices[opening.wallIndex]; const b = room.vertices[(opening.wallIndex + 1) % room.vertices.length];
    if (!a || !b) { issues.push(`بازشوی ${index + 1} به دیوار نامعتبر وصل شده است.`); return; }
    const length = wallLength(a, b);
    if (opening.offsetCm + opening.widthCm > length) issues.push(`بازشوی ${kind} از طول دیوار ${opening.wallIndex + 1} بیشتر است.`);
    const overlapping = room.openings.some((other, otherIndex) => otherIndex !== index && other.wallIndex === opening.wallIndex && opening.offsetCm < other.offsetCm + other.widthCm && other.offsetCm < opening.offsetCm + opening.widthCm);
    if (overlapping) issues.push(`بازشوی ${index + 1} با بازشوی دیگری هم‌پوشانی دارد.`);
    const profile = wallProfiles.find((item) => item.wallIndex === opening.wallIndex);
    const ratio = length > 0 ? (opening.offsetCm + opening.widthCm / 2) / length : 0;
    const localHeight = profile ? (profile.startHeightCm ?? room.heightCm) + ((profile.endHeightCm ?? room.heightCm) - (profile.startHeightCm ?? room.heightCm)) * ratio : room.heightCm;
    if (opening.sillHeightCm + opening.heightCm > localHeight) issues.push(`ارتفاع بازشوی ${kind} از ارتفاع اتاق بیشتر است.`);
  });
  room.obstacles.forEach((obstacle, index) => {
    const validNumbers = [obstacle.x, obstacle.y, obstacle.widthCm, obstacle.depthCm, obstacle.heightCm].every(Number.isFinite);
    const positiveDimensions = obstacle.widthCm > 0 && obstacle.depthCm > 0 && obstacle.heightCm > 0;
    const bounds = room.vertices.length > 0 ? roomBounds(room.vertices) : null;
    const insideRoom = bounds !== null && obstacle.x >= bounds.minX && obstacle.y >= bounds.minY && obstacle.x + obstacle.widthCm <= bounds.maxX && obstacle.y + obstacle.depthCm <= bounds.maxY;
    if (!validNumbers || !positiveDimensions || !insideRoom) issues.push(`ابعاد یا موقعیت مانع ${index + 1} معتبر نیست.`);
  });
  room.sections.forEach((section, index) => { if (!Number.isInteger(section.fromVertex) || !Number.isInteger(section.toVertex) || section.fromVertex < 0 || section.toVertex < 0 || section.fromVertex >= room.vertices.length || section.toVertex >= room.vertices.length || section.fromVertex === section.toVertex) issues.push(`بخش‌بندی ${index + 1} به رأس‌های معتبر متصل نیست.`); });
  return issues;
}

export function structuredRoomOutput(room: RoomModel) {
  const walls = room.vertices.map((start, index) => { const end = room.vertices[(index + 1) % room.vertices.length]; return { index, start, end, lengthCm: Number(wallLength(start, end).toFixed(2)), angleDegrees: Number(wallAngleDegrees(start, end).toFixed(2)), hidden: room.hiddenWalls.includes(index), topEdge: wallTopEdgePoints(start, end, room.heightCm, (room.wallProfiles ?? []).find((profile) => profile.wallIndex === index)) }; });
  return { format: "new-nirvana.room.v1", roomId: room.id, projectId: room.projectId, name: room.name, version: room.version, updatedAt: room.updatedAt, visual: { heightCm: room.heightCm, ceilingHidden: room.ceilingHidden, notes: room.notes ?? "", wallProfiles: room.wallProfiles ?? [] }, geometry: { vertices: room.vertices, walls, openings: room.openings.map((opening) => ({ ...opening, kind: normalizeOpeningKind((opening as { kind?: unknown }).kind) ?? "window" })), obstacles: room.obstacles, sections: room.sections }, equipment: room.equipment, validation: validateRoom(room) };
}

export function rectangleRoom(lengthCm: number, widthCm: number, heightCm: number): Pick<RoomModel, "vertices" | "heightCm"> { return { heightCm, vertices: [{ x: 0, y: 0 }, { x: lengthCm, y: 0 }, { x: lengthCm, y: widthCm }, { x: 0, y: widthCm }] }; }
