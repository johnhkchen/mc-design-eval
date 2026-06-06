// Unit suite for region addressing + the region-lock (T-044-01, story S-044, epic E-15).
//
// PURE, no GL/model/network — auto-collected by `src/**/*.test.mjs`. Never calls observeRegion (the GL
// leaf); that one live crop render is proven separately in render/test/observe-region.test.mjs. Tests
// assert PROPERTIES (sub-bounds math, in-region membership, lock reject/permit, the outside-R invariant,
// round-trip schema-validity, purity) and pin concrete values on the committed koi artifact.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  REGION_SCHEMA,
  PART_NAMES,
  placementBounds,
  artifactBounds,
  coordInBounds,
  boundsContain,
  clampBounds,
  subBoundsOf,
  resolveNamedRegion,
  resolveWhereRegion,
  selectRegion,
  applyRegionEdit,
  RegionEditOutOfBoundsError,
} from "./region.mjs";
import { assertArtifact } from "../artifact.mjs";
import { expandArtifact, voxelKey } from "../expand.mjs";

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const KOI = JSON.parse(
  readFileSync(here("../../benchmarks/sculpture/runs/009-vConcept-a-koi-fish/artifact.json"), "utf8"),
);

/** A minimal schema-valid DesignArtifact wrapping the given placements. */
function artifactWith(placements) {
  return {
    schema_version: "1.0.0",
    metadata: {
      trial_id: "t",
      prompting_method_id: "p",
      model_id: "m",
      seed: 0,
      server_state_id: "s",
    },
    style: { name: "x", rationale: "y" },
    palette: { manifest: [...new Set(placements.map((p) => p.block))].sort() },
    placements,
  };
}

// --- Group A: sub-bounds math ----------------------------------------------

test("A: placementBounds — voxel is a point; fill/line/box normalize from..to", () => {
  assert.deepEqual(placementBounds({ op: "voxel", pos: [3, 4, 5], block: "minecraft:stone" }), {
    min: [3, 4, 5], max: [3, 4, 5],
  });
  // unordered corners (schema does not require from <= to) normalize
  assert.deepEqual(
    placementBounds({ op: "fill", from: [5, 0, 2], to: [1, 6, -2], block: "minecraft:stone" }),
    { min: [1, 0, -2], max: [5, 6, 2] },
  );
});

test("A: artifactBounds pins the koi overall extent; throws with no placements", () => {
  assert.deepEqual(artifactBounds(KOI), { min: [-15, 0, -7], max: [16, 15, 7] });
  assert.throws(() => artifactBounds({ placements: [] }), /no placements/);
});

test("A: coordInBounds / boundsContain are inclusive", () => {
  const b = { min: [0, 0, 0], max: [4, 4, 4] };
  assert.ok(coordInBounds([4, 0, 2], b));
  assert.ok(!coordInBounds([5, 0, 2], b));
  assert.ok(boundsContain(b, { min: [1, 1, 1], max: [4, 4, 4] }));
  assert.ok(!boundsContain(b, { min: [1, 1, 1], max: [5, 4, 4] }));
});

test("A: clampBounds intersects into the build", () => {
  const B = { min: [-15, 0, -7], max: [16, 15, 7] };
  assert.deepEqual(clampBounds({ min: [-100, -100, -100], max: [100, 100, 100] }, B), B);
  assert.deepEqual(clampBounds({ min: [0, 5, 0], max: [10, 9, 3] }, B), {
    min: [0, 5, 0], max: [10, 9, 3],
  });
});

// --- Group B: named / where resolution -------------------------------------

const CUBE = { min: [0, 0, 0], max: [9, 9, 9] }; // extent 10 per axis; 50% slab = 5 cells

test("B: named parts are geometric slabs of the bounds (fraction 0.5)", () => {
  assert.deepEqual(resolveNamedRegion(CUBE, "top"), { min: [0, 5, 0], max: [9, 9, 9] });
  assert.deepEqual(resolveNamedRegion(CUBE, "bottom"), { min: [0, 0, 0], max: [9, 4, 9] });
  // x and z extents are equal → major axis = x (axis 0); front = x-high, back = x-low
  assert.deepEqual(resolveNamedRegion(CUBE, "front"), { min: [5, 0, 0], max: [9, 9, 9] });
  assert.deepEqual(resolveNamedRegion(CUBE, "back"), { min: [0, 0, 0], max: [4, 9, 9] });
  // core = central 5-cube on every axis
  assert.deepEqual(resolveNamedRegion(CUBE, "core"), { min: [2, 2, 2], max: [6, 6, 6] });
  assert.throws(() => resolveNamedRegion(CUBE, "head"), /unknown part/);
});

test("B: major axis picks the longer horizontal extent (front follows z when z is longer)", () => {
  const slab = { min: [0, 0, 0], max: [3, 9, 19] }; // z (20) > x (4) → major = z
  assert.deepEqual(resolveNamedRegion(slab, "front"), { min: [0, 0, 10], max: [3, 9, 19] });
  assert.deepEqual(resolveNamedRegion(slab, "left"), { min: [0, 0, 0], max: [1, 9, 19] }); // minor = x
});

test("B: where keyword-scans the vocabulary; empty/unknown → whole bounds; synonyms map", () => {
  assert.deepEqual(resolveWhereRegion(CUBE, ""), CUBE);
  assert.deepEqual(resolveWhereRegion(CUBE, "the focal point looks muddy"), CUBE); // no keyword
  // single keyword
  assert.deepEqual(resolveWhereRegion(CUBE, "the upper portion"), resolveNamedRegion(CUBE, "top"));
  // synonym: "base" → bottom
  assert.deepEqual(resolveWhereRegion(CUBE, "near the base"), resolveNamedRegion(CUBE, "bottom"));
  // duplicate/synonym keywords dedup to a single slab ("base" and "bottom" → one bottom slab)
  assert.deepEqual(resolveWhereRegion(CUBE, "the bottom base"), resolveNamedRegion(CUBE, "bottom"));
  // multiple distinct keywords → the UNION (bounding box) of their slabs — conservative, never empty
  // top = y[5..9] all x,z ; core = central 5-cube → union grows the core up to the top face
  assert.deepEqual(resolveWhereRegion(CUBE, "the core, near the top"), {
    min: [0, 2, 0], max: [9, 9, 9],
  });
});

test("B: PART_NAMES is the documented vocabulary", () => {
  assert.ok(PART_NAMES.includes("top") && PART_NAMES.includes("core") && PART_NAMES.includes("front"));
});

// --- Group C: selectRegion --------------------------------------------------

test("C: selectRegion accepts bbox / part / where / raw / string; R is frozen and tagged", () => {
  const Rbox = selectRegion(KOI, { bbox: { min: [-15, 2, -4], max: [-9, 12, 4] } });
  assert.equal(Rbox.schema, REGION_SCHEMA);
  assert.deepEqual(subBoundsOf(Rbox), { min: [-15, 2, -4], max: [-9, 12, 4] });
  assert.ok(Object.isFrozen(Rbox));
  assert.equal(Rbox.placements.length, Rbox.indices.length);
  // raw {min,max} and {bbox} agree
  const Rraw = selectRegion(KOI, { min: [-15, 2, -4], max: [-9, 12, 4] });
  assert.deepEqual(subBoundsOf(Rraw), subBoundsOf(Rbox));
  // part and where both resolve to a sub-box of the build
  const Rtop = selectRegion(KOI, { part: "top" });
  assert.deepEqual(subBoundsOf(Rtop), { min: [-15, 8, -7], max: [16, 15, 7] });
  const Rwhere = selectRegion(KOI, "the top");
  assert.deepEqual(subBoundsOf(Rwhere), subBoundsOf(Rtop));
  assert.throws(() => selectRegion(KOI, { nonsense: 1 }), /unrecognized spec/);
});

test("C: in-region set = placements fully contained in subBounds (and their original indices)", () => {
  const R = selectRegion(KOI, { bbox: { min: [-15, 2, -4], max: [-9, 12, 4] } });
  for (const p of R.placements) {
    assert.ok(boundsContain(subBoundsOf(R), placementBounds(p)), "every in-R placement ⊆ subBounds");
  }
  // a placement just outside the box (e.g. tail near +x) is NOT selected
  for (const i of R.indices) {
    assert.ok(boundsContain(subBoundsOf(R), placementBounds(KOI.placements[i])));
  }
  // indices index back into the original array
  assert.deepEqual(R.placements[0], KOI.placements[R.indices[0]]);
});

// --- Group D: the lock ------------------------------------------------------

const SMALL = artifactWith([
  { op: "fill", from: [0, 0, 0], to: [2, 2, 2], block: "minecraft:white_concrete" }, // index 0 — in a [0..2] box
  { op: "voxel", pos: [10, 0, 0], block: "minecraft:black_concrete" }, // index 1 — far away, out of R
]);

test("D: an in-R edit is permitted and round-trips schema-valid; manifest rebuilds", () => {
  const R = selectRegion(SMALL, { bbox: { min: [0, 0, 0], max: [2, 2, 2] } });
  assert.equal(R.placements.length, 1); // only the [0..2] fill is fully contained
  const edited = applyRegionEdit(SMALL, R, [
    { op: "fill", from: [0, 0, 0], to: [2, 2, 2], block: "minecraft:red_concrete" },
  ]);
  assertArtifact(edited); // passes the AJV gate (AC #2)
  assert.equal(edited.placements.length, 2); // out-of-R voxel kept + edited fill
  assert.ok(edited.palette.manifest.includes("minecraft:red_concrete"));
  assert.ok(edited.palette.manifest.includes("minecraft:black_concrete")); // out-of-R block still declared
});

test("D: an out-of-R edit is REJECTED (RegionEditOutOfBoundsError, located)", () => {
  const R = selectRegion(SMALL, { bbox: { min: [0, 0, 0], max: [2, 2, 2] } });
  // a voxel one cell outside R on +x
  try {
    applyRegionEdit(SMALL, R, [{ op: "voxel", pos: [3, 0, 0], block: "minecraft:red_concrete" }]);
    assert.fail("expected RegionEditOutOfBoundsError");
  } catch (e) {
    assert.ok(e instanceof RegionEditOutOfBoundsError);
    assert.equal(e.code, "region_edit_out_of_bounds");
    assert.deepEqual(e.coord, [3, 0, 0]);
    assert.equal(e.index, 0);
  }
  // a fill that straddles the boundary is rejected on the first stray cell
  assert.throws(
    () => applyRegionEdit(SMALL, R, [{ op: "fill", from: [0, 0, 0], to: [4, 2, 2], block: "minecraft:red_concrete" }]),
    RegionEditOutOfBoundsError,
  );
});

test("D: INVARIANT — every cell outside subBounds is byte-identical before/after", () => {
  const R = selectRegion(KOI, { bbox: { min: [-15, 2, -4], max: [-9, 12, 4] } });
  const before = new Map(expandArtifact(KOI).map((v) => [voxelKey(v.pos), v.block]));
  // recolor the whole in-region set — a maximal in-R edit
  const edited = applyRegionEdit(KOI, R, R.placements.map((p) => ({ ...p, block: "minecraft:black_concrete" })));
  assertArtifact(edited);
  const after = new Map(expandArtifact(edited).map((v) => [voxelKey(v.pos), v.block]));
  const sub = subBoundsOf(R);
  // outside subBounds: identical block id and no appearance/disappearance
  for (const [key, block] of before) {
    const [x, y, z] = key.split(",").map(Number);
    if (!coordInBounds([x, y, z], sub)) {
      assert.equal(after.get(key), block, `outside-R cell ${key} changed`);
    }
  }
  for (const key of after.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    if (!coordInBounds([x, y, z], sub)) assert.ok(before.has(key), `outside-R cell ${key} appeared`);
  }
});

test("D: function-form edit receives the in-region set; empty result throws", () => {
  const R = selectRegion(SMALL, { bbox: { min: [0, 0, 0], max: [2, 2, 2] } });
  let seen = null;
  const edited = applyRegionEdit(SMALL, R, (inR) => { seen = inR; return inR; });
  assert.equal(seen, R.placements);
  assertArtifact(edited);
  // an edit that empties a whole-build region → zero placements → throws
  const Rall = selectRegion(SMALL, { bbox: { min: [-100, -100, -100], max: [100, 100, 100] } });
  assert.throws(() => applyRegionEdit(SMALL, Rall, []), /zero placements/);
});

test("D: PURE — inputs are not mutated", () => {
  const R = selectRegion(SMALL, { bbox: { min: [0, 0, 0], max: [2, 2, 2] } });
  const snapshot = JSON.stringify(SMALL);
  applyRegionEdit(SMALL, R, [{ op: "fill", from: [0, 0, 0], to: [2, 2, 2], block: "minecraft:red_concrete" }]);
  assert.equal(JSON.stringify(SMALL), snapshot, "source artifact unchanged");
});

// --- Group E: reuse boundary (static import scan) --------------------------

test("E: region.mjs's PURE graph imports no GL/render at top level (lazy only)", () => {
  const src = readFileSync(here("./region.mjs"), "utf8");
  // top-level `import ... from "X"` and bare `import "X"` specifiers (NOT dynamic import(...))
  const specs = [];
  const fromRe = /^\s*import\b[^]*?\bfrom\s*["']([^"']+)["']/gm;
  const bareRe = /^\s*import\s*["']([^"']+)["']/gm;
  for (const re of [fromRe, bareRe]) {
    let m;
    while ((m = re.exec(src)) !== null) specs.push(m[1]);
  }
  const DENY = [/render/, /world/, /prismarine/, /\bthree\b/, /headless/, /\bgl\b/, /camera/, /viewer/];
  for (const s of specs) {
    for (const re of DENY) assert.ok(!re.test(s), `top-level import "${s}" must be lazy (matched ${re})`);
  }
  // the render stack must be reached via dynamic import (the GL leaf)
  assert.ok(/await import\(\s*["'][^"']*render\/src\/render\.mjs/.test(src), "observeRegion lazy-imports render");
});
