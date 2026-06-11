// Unit tests for idiom-constructs.mjs (T-124-01, story S-124, epic E-31) — synthetic specs only,
// exhaustive over orientations (the stairRun 4×2 precedent). Both-ways: every generator has
// realization assertions AND malformed-spec throws.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  IDIOM_CONSTRUCT_DEFAULTS,
  dormerGable, chimneyStack, jettyOverhang, plinthBand,
} from "./idiom-constructs.mjs";

const keyOf = (c) => c.pos.join(",");
const byPos = (cells) => new Map(cells.map((c) => [keyOf(c), c]));
const FACINGS = ["+x", "-x", "+z", "-z"];
const STAIR_STATE_KEYS = ["facing", "half", "shape"];
const FACING_NAMES = new Set(["north", "south", "east", "west"]);

// ---------------------------------------------------------------- dormerGable

const DORMER = Object.freeze({
  origin: [10, 20, 30], width: 3, depth: 3,
  wallBlock: "oak_planks", roofBlock: "spruce_stairs", faceBlock: "white_terracotta",
});

test("dormer: all four facings — no duplicate cells, legal stair states, aperture punched", () => {
  for (const facing of FACINGS) {
    const r = dormerGable({ ...DORMER, facing });
    const m = byPos(r.cells);
    assert.equal(m.size, r.cells.length, `${facing}: duplicate cell emitted`);
    // aperture cells are reported, never placed
    assert.equal(r.aperture.length, IDIOM_CONSTRUCT_DEFAULTS.dormerAperture.h, facing);
    for (const k of r.aperture) assert.ok(!m.has(k), `${facing}: aperture cell ${k} was placed`);
    // every stair carries exactly the proven state shape
    for (const c of r.cells) {
      if (c.block === "spruce_stairs") {
        assert.deepEqual(Object.keys(c.state).sort(), [...STAIR_STATE_KEYS].sort());
        assert.ok(FACING_NAMES.has(c.state.facing));
        assert.equal(c.state.half, "bottom");
        assert.equal(c.state.shape, "straight");
      } else {
        assert.equal(c.state, undefined, `${facing}: full cube carries a state`);
      }
    }
    // ridge: full-cube wallBlock row at ridgeY, one per depth step
    const ridgeCells = r.cells.filter((c) => c.pos[1] === r.ridgeY);
    assert.equal(ridgeCells.length, DORMER.depth, `${facing}: ridge row length`);
    assert.ok(ridgeCells.every((c) => c.block === "oak_planks"));
    assert.equal(r.ridgeY, 20 + 2 + 1); // origin.y + wallHeight + halfW
  }
});

test("dormer: the two roof pitches face each other (uphill = toward the ridge)", () => {
  for (const facing of FACINGS) {
    const r = dormerGable({ ...DORMER, facing });
    const stairs = r.cells.filter((c) => c.block === "spruce_stairs");
    const facings = new Set(stairs.map((c) => c.state.facing));
    assert.equal(facings.size, 2, `${facing}: expected exactly two stair facings`);
    // opposed pair on the lateral axis: e/w when facing ±z, n/s when facing ±x
    const want = facing[1] === "x" ? new Set(["north", "south"]) : new Set(["east", "west"]);
    assert.deepEqual(facings, want, facing);
  }
});

test("dormer: face/cheek/roof partition and orientation geometry (+x worked example)", () => {
  // explicit 1×1 aperture so the center column's gable-profile top stays solid
  const r = dormerGable({ ...DORMER, facing: "+x", aperture: { w: 1, h: 1 } });
  const m = byPos(r.cells);
  // front face at x=10 (the origin plane), centered at z=30: face column z=29 fills y20..21
  assert.equal(m.get("10,20,29").block, "white_terracotta");
  assert.equal(m.get("10,21,29").block, "white_terracotta");
  // center column rises one more (gable profile)
  assert.equal(m.get("10,22,30").block, "white_terracotta");
  // aperture: the single center cell at yOff 1
  assert.deepEqual(r.aperture, ["10,21,30"]);
  assert.ok(!m.has("10,21,30"));
  // cheeks extend inward (−x): depth index 1..2 at z=29 and z=31
  assert.equal(m.get("9,20,29").block, "oak_planks");
  assert.equal(m.get("8,21,31").block, "oak_planks");
  // roof: edge course sits on the cheek top (y22), ridge at y23 over the center line
  assert.equal(m.get("9,22,29").block, "spruce_stairs");
  assert.deepEqual(m.get("9,22,29").state.facing, "south"); // uphill toward center (+z)
  assert.equal(m.get("9,22,31").state.facing, "north");
  assert.equal(m.get("9,23,30").block, "oak_planks"); // ridge
});

test("dormer: wider dormer keeps the 45° profile (width 5)", () => {
  const r = dormerGable({ ...DORMER, facing: "+z", width: 5 });
  const ys = r.cells.filter((c) => c.block === "spruce_stairs").map((c) => c.pos[1]);
  // halfW=2 → stair courses at wallHeight(2)+0 and +1 above origin.y: y22 and y23
  assert.deepEqual([...new Set(ys)].sort(), [22, 23]);
  assert.equal(r.ridgeY, 24);
});

test("dormer: malformed specs throw", () => {
  assert.throws(() => dormerGable({ ...DORMER, facing: "+x", width: 4 }), /odd integer ≥ 3/);
  assert.throws(() => dormerGable({ ...DORMER, facing: "+x", width: 1 }), /odd integer ≥ 3/);
  assert.throws(() => dormerGable({ ...DORMER, facing: "up" }), /facing/);
  assert.throws(() => dormerGable({ ...DORMER, facing: "+x", depth: 1 }), /depth/);
  assert.throws(() => dormerGable({ ...DORMER, facing: "+x", wallHeight: 1 }), /wallHeight/);
  assert.throws(() => dormerGable({ ...DORMER, facing: "+x", roofBlock: "" }), /roofBlock/);
  assert.throws(() => dormerGable({ ...DORMER, facing: "+x", origin: [0, 0.5, 0] }), /origin/);
  // aperture must leave solid flanks and fit under the profile
  assert.throws(() => dormerGable({ ...DORMER, facing: "+x", aperture: { w: 3, h: 1 } }), /aperture/);
  assert.throws(() => dormerGable({ ...DORMER, facing: "+x", aperture: { w: 1, h: 9 } }), /aperture/);
  assert.throws(() => dormerGable(undefined), /origin/);
});

test("dormer: determinism", () => {
  const a = dormerGable({ ...DORMER, facing: "-z" });
  const b = dormerGable({ ...DORMER, facing: "-z" });
  assert.deepEqual(a, b);
});

// ---------------------------------------------------------------- chimneyStack

test("chimney: shaft footprints 1×1 and 2×2, columns reported", () => {
  for (const fp of [{ w: 1, d: 1 }, { w: 2, d: 2 }]) {
    const r = chimneyStack({ base: [0, 10, 0], footprint: fp, height: 4, block: "bricks" });
    assert.equal(r.cells.length, fp.w * fp.d * 4);
    assert.equal(r.columns.size, fp.w * fp.d);
    assert.equal(r.topY, 13);
    assert.ok(r.cells.every((c) => c.block === "bricks" && c.state === undefined));
  }
});

test("chimney: crown cap oversails one cell on every side at topY", () => {
  const r = chimneyStack({ base: [5, 0, 5], footprint: { w: 2, d: 1 }, height: 3, block: "bricks", cap: "crown", capBlock: "stone_bricks" });
  assert.equal(r.topY, 3);
  const crown = r.cells.filter((c) => c.pos[1] === 3);
  assert.equal(crown.length, (2 + 2) * (1 + 2)); // (w+2)×(d+2)
  assert.ok(crown.every((c) => c.block === "stone_bricks"));
  // the oversail ring lies strictly outside the shaft footprint
  const shaftCols = r.columns;
  const ring = crown.filter((c) => !shaftCols.has(`${c.pos[0]},${c.pos[2]}`));
  assert.equal(ring.length, crown.length - 2);
  for (const c of ring) {
    assert.ok(c.pos[0] >= 4 && c.pos[0] <= 7 && c.pos[2] >= 4 && c.pos[2] <= 6);
  }
});

test("chimney: slab cap emits the proven {type:\"bottom\"} state over the shaft only", () => {
  const r = chimneyStack({ base: [0, 0, 0], height: 2, block: "bricks", cap: "slab", capBlock: "brick_slab" });
  const slabs = r.cells.filter((c) => c.state);
  assert.equal(slabs.length, 1);
  assert.deepEqual(slabs[0], { pos: [0, 2, 0], block: "brick_slab", state: { type: "bottom" } });
  assert.equal(r.topY, 2);
});

test("chimney: malformed specs throw", () => {
  assert.throws(() => chimneyStack({ base: [0, 0, 0], height: 0, block: "bricks" }), /height/);
  assert.throws(() => chimneyStack({ base: [0, 0, 0], height: 2, block: "" }), /block/);
  assert.throws(() => chimneyStack({ base: [0, 0], height: 2, block: "bricks" }), /base/);
  assert.throws(() => chimneyStack({ base: [0, 0, 0], footprint: { w: 0, d: 1 }, height: 2, block: "bricks" }), /footprint/);
  assert.throws(() => chimneyStack({ base: [0, 0, 0], height: 2, block: "bricks", cap: "dome" }), /cap/);
  assert.throws(() => chimneyStack({ base: [0, 0, 0], height: 2, block: "bricks", cap: "crown", capBlock: "" }), /capBlock/);
});

// ---------------------------------------------------------------- jettyOverhang

test("jetty: all four (axis × side) edges — beam off the wall line, upperWallLine shifted", () => {
  for (const axis of ["x", "z"]) {
    for (const side of ["+", "-"]) {
      const r = jettyOverhang({
        edge: { axis, at: 10, side, range: [0, 5] }, y: 7,
        beamBlock: "dark_oak_planks", joistBlock: "dark_oak_log",
      });
      const s = side === "+" ? 1 : -1;
      const perpIdx = axis === "x" ? 2 : 0; // beam varies on the perpendicular axis
      const alongIdx = axis === "x" ? 0 : 2;
      const beams = r.cells.filter((c) => c.block === "dark_oak_planks");
      assert.equal(beams.length, 6, `${axis}${side}: one beam cell per range step`);
      for (const c of beams) {
        assert.equal(c.pos[perpIdx], 10 + s, `${axis}${side}: beam exactly one cell off the wall`);
        assert.equal(c.pos[1], 7);
        assert.ok(c.pos[alongIdx] >= 0 && c.pos[alongIdx] <= 5);
      }
      // joists: every joistEvery (default 2) under the beam line
      const joists = r.cells.filter((c) => c.block === "dark_oak_log");
      assert.equal(joists.length, 3, `${axis}${side}`); // t = 0, 2, 4
      assert.ok(joists.every((c) => c.pos[1] === 6 && c.pos[perpIdx] === 10 + s));
      assert.deepEqual(r.upperWallLine, { axis: axis === "x" ? "z" : "x", at: 10 + s });
    }
  }
});

test("jetty: overhang 2 fills both projected lines; no joists without a joistBlock", () => {
  const r = jettyOverhang({ edge: { axis: "x", at: 0, side: "+", range: [3, 4] }, y: 5, overhang: 2, beamBlock: "oak_planks" });
  assert.equal(r.cells.length, 4); // 2 lines × 2 range cells, no joists
  const perps = new Set(r.cells.map((c) => c.pos[2]));
  assert.deepEqual([...perps].sort(), [1, 2]);
  assert.deepEqual(r.upperWallLine, { axis: "z", at: 2 });
});

test("jetty: malformed specs throw", () => {
  const ok = { edge: { axis: "x", at: 0, side: "+", range: [0, 3] }, y: 1, beamBlock: "oak_planks" };
  assert.throws(() => jettyOverhang({ ...ok, edge: { ...ok.edge, axis: "y" } }), /axis/);
  assert.throws(() => jettyOverhang({ ...ok, edge: { ...ok.edge, side: "*" } }), /side/);
  assert.throws(() => jettyOverhang({ ...ok, edge: { ...ok.edge, range: [3, 0] } }), /range/);
  assert.throws(() => jettyOverhang({ ...ok, overhang: 0 }), /overhang/);
  assert.throws(() => jettyOverhang({ ...ok, beamBlock: "" }), /beamBlock/);
  assert.throws(() => jettyOverhang({ ...ok, joistEvery: 0 }), /joistEvery/);
  assert.throws(() => jettyOverhang({}), /axis/);
});

// ---------------------------------------------------------------- plinthBand

test("plinth: perimeter only, all courses, inset honored", () => {
  const r = plinthBand({ footprint: { x0: 0, x1: 4, z0: 0, z1: 3 }, y0: 2, courses: 2, block: "cobblestone" });
  // ring of a 5×4 rect = 5*4 − 3*2 = 14 cells per course
  assert.equal(r.cells.length, 14 * 2);
  for (const c of r.cells) {
    const [x, y, z] = c.pos;
    assert.ok(y === 2 || y === 3);
    assert.ok(x === 0 || x === 4 || z === 0 || z === 3, `interior cell ${c.pos}`);
  }
  const inset = plinthBand({ footprint: { x0: 0, x1: 4, z0: 0, z1: 4 }, y0: 0, courses: 1, block: "cobblestone", inset: 1 });
  // inset ring over [1..3]² = 8 cells
  assert.equal(inset.cells.length, 8);
  assert.ok(inset.cells.every((c) => c.pos[0] >= 1 && c.pos[0] <= 3 && c.pos[2] >= 1 && c.pos[2] <= 3));
});

test("plinth: degenerate 1-wide footprint is a filled line, not an error", () => {
  const r = plinthBand({ footprint: { x0: 0, x1: 0, z0: 0, z1: 4 }, y0: 0, courses: 1, block: "stone" });
  assert.equal(r.cells.length, 5);
});

test("plinth: malformed specs throw", () => {
  assert.throws(() => plinthBand({ footprint: { x0: 5, x1: 0, z0: 0, z1: 4 }, y0: 0, courses: 1, block: "stone" }), /footprint/);
  assert.throws(() => plinthBand({ footprint: { x0: 0, x1: 4, z0: 0, z1: 4 }, y0: 0, courses: 0, block: "stone" }), /courses/);
  assert.throws(() => plinthBand({ footprint: { x0: 0, x1: 4, z0: 0, z1: 4 }, y0: 0, courses: 1, block: "" }), /block/);
  assert.throws(() => plinthBand({ footprint: { x0: 0, x1: 2, z0: 0, z1: 2 }, y0: 0, courses: 1, block: "stone", inset: 2 }), /inset/);
});
