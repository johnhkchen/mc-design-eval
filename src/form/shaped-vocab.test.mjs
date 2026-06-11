// Unit tests — shaped construction vocabulary (T-105-01). Exhaustive orientation coverage for
// the stair run (4 ascents × 2 windings, hand-written expected states), all slab kinds, and a
// hand-checkable voxel-circle arch (every aperture/ring/label cell enumerated by hand). State
// values are asserted to stay inside the T-097-proven vocabulary (CARD_ROWS) — the render path's
// contract — and every generator is deterministic and fail-loud on malformed specs.

import test from "node:test";
import assert from "node:assert/strict";

import {
  SHAPED_DEFAULTS, ASCENT_FACING, stairRun, slabStep, archRing, flatHead,
} from "./shaped-vocab.mjs";

const PROVEN_FACINGS = new Set(["north", "south", "east", "west"]);
const PROVEN_HALVES = new Set(["bottom", "top"]);
const PROVEN_SLAB_TYPES = new Set(["bottom", "top", "double"]);

// --- stairRun -------------------------------------------------------------------------------

test("stairRun: all 8 orientations carry the hand-written facing/half (proven vocabulary)", () => {
  const cases = [
    { ascent: "+x", winding: "walk", facing: "east", half: "bottom" },
    { ascent: "-x", winding: "walk", facing: "west", half: "bottom" },
    { ascent: "+z", winding: "walk", facing: "south", half: "bottom" },
    { ascent: "-z", winding: "walk", facing: "north", half: "bottom" },
    { ascent: "+x", winding: "soffit", facing: "west", half: "top" },
    { ascent: "-x", winding: "soffit", facing: "east", half: "top" },
    { ascent: "+z", winding: "soffit", facing: "north", half: "top" },
    { ascent: "-z", winding: "soffit", facing: "south", half: "top" },
  ];
  for (const c of cases) {
    const rows = stairRun({ origin: [0, 0, 0], ascent: c.ascent, steps: 2, winding: c.winding, block: "stone_brick_stairs" });
    assert.equal(rows.length, 2, `${c.ascent}/${c.winding}`);
    for (const r of rows) {
      assert.deepEqual(r.state, { facing: c.facing, half: c.half, shape: "straight" }, `${c.ascent}/${c.winding}`);
      assert.ok(PROVEN_FACINGS.has(r.state.facing) && PROVEN_HALVES.has(r.state.half));
    }
  }
});

test("stairRun: geometry — one along the ascent and one up per step, width across the lateral axis", () => {
  assert.deepEqual(
    stairRun({ origin: [0, 0, 0], ascent: "+x", steps: 3, block: "b" }).map((r) => r.pos),
    [[0, 0, 0], [1, 1, 0], [2, 2, 0]]
  );
  assert.deepEqual(
    stairRun({ origin: [1, 2, 3], ascent: "-z", steps: 2, block: "b" }).map((r) => r.pos),
    [[1, 2, 3], [1, 3, 2]]
  );
  // width replicates toward +lateral (ascent on z → lateral on x), step-major order
  assert.deepEqual(
    stairRun({ origin: [1, 2, 3], ascent: "+z", steps: 2, width: 2, block: "b" }).map((r) => r.pos),
    [[1, 2, 3], [2, 2, 3], [1, 3, 4], [2, 3, 4]]
  );
  // degenerate single step
  assert.deepEqual(stairRun({ origin: [5, 5, 5], ascent: "-x", steps: 1, block: "b" }).map((r) => r.pos), [[5, 5, 5]]);
});

test("stairRun: ASCENT_FACING covers exactly the four cardinals; malformed specs throw", () => {
  assert.deepEqual(Object.keys(ASCENT_FACING).sort(), ["+x", "+z", "-x", "-z"].sort());
  assert.throws(() => stairRun({ origin: [0, 0.5, 0], ascent: "+x", steps: 1, block: "b" }), /origin/);
  assert.throws(() => stairRun({ origin: [0, 0, 0], ascent: "up", steps: 1, block: "b" }), /ascent/);
  assert.throws(() => stairRun({ origin: [0, 0, 0], ascent: "+x", steps: 0, block: "b" }), /steps/);
  assert.throws(() => stairRun({ origin: [0, 0, 0], ascent: "+x", steps: 1, winding: "spiral", block: "b" }), /winding/);
  assert.throws(() => stairRun({ origin: [0, 0, 0], ascent: "+x", steps: 1, block: "" }), /block/);
});

// --- slabStep -------------------------------------------------------------------------------

test("slabStep: both axes × all three kinds, type state in the proven vocabulary", () => {
  for (const axis of ["x", "z"]) {
    for (const kind of ["bottom", "top", "double"]) {
      const rows = slabStep({ origin: [0, 7, 0], axis, length: 3, kind, block: "oak_slab" });
      assert.equal(rows.length, 3);
      for (const r of rows) {
        assert.deepEqual(r.state, { type: kind });
        assert.ok(PROVEN_SLAB_TYPES.has(r.state.type));
      }
      const along = rows.map((r) => (axis === "x" ? r.pos[0] : r.pos[2]));
      assert.deepEqual(along, [0, 1, 2]);
      assert.ok(rows.every((r) => r.pos[1] === 7));
    }
  }
  assert.throws(() => slabStep({ origin: [0, 0, 0], axis: "y", length: 1, kind: "bottom", block: "b" }), /axis/);
  assert.throws(() => slabStep({ origin: [0, 0, 0], axis: "x", length: 1, kind: "half", block: "b" }), /kind/);
});

// --- archRing -------------------------------------------------------------------------------

// Hand-checked case: center (u0=0, y0=10), r=2.5, span z∈[−2,2], y∈[8,13], depth x∈{5,6}.
// y≤11: all 5 span columns inside (4+1 ≤ 6.25). y=12: |u|≤1 inside (u=±2 → 8 > 6.25). y=13: none.
const ARCH_SPEC = Object.freeze({
  center: [0, 10], radius: 2.5,
  span: { axis: "z", range: [-2, 2] }, yRange: [8, 13], depth: { axis: "x", range: [5, 6] },
  block: "stone_bricks",
});

test("archRing: hand-enumerated aperture and ring on the r=2.5 disc", () => {
  const out = archRing(ARCH_SPEC);
  // aperture: 5 columns × y∈{8..11} × 2 depths + 3 columns × y=12 × 2 depths = 46
  assert.equal(out.aperture.length, 46);
  // ring: u=±2 at y=12 (×2 depths) + 5 columns at y=13 (×2 depths) = 14
  assert.equal(out.ring.length, 14);
  const ringKeys = new Set(out.ring.map((c) => c.pos.join(",")));
  for (const d of [5, 6]) {
    for (const u of [-2, 2]) assert.ok(ringKeys.has(`${d},12,${u}`), `ring (${d},12,${u})`);
    for (const u of [-2, -1, 0, 1, 2]) assert.ok(ringKeys.has(`${d},13,${u}`), `ring (${d},13,${u})`);
  }
  // disc symmetry about the center column
  const aperture = new Set(out.aperture);
  for (const k of aperture) {
    const [x, y, z] = k.split(",").map(Number);
    assert.ok(aperture.has(`${x},${y},${-z}`), `mirror of ${k}`);
  }
  assert.ok(out.ring.every((c) => c.block === "stone_bricks"));
});

test("archRing: head/jamb labels — extrados adjacency and flanking columns", () => {
  const out = archRing(ARCH_SPEC);
  const expectHead = [];
  for (const d of [5, 6]) {
    for (const [u, y] of [[-2, 12], [2, 12], [-1, 13], [0, 13], [1, 13]]) expectHead.push(`${d},${y},${u}`);
  }
  assert.deepEqual([...out.headCells].sort(), expectHead.sort());
  // jambs: flanking columns u=±3, y from window sill (8) to floor(y0)=10, both depths
  const expectJamb = [];
  for (let y = 8; y <= 10; y++) for (const d of [5, 6]) for (const u of [-3, 3]) expectJamb.push(`${d},${y},${u}`);
  assert.deepEqual([...out.jambCells].sort(), expectJamb.sort());
});

test("archRing: depth layers identical; span on x maps pos as [u,y,d]; deterministic", () => {
  const out = archRing(ARCH_SPEC);
  const layer = (d) => out.aperture.filter((k) => k.startsWith(`${d},`)).map((k) => k.slice(2)).sort();
  assert.deepEqual(layer(5), layer(6));
  const xSpan = archRing({ ...ARCH_SPEC, span: { axis: "x", range: [-2, 2] }, depth: { axis: "z", range: [5, 6] } });
  assert.ok(new Set(xSpan.aperture).has("0,10,5")); // u=0,y=10 at depth z=5 → pos [0,10,5]
  assert.deepEqual(archRing(ARCH_SPEC), archRing(ARCH_SPEC));
});

test("archRing: malformed specs throw (fail-loud)", () => {
  assert.throws(() => archRing({ ...ARCH_SPEC, center: [0] }), /center/);
  assert.throws(() => archRing({ ...ARCH_SPEC, radius: 0 }), /radius/);
  assert.throws(() => archRing({ ...ARCH_SPEC, depth: { axis: "z", range: [5, 6] } }), /axis.*differ|differ/);
  assert.throws(() => archRing({ ...ARCH_SPEC, yRange: [13, 8] }), /yRange/);
  assert.throws(() => archRing({ ...ARCH_SPEC, span: { axis: "z", range: [2, -2] } }), /span/);
});

// --- flatHead -------------------------------------------------------------------------------

test("flatHead: squared lintel — aperture at/below level, ring above, head row labeled", () => {
  const out = flatHead({
    level: 9, span: { axis: "z", range: [0, 2] }, yRange: [8, 10],
    depth: { axis: "x", range: [4, 4] }, block: null,
  });
  // aperture: 3 columns × y∈{8,9}; ring: 3 columns at y=10, all head-labeled
  assert.equal(out.aperture.length, 6);
  assert.equal(out.ring.length, 3);
  assert.deepEqual([...out.headCells].sort(), ["4,10,0", "4,10,1", "4,10,2"].sort());
  // jambs flank the span at u=−1 and u=3 from window sill up to the level
  const expectJamb = [];
  for (let y = 8; y <= 9; y++) for (const u of [-1, 3]) expectJamb.push(`4,${y},${u}`);
  assert.deepEqual([...out.jambCells].sort(), expectJamb.sort());
  assert.ok(out.ring.every((c) => c.block === null));
  assert.throws(() => flatHead({ level: 9.5, span: { axis: "z", range: [0, 2] }, yRange: [8, 10], depth: { axis: "x", range: [4, 4] } }), /level/);
});

// --- defaults -------------------------------------------------------------------------------

test("SHAPED_DEFAULTS: frozen, fully declared", () => {
  assert.ok(Object.isFrozen(SHAPED_DEFAULTS));
  for (const k of ["rmseTol", "flatRmseTol", "minArchWidth", "minArchRise", "pitchTol", "slabPitchTol", "glbRmseTol"]) {
    assert.equal(typeof SHAPED_DEFAULTS[k], "number", k);
  }
});
