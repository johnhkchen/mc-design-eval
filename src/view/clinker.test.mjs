// surface.clinker unit tests (T-132-01) — the promoted saltcrag draft's test plan: horizontal
// courses, alternating proud/flush lap, zone containment, gable-rake containment, trim caps,
// idempotency + report.

import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { clinkerCourses } from "./clinker.mjs";

/** A two-storey wall stub: rubble ground course (y 0..1) + a 4-high upper panel (y 2..5) with a
 *  raked gable on top (the panel narrows as y rises above 5). One cell thick along z. */
function wallStub() {
  const cells = [];
  for (let x = 0; x <= 6; x++) {
    for (let y = 0; y <= 1; y++) cells.push({ pos: [x, y, 0], block: "cobblestone" });
    for (let y = 2; y <= 5; y++) cells.push({ pos: [x, y, 0], block: "white_terracotta" });
  }
  // rake: y6 spans x2..4, y7 the single apex x3
  for (let x = 2; x <= 4; x++) cells.push({ pos: [x, 6, 0], block: "white_terracotta" });
  cells.push({ pos: [3, 7, 0], block: "white_terracotta" });
  return cells;
}

const upperZone = (pos) => (pos[1] >= 2 ? "upper" : "ground");
const OPTS = Object.freeze({
  board: "dark_oak_planks", lap: 1, course: 1, trimBlock: null,
  zoneOf: upperZone, zone: "upper", faces: ["-z"],
});

test("CL1 every course is horizontal and exactly `course` tall (course index by y)", () => {
  const occ = occupancyFromCells(wallStub());
  const { placements } = clinkerCourses(occ, OPTS);
  // a placement's course parity is a pure function of its y — rows never mix
  for (const p of placements) {
    const y = p.pos[1];
    const proud = p.pos[2] === -1; // emitted in front of the -z face
    assert.equal((y - 2) % 2 === 1, proud, `y=${y} parity matches proud/flush`);
  }
});

test("CL2 adjacent courses alternate proud/flush by `lap`", () => {
  const occ = occupancyFromCells(wallStub());
  const { placements, report } = clinkerCourses(occ, OPTS);
  const proudYs = new Set(placements.filter((p) => p.pos[2] === -1).map((p) => p.pos[1]));
  const flushYs = new Set(placements.filter((p) => p.pos[2] === 0).map((p) => p.pos[1]));
  assert.deepEqual([...proudYs].sort(), [3, 5, 7], "odd course indices sit proud");
  assert.deepEqual([...flushYs].sort(), [2, 4, 6], "even course indices repaint flush");
  assert.ok(report.proudCells > 0 && report.flushCells > 0);
});

test("CL3 placements stay within the zone — rubble ground cells untouched", () => {
  const occ = occupancyFromCells(wallStub());
  const { placements } = clinkerCourses(occ, OPTS);
  assert.ok(placements.every((p) => p.pos[1] >= 2), "no placement below the upper zone");
});

test("CL4 the rake is honored — no board outside the wall's in-plane silhouette", () => {
  const occ = occupancyFromCells(wallStub());
  const { placements } = clinkerCourses(occ, OPTS);
  const wallPlane = new Set(wallStub().map((c) => `${c.pos[0]},${c.pos[1]}`));
  for (const p of placements) {
    assert.ok(wallPlane.has(`${p.pos[0]},${p.pos[1]}`), `board at x${p.pos[0]},y${p.pos[1]} stays inside the rake`);
  }
});

test("CL5 trimBlock caps the top and bottom course; null leaves raw board", () => {
  const occ = occupancyFromCells(wallStub());
  const trimmed = clinkerCourses(occ, { ...OPTS, trimBlock: "spruce_planks" });
  const atBottom = trimmed.placements.filter((p) => p.pos[1] === 2);
  const atTop = trimmed.placements.filter((p) => p.pos[1] === 7);
  assert.ok(atBottom.length && atBottom.every((p) => p.block === "minecraft:spruce_planks"));
  assert.ok(atTop.length && atTop.every((p) => p.block === "minecraft:spruce_planks"));
  const raw = clinkerCourses(occ, OPTS);
  assert.ok(raw.placements.every((p) => p.block === "minecraft:dark_oak_planks"));
});

test("CL6 idempotent: a second run on the brush's own output emits zero placements; report counts", () => {
  const base = wallStub();
  const occ = occupancyFromCells(base);
  const first = clinkerCourses(occ, OPTS);
  assert.equal(first.report.courses, 6, "course count covers the panel + rake (y2..7)");
  assert.equal(first.report.shadowLines, Math.floor(first.report.courses / 2));
  const after = occupancyFromCells([
    ...base.map((c) => {
      const hit = first.placements.find((p) => p.pos.join() === c.pos.join());
      return hit ? { ...c, block: hit.block.replace("minecraft:", "") } : c;
    }),
    ...first.placements.filter((p) => !base.some((c) => c.pos.join() === p.pos.join()))
      .map((p) => ({ pos: p.pos, block: p.block.replace("minecraft:", "") })),
  ]);
  const second = clinkerCourses(after, OPTS);
  assert.equal(second.placements.length, 0, "re-run is a no-op");
});

test("CL7 fail-loud opts gates", () => {
  const occ = occupancyFromCells(wallStub());
  assert.throws(() => clinkerCourses(occ, { ...OPTS, board: "" }), /board/);
  assert.throws(() => clinkerCourses(occ, { ...OPTS, lap: 2 }), /lap/);
  assert.throws(() => clinkerCourses(occ, { ...OPTS, course: 0 }), /course/);
  assert.throws(() => clinkerCourses(occ, { ...OPTS, zoneOf: null }), /zoneOf/);
  assert.throws(() => clinkerCourses(occ, { ...OPTS, faces: ["+y"] }), /unknown face/);
});
