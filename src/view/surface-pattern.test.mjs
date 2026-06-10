import { test } from "node:test";
import assert from "node:assert/strict";
import { occupancyFromCells } from "./occupancy.mjs";
import { expandArtifact, voxelKey } from "../expand.mjs";
import { applyPaint } from "./face-paint.mjs";
import { courseMetrics, regularizeRoofCourses, stripStraySalt } from "./surface-pattern.mjs";

const artifactOf = (cells) => ({
  schema: "1.0.0",
  palette: { manifest: [] },
  placements: cells.map((c) => ({ op: "voxel", pos: c.pos, block: c.block })),
});
const blockAt = (placements, pos) =>
  placements.filter((p) => voxelKey(p.pos) === voxelKey(pos)).map((p) => p.block).pop();
const posSet = (vs) => new Set(vs.map((v) => voxelKey(v.pos)));

// ─── Fixture A: THE NOISY GABLE ────────────────────────────────────────────────────────────────────
// An 8×8 gable roof, ridge along z at x=3..4: column height h(x) = 3 + min(x, 7−x) → [3,4,5,6,6,5,4,3],
// solid spruce columns y0..h. Hand-planted defects on the height field:
//   • PIT     (2,5) → 3 (was 5): enclosed, neighbours (1,5)=4 (3,5)=6 (2,4)=5 (2,6)=5 → spill 4, +1 voxel
//   • BASIN   (5,2),(5,3) → 3 (was 5): enclosed pair, spills through (6,2)/(6,3) level 4 → +1 voxel each
//   • CHANNEL (3,0..3) → 3 (was 6): a valley DRAINING to the z=0 eave — spill = own height, never filled
//   • BUMP    (6,6) → 6 (was 4): protrusion — fill only raises, never lowers
// Expected: columnsRaised 3, voxelsAdded 3, adds exactly {[2,4,5],[5,4,2],[5,4,3]}.
// Metric deltas (hand-derived joint by joint around the two filled defects):
//   pit: joints (d1,d3,d2,d2)→(d0,d2,d1,d1); basin: (d3,d1,d2,d0,d3,d1,d2)→(d2,d0,d1,d0,d2,d0,d1)
//   ⇒ Δcliff −4, Δflat +3, Δstep1 +1; pairs invariant = 2·7·8 = 112 (full 8×8 plan).
const DEFECT_H = new Map([["3,0", 3], ["3,1", 3], ["3,2", 3], ["3,3", 3], ["2,5", 3], ["5,2", 3], ["5,3", 3], ["6,6", 6]]);
function gable() {
  const cells = [];
  for (let x = 0; x < 8; x++) {
    for (let z = 0; z < 8; z++) {
      const h = DEFECT_H.get(`${x},${z}`) ?? 3 + Math.min(x, 7 - x);
      for (let y = 0; y <= h; y++) cells.push({ pos: [x, y, z], block: "minecraft:spruce_planks" });
    }
  }
  return cells;
}

test("course fill: pit and basin raised to spill level in the dominant; exact adds", () => {
  const occ = occupancyFromCells(gable());
  const r = regularizeRoofCourses(occ, { dominant: "spruce_planks" });
  assert.equal(r.columnsRaised, 3);
  assert.equal(r.voxelsAdded, 3);
  assert.equal(r.placements.length, 3);
  for (const pos of [[2, 4, 5], [5, 4, 2], [5, 4, 3]]) {
    assert.equal(blockAt(r.placements, pos), "minecraft:spruce_planks");
  }
});

test("course fill: draining valley, eave-adjacent channel, and bump are untouched", () => {
  const occ = occupancyFromCells(gable());
  const r = regularizeRoofCourses(occ, { dominant: "spruce_planks" });
  const touched = new Set(r.placements.map((p) => `${p.pos[0]},${p.pos[2]}`));
  for (const col of ["3,0", "3,1", "3,2", "3,3", "6,6"]) assert.ok(!touched.has(col), `column ${col} must stay`);
});

test("course fill is adds-only: placements land on EMPTY cells; expanded pos-set = original ∪ adds", () => {
  const cells = gable();
  const occ = occupancyFromCells(cells);
  const art = artifactOf(cells);
  const r = regularizeRoofCourses(occ, { dominant: "spruce_planks" });
  for (const p of r.placements) assert.ok(!occ.has(...p.pos), `add at ${p.pos} must be an empty cell`);
  const want = posSet(expandArtifact(art));
  for (const p of r.placements) want.add(voxelKey(p.pos));
  assert.deepEqual(posSet(expandArtifact(applyPaint(art, r.placements))), want);
});

test("course metrics: hand-derived joint deltas (Δcliff −4, Δflat +3, Δstep1 +1; pairs 112)", () => {
  const occ = occupancyFromCells(gable());
  const r = regularizeRoofCourses(occ, { dominant: "spruce_planks" });
  assert.deepEqual(r.before, courseMetrics(occ)); // the op reports the same lens it is judged by
  assert.equal(r.before.pairs, 112);
  assert.equal(r.after.pairs, 112);
  assert.equal(r.after.cliff, r.before.cliff - 4);
  assert.equal(r.after.flat, r.before.flat + 3);
  assert.equal(r.after.step1, r.before.step1 + 1);
  assert.ok(r.after.stepSmoothness > r.before.stepSmoothness);
  assert.ok(r.after.meanAbsStep < r.before.meanAbsStep);
  // and the after metrics are reproducible from the overlaid build, not just the internal map
  const after = courseMetrics(occupancyFromCells([...gable(), ...r.placements.map((p) => ({ pos: p.pos, block: p.block }))]));
  assert.deepEqual(r.after, after);
});

test("course fill degenerates safely: empty occupancy is vacuous; missing dominant throws", () => {
  const empty = occupancyFromCells([]);
  assert.deepEqual(courseMetrics(empty), { pairs: 0, flat: 0, step1: 0, cliff: 0, stepSmoothness: 1, meanAbsStep: 0 });
  const r = regularizeRoofCourses(empty, { dominant: "spruce_planks" });
  assert.equal(r.placements.length, 0);
  assert.throws(() => regularizeRoofCourses(empty, {}), /dominant/);
});

// ─── Fixture B: THE SALTED HUT ─────────────────────────────────────────────────────────────────────
// A solid 5×5 hut, y0..6, every cell its zone's dominant (base y0..2 stone, upper y3..5 plaster, roof
// y6 spruce) EXCEPT the planted features (all on the visible skin):
//   • SPECK   cobblestone (4,4,4) — a lone cobble in the plaster field            → STRIP (size 1)
//   • CLUMP   dark_oak_log (2,3,4)(3,3,4)(2,4,4)(3,4,4) — 2×2 blob, extent 2      → STRIP (shape, not size)
//   • STUD    dark_oak_log (0,3..5,4) — 3-cell vertical run, extent 3             → KEEP
//   • CHIMNEY bricks (0,2..6,1) — 5-cell run crossing base→upper→roof             → KEEP (whole-skin comp)
//   • BASE SPECK cobblestone (4,1,4) — a lone cobble in the stone field           → STRIP → stone
// Hand census: upper offDominant 11 (5 strip / 6 keep), base 2 (1/1), roof 1 (0/1).
function hut() {
  const at = (x, y, z) => {
    if (x === 0 && z === 1 && y >= 2) return "minecraft:bricks"; // chimney (y2..6)
    if (x === 0 && z === 4 && y >= 3 && y <= 5) return "minecraft:dark_oak_log"; // stud
    if (x >= 2 && x <= 3 && z === 4 && y >= 3 && y <= 4) return "minecraft:dark_oak_log"; // clump
    if (x === 4 && z === 4 && y === 4) return "minecraft:cobblestone"; // upper speck
    if (x === 4 && z === 4 && y === 1) return "minecraft:cobblestone"; // base speck
    if (y >= 6) return "minecraft:spruce_planks";
    if (y >= 3) return "minecraft:white_terracotta";
    return "minecraft:stone_bricks";
  };
  const cells = [];
  for (let x = 0; x < 5; x++) for (let y = 0; y < 7; y++) for (let z = 0; z < 5; z++) {
    cells.push({ pos: [x, y, z], block: at(x, y, z) });
  }
  return cells;
}
const zoneOf = ([, y]) => (y >= 6 ? "roof" : y >= 3 ? "upper" : "base");
const ZONES = {
  base: { dominant: "stone_bricks" },
  upper: { dominant: "white_terracotta" },
  roof: { dominant: "spruce_planks" },
};

test("an isolated speck is stripped to the field (AC): lone cobble → its zone's dominant", () => {
  const occ = occupancyFromCells(hut());
  const r = stripStraySalt(occ, { zoneOf, zones: ZONES });
  assert.equal(blockAt(r.placements, [4, 4, 4]), "minecraft:white_terracotta"); // plaster field
  assert.equal(blockAt(r.placements, [4, 1, 4]), "minecraft:stone_bricks"); // zone-correct reassignment
});

test("a stud run is preserved (AC): the 3-cell timber line takes no placement", () => {
  const occ = occupancyFromCells(hut());
  const r = stripStraySalt(occ, { zoneOf, zones: ZONES });
  for (const y of [3, 4, 5]) assert.equal(blockAt(r.placements, [0, y, 4]), undefined);
});

test("a 2×2 clump is stripped — the shape test, not just size (size 4 ≥ minKeep, extent 2 < minExtent)", () => {
  const occ = occupancyFromCells(hut());
  const r = stripStraySalt(occ, { zoneOf, zones: ZONES });
  for (const pos of [[2, 3, 4], [3, 3, 4], [2, 4, 4], [3, 4, 4]]) {
    assert.equal(blockAt(r.placements, pos), "minecraft:white_terracotta");
  }
});

test("the chimney is kept whole across zones: whole-skin connectivity, not per-zone fragments", () => {
  const occ = occupancyFromCells(hut());
  const r = stripStraySalt(occ, { zoneOf, zones: ZONES });
  for (const y of [2, 3, 4, 5, 6]) assert.equal(blockAt(r.placements, [0, y, 1]), undefined);
  // the base (1 cell) and roof (1 cell) fragments would fail size≥3 under per-zone connectivity —
  // their KEPT tallies pin the whole-skin rule
  assert.equal(r.byZone.base.byBlock.bricks.kept, 1);
  assert.equal(r.byZone.roof.byBlock.bricks.kept, 1);
});

test("per-zone tallies are exact and recolor-only geometry holds", () => {
  const cells = hut();
  const occ = occupancyFromCells(cells);
  const art = artifactOf(cells);
  const r = stripStraySalt(occ, { zoneOf, zones: ZONES });
  assert.equal(r.stripped, 6);
  assert.equal(r.kept, 8);
  assert.deepEqual(r.byZone.upper, {
    offDominant: 11, strippedCells: 5, keptCells: 6,
    byBlock: { bricks: { stripped: 0, kept: 3 }, dark_oak_log: { stripped: 4, kept: 3 }, cobblestone: { stripped: 1, kept: 0 } },
  });
  assert.equal(r.byZone.base.offDominant, 2);
  assert.equal(r.byZone.roof.offDominant, 1);
  for (const p of r.placements) assert.ok(occ.has(...p.pos), "strip must recolor an existing voxel");
  assert.deepEqual(posSet(expandArtifact(applyPaint(art, r.placements))), posSet(expandArtifact(art)));
});

test("a zone without a policy entry is untouched", () => {
  const occ = occupancyFromCells(hut());
  const r = stripStraySalt(occ, { zoneOf, zones: { upper: ZONES.upper, roof: ZONES.roof } });
  assert.equal(blockAt(r.placements, [4, 1, 4]), undefined); // base speck stays
  assert.equal(r.byZone.base, undefined);
  assert.ok(r.placements.every((p) => zoneOf(p.pos) !== "base"));
});

test("minKeep/minExtent are data: at minKeep 4 the 3-cell stud strips", () => {
  const occ = occupancyFromCells(hut());
  const r = stripStraySalt(occ, { zoneOf, zones: ZONES, minKeep: 4 });
  for (const y of [3, 4, 5]) assert.equal(blockAt(r.placements, [0, y, 4]), "minecraft:white_terracotta");
});

test("arg validation mirrors zoneFill's", () => {
  const occ = occupancyFromCells(hut());
  assert.throws(() => stripStraySalt(occ, { zones: ZONES }), /zoneOf/);
  assert.throws(() => stripStraySalt(occ, { zoneOf }), /zones/);
  assert.throws(() => stripStraySalt(occ, { zoneOf, zones: { upper: {} } }), /dominant/);
});
