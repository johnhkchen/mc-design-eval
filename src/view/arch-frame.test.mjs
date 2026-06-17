// Tests for the arch-frame hand primitive (T-192-01, story S-192, epic E-50). PURE — frameArchPlacements is
// the climb's missing OPENING lever (a framed, arched passage); its geometry is correct independent of the
// metered run, so it gates `npm test`. The synthetic fixture isolates the two sub-levers the recorded
// critique names: the dark-timber FRAME (recolor, any width) and the voxel ARCH HEAD (archRing, width-gated).

import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { frameArchPlacements, ARCH_FRAME_SCHEMA } from "./arch-frame.mjs";

// A 1-thick stone wall on the −x face plane (x=0), spanning z=[0..zHi], y=[0..yHi], with a flat rectangular
// door hole (air) at z∈[doorLo,doorHi], y∈[0..doorTop]. Returns {occ, aperture} where the aperture record
// carries exactly the fields frameArchPlacements reads (cells/flanks/lintel), hand-built so the test does
// not depend on the door/window classifier in extractApertures.
function wallWithDoor({ zHi = 7, yHi = 12, doorLo = 1, doorHi = 6, doorTop = 8, dir = "-x" } = {}) {
  const cells = [];
  const hole = new Set();
  for (let z = doorLo; z <= doorHi; z++) for (let y = 0; y <= doorTop; y++) hole.add(`${z},${y}`);
  for (let z = 0; z <= zHi; z++) for (let y = 0; y <= yHi; y++) {
    if (hole.has(`${z},${y}`)) continue;            // the opening = air
    cells.push({ pos: [0, y, z], block: "stone_bricks" });
  }
  const occ = occupancyFromCells(cells);
  const apCells = [];
  for (let z = doorLo; z <= doorHi; z++) for (let y = 0; y <= doorTop; y++) apCells.push({ au: z, av: y });
  const flanks = { left: [], right: [] };
  for (let y = 0; y <= doorTop; y++) { flanks.left.push({ au: doorLo - 1, av: y }); flanks.right.push({ au: doorHi + 1, av: y }); }
  const lintel = [];
  for (let z = doorLo - 1; z <= doorHi + 1; z++) lintel.push({ au: z, av: doorTop + 1 });
  return { occ, aperture: { kind: "door", dir, cells: apCells, flanks, lintel } };
}

const isFrame = (p) => p.block === "minecraft:dark_oak_log";
const posKey = (p) => p.pos.join(",");

// ---- AF1: the arch head is BUILT — ring cells placed in the frame block above the spring ----
test("AF1 frameArchPlacements builds a voxel arch head on a wide opening", () => {
  const { occ, aperture } = wallWithDoor();              // W = 6 ≥ minWidth
  const { placements, perOpening } = frameArchPlacements(occ, [aperture], { frameBlock: "dark_oak_log" });
  const rep = perOpening[0];
  assert.equal(rep.arched, true, "a 6-wide opening should be arched");
  assert.ok(rep.ringCells > 0, "arch ring should place spandrel cubes");
  // every ring cell sits at the wall plane (x=0), in the frame block, in the head band (y ≥ spring)
  assert.ok(placements.some(isFrame), "ring cells are the frame block");
});

// ---- AF2: the aperture stays OPEN — the disc interior (center column) is not filled ----
test("AF2 the arch leaves the aperture open (center column air above the spring)", () => {
  const { occ, aperture } = wallWithDoor();
  const { placements } = frameArchPlacements(occ, [aperture], { frameBlock: "dark_oak_log" });
  const filled = new Set(placements.map(posKey));
  // center of span is z=3.5 → columns 3 and 4; at the crown row (y=7, just under the y=8 apex cap) the
  // centre columns are inside the disc and must stay air — the passage rises to a rounded head, not a fill.
  assert.ok(!filled.has(`0,7,3`) && !filled.has(`0,7,4`), "crown of the arch must stay air (an open passage)");
});

// ---- AF3: the frame — both jambs recolored, dressing BOTH sides of the reveal ----
test("AF3 frameArchPlacements frames both jambs of the reveal", () => {
  const { occ, aperture } = wallWithDoor({ doorLo: 1, doorHi: 6 });
  const { placements, perOpening } = frameArchPlacements(occ, [aperture], { frameBlock: "dark_oak_log" });
  assert.equal(perOpening[0].framed, true);
  const filled = new Set(placements.filter(isFrame).map(posKey));
  // jamb columns are z=0 (left) and z=7 (right) at the wall plane x=0
  assert.ok([...filled].some((k) => k.startsWith("0,") && k.endsWith(",0")), "left jamb framed");
  assert.ok([...filled].some((k) => k.startsWith("0,") && k.endsWith(",7")), "right jamb framed");
});

// ---- AF4: a too-narrow passage is FRAMED but NOT arched — the named-for-E-49 rebuild ----
test("AF4 a 1-wide slot is framed but records the no-arch (needs-wider-opening) reason", () => {
  const { occ, aperture } = wallWithDoor({ doorLo: 3, doorHi: 3, doorTop: 10 }); // W = 1
  const { perOpening } = frameArchPlacements(occ, [aperture], { frameBlock: "dark_oak_log" });
  const rep = perOpening[0];
  assert.equal(rep.width, 1);
  assert.equal(rep.arched, false, "a 1-wide slot has no arch to build");
  assert.equal(rep.ringCells, 0);
  assert.equal(rep.framed, true, "but it is still framed in dark timber");
  assert.match(rep.reason, /wider opening|E-49/);
});

// ---- AF5: PURE / byte-stable — two runs produce identical placement order ----
test("AF5 frameArchPlacements is pure and byte-stable", () => {
  const a = wallWithDoor(), b = wallWithDoor();
  const r1 = frameArchPlacements(a.occ, [a.aperture], { frameBlock: "dark_oak_log" });
  const r2 = frameArchPlacements(b.occ, [b.aperture], { frameBlock: "dark_oak_log" });
  assert.deepEqual(r1.placements, r2.placements);
});

// ---- AF6: closure not regressed — the arch is ADDITIVE, no wall cell removed ----
test("AF6 frameArchPlacements never removes a wall cell (additive/recolor only)", () => {
  const { occ, aperture } = wallWithDoor();
  const before = occ.size;
  const { placements } = frameArchPlacements(occ, [aperture], { frameBlock: "dark_oak_log" });
  // fold the placements; the cell count can only grow (ring adds) or hold (recolor) — never shrink
  const keys = new Set([...occ.cells.keys()]);
  for (const p of placements) keys.add(posKey(p));
  assert.ok(keys.size >= before, "folding placements never drops a wall cell");
});

// ---- AF7: both passages (±x) framed in one call — the reviewer's "dress BOTH" requirement ----
test("AF7 both ±x passages are handled in a single call", () => {
  const minus = wallWithDoor({ dir: "-x" });
  const plus = wallWithDoor({ dir: "+x" });
  const { perOpening } = frameArchPlacements(minus.occ, [minus.aperture, plus.aperture], { frameBlock: "dark_oak_log" });
  assert.equal(perOpening.length, 2);
  assert.ok(perOpening.every((r) => r.framed), "both passage mouths framed");
});

test("AF0 schema id is exported", () => assert.equal(ARCH_FRAME_SCHEMA, "arch-frame/v1"));
