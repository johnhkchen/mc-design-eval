// T-150-01 (E-35 / S-150) — AC3: eave/verge overhang REUSES the existing relief op (S-147
// eaveOverhang → surfaceRelief), and the E-34 proportion ruler reads the eave line correctly with
// the overhang present. The overhang is HONEST perpendicular widening (recorded), never an in-plane
// silhouette move and never a shift of the ridge/eave height ratios — reliefNoRegress IS the proof
// (the same predicate the relief-aware gate, S-148, consumes). No per-building constant: the depth
// is a brush parameter, the eave row is read from the build.
import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { eaveOverhang } from "./facade-articulation.mjs";
import { reliefNoRegress } from "./surface-relief.mjs";

/** A gabled box: walls 0..wallTop, then a tent roof ridged along z (rises with x toward the mid). */
function gabledBox({ w = 13, d = 9, wallTop = 4, wall = "minecraft:cobblestone", roof = "minecraft:dark_oak_planks" } = {}) {
  const out = [];
  for (let x = 0; x < w; x++) for (let y = 0; y <= wallTop; y++) for (let z = 0; z < d; z++) out.push({ pos: [x, y, z], block: wall });
  const mid = (w - 1) / 2;
  for (let x = 0; x < w; x++) {
    const top = wallTop + Math.ceil(mid - Math.abs(x - mid));
    for (let y = wallTop + 1; y <= top; y++) for (let z = 0; z < d; z++) out.push({ pos: [x, y, z], block: roof });
  }
  return out;
}

test("AC3: eave-overhang reuses the relief op, projects past the wall, ruler unmoved", () => {
  const occ = occupancyFromCells(gabledBox({ wallTop: 4 }));
  // the eave row is the top of the wall skin on the long eave faces (read from the build, not pinned)
  const out = eaveOverhang(occ, { material: "minecraft:dark_oak_planks", faces: ["+z", "-z"], depth: 1, eaveRow: 4 });
  assert.ok(out.report.proudCells > 0, "the soffit course projects proud of the wall plane");
  assert.equal(out.report.brush, "eave-overhang");

  const nr = reliefNoRegress(occ, out.placements, { faces: ["+z", "-z"] });
  // the E-34 ruler reads the eave line correctly WITH the overhang present: the in-plane elevation
  // mask + maskProportions are byte-identical, and the whole-build ridge/eave height ratios unmoved.
  assert.equal(nr.inPlanePreserved, true, "in-plane silhouette + maskProportions unchanged by the overhang");
  assert.equal(nr.ratiosPreserved, true, "ridgeToEave / roofShare height ratios byte-identical");
  // both readings are RECORDED either way — the overhang is honest perpendicular widening, not hidden
  assert.deepEqual(nr.ratios.before, nr.ratios.after, "the ruler reading is recorded before and after");
  assert.ok("widened" in nr.expectedWidening, "perpendicular widening is recorded, never gated");
});

test("AC3: a verge/eave overhang course is wider than the wall (the drip edge projects)", () => {
  const occ = occupancyFromCells(gabledBox({ wallTop: 4 }));
  const out = eaveOverhang(occ, { material: "minecraft:dark_oak_planks", faces: ["+z"], depth: 1, eaveRow: 4 });
  // every proud cell sits OUTSIDE the wall perimeter on the +z face (z beyond the wall's maxZ=8)
  for (const p of out.placements) {
    assert.ok(p.pos[2] >= 9, `overhang cell ${p.pos} projects past the +z wall plane (z<=8)`);
    assert.equal(p.pos[1], 4, "the soffit course sits on the eave row");
  }
});
