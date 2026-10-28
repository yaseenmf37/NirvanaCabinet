import test from "node:test";
import assert from "node:assert/strict";
import { rectangleRoom, roomBounds, structuredRoomOutput, validateRoom, wallAngleDegrees, wallLength } from "./planning-geometry.ts";
import type { RoomModel } from "../core/types/index.ts";

const room: RoomModel = {
  id: "room-1",
  projectId: "p-1",
  companyId: "co-1",
  name: "اتاق",
  heightCm: 280,
  vertices: rectangleRoom(400, 300, 280).vertices,
  hiddenWalls: [],
  ceilingHidden: false,
  openings: [{ id: "o-1", kind: "door", wallIndex: 1, offsetCm: 100, widthCm: 120, heightCm: 200, sillHeightCm: 0 }],
  obstacles: [{ id: "b-1", kind: "column", x: 200, y: 120, widthCm: 30, depthCm: 30, heightCm: 280 }],
  sections: [],
  equipment: { refrigerator: "standard", washingMachine: false, dishwasher: false, oven: false, cooktop: false, microwave: false, extractorHood: false, notes: "" },
  version: 1,
  updatedAt: "2026-01-01",
  updatedBy: "u-1",
};

test("wallLength and wallAngleDegrees compute basic geometry", () => {
  assert.equal(wallLength({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.equal(Math.round(wallAngleDegrees({ x: 0, y: 0 }, { x: 1, y: 0 })), 0);
});

test("roomBounds returns room extents", () => {
  assert.deepEqual(roomBounds(room.vertices), { minX: 0, minY: 0, maxX: 400, maxY: 300, width: 400, depth: 300 });
});

test("validateRoom reports invalid room input", () => {
  const invalid = { ...room, vertices: [{ x: 0, y: 0 }], heightCm: 0 };
  assert.ok(validateRoom(invalid).length > 0);
});

test("validateRoom accepts valid room", () => {
  assert.equal(validateRoom(room).length, 0);
});

test("validateRoom rejects non-finite geometry and invalid obstacle dimensions", () => {
  const invalid = { ...room, vertices: [{ x: Number.NaN, y: 0 }, ...room.vertices.slice(1)], obstacles: [{ ...room.obstacles[0], widthCm: 0 }] };
  const issues = validateRoom(invalid);
  assert.equal(issues.some((issue) => issue.includes("مختصات معتبر")), true);
  assert.equal(issues.some((issue) => issue.includes("ابعاد یا موقعیت مانع")), true);
});
test("validateRoom rejects invalid opening wall, out-of-room obstacle, and section vertices", () => {
  const invalid = { ...room, openings: [{ ...room.openings[0], wallIndex: 99, sillHeightCm: Number.NaN }], obstacles: [{ ...room.obstacles[0], x: 390 }], sections: [{ id: "s-1", label: "bad", fromVertex: 0, toVertex: 99 }] };
  const issues = validateRoom(invalid);
  assert.equal(issues.some((issue) => issue.includes("بازشوی")), true);
  assert.equal(issues.some((issue) => issue.includes("مانع")), true);
  assert.equal(issues.some((issue) => issue.includes("بخش‌بندی")), true);
});
test("structuredRoomOutput preserves model and validation", () => {
  const output = structuredRoomOutput(room);
  assert.equal(output.format, "new-nirvana.room.v1");
  assert.equal(output.geometry.openings.length, 1);
  assert.equal(output.validation.length, 0);
});
