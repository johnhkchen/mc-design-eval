// Unit tests — opening-head reconstruction under the cage (T-105-01). Synthetic walls with
// hand-written component-record fragments: the arch carve/fill window discipline, flat squaring,
// the fixpoint no-op, the Rule 1 honest-miss path (no edits), depth measurement at the flanking
// columns, and the T-097/E-25 integration case — a DRESSED aperture below a reconstructed arch
// run through the FULL T-102 cage: step accepted, closure no-regress, dressing byte-identical,
// states carried through rebuildArtifact. Plus the rollback path: a zero-tolerance cage rejects
// the reconstruction and the input occupancy stands.

import test from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { rebuildArtifact } from "./shell-integrity.mjs";
import { regularizeShell, voxelSilhouettes } from "./shell-regularize.mjs";
import { MULTI_ANGLE_GATE } from "../config.mjs";
import {
  RECONSTRUCT_DEFAULTS, openingDepthRun, reconstructOpeningHeads, openingHeadStep,
} from "./opening-reconstruct.mjs";

const refsOf = (occ) => voxelSilhouettes(occ, MULTI_ANGLE_GATE.azimuths);

/** A 2-thick wall (x∈{0,1}, z∈[−8,8], y∈[0,16]) with an aperture carved per `tops` (z → topY). */
function wall(tops, extras = []) {
  const cells = [];
  for (let x = 0; x <= 1; x++) {
    for (let z = -8; z <= 8; z++) {
      for (let y = 0; y <= 16; y++) {
        const t = tops[String(z)];
        if (t !== undefined && y <= t) continue;
        cells.push({ pos: [x, y, z], block: "stone_bricks" });
      }
    }
  }
  return occupancyFromCells([...cells, ...extras]);
}

const archOpening = (tops) => ({
  extent: { axis: "z", range: [-2, 2] }, sillY: 0, crown: Math.max(...tops), width: 5,
  height: Math.max(...tops) + 1,
  jambs: [{ at: -2, y0: 0, y1: tops[0] }, { at: 2, y0: 0, y1: tops[4] }],
  headProfile: tops.map((topY, i) => ({ at: i - 2, topY })),
  archCandidate: true, spring: Math.max(...tops),
});
const recordOf = (opening) => ({ openingGroups: [{ id: "og-t", dir: "+x", openings: [opening] }] });

const DOME = [6, 8, 8, 8, 6];          // the recorded head profile (near-circular, fits as arch)
// The wall diverges from the profile at the center column — a sampled blob hangs into the head
// (solid at y 7..8 where the fitted arc says aperture): forces CARVING; the corner columns'
// over-tall air above the arc forces FILLING. Both edit kinds in one case.
const BLOBBED = { "-2": 6, "-1": 8, 0: 6, 1: 8, 2: 6 };
const topsOf = (arr) => Object.fromEntries(arr.map((t, i) => [String(i - 2), t]));

// --- openingDepthRun ---------------------------------------------------------------------------

test("openingDepthRun: measures the wall thickness at the FLANKING columns (jamb columns are air)", () => {
  const occ = wall(topsOf(DOME));
  assert.deepEqual(openingDepthRun(occ, archOpening(DOME), "+x"), { axis: "x", range: [0, 1] });
  // span axis must differ from the depth axis; missing geometry is the honest null
  assert.equal(openingDepthRun(occ, archOpening(DOME), "+z"), null);
  assert.equal(openingDepthRun(occ, { extent: { axis: "z", range: [-2, 2] } }, "+x"), null);
});

// --- reconstruction ----------------------------------------------------------------------------

test("arch reconstruction: window discipline — disc carved open, ring solid, outside untouched", () => {
  const occ = wall(BLOBBED);
  const r = reconstructOpeningHeads(occ, recordOf(archOpening(DOME)));
  const e = r.openings[0];
  assert.equal(e.kind, "arch");
  assert.ok(e.fitError.rmse <= 0.8);
  assert.ok(r.carved > 0, "the notched column must be carved open");
  assert.ok(r.filled > 0, "the over-tall corners must be squared solid");
  // every window cell obeys the fitted disc (both depth layers)
  const [u0, y0] = e.spec.center, rad = e.spec.radius;
  for (let x = 0; x <= 1; x++) {
    for (let z = -2; z <= 2; z++) {
      for (let y = e.spec.yRange[0]; y <= e.spec.yRange[1]; y++) {
        const inside = y < y0 ? true : (z - u0) ** 2 + (y - y0) ** 2 <= rad * rad;
        assert.equal(r.occ.solid(x, y, z), !inside, `(${x},${y},${z})`);
      }
    }
  }
  // outside the window: byte-identical
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (z >= -2 && z <= 2 && y >= e.spec.yRange[0] && y <= e.spec.yRange[1]) continue;
    assert.equal(r.occ.cells.get(key), block, key);
  }
  // dressing-pass labels present, fill blocks derived from the wall (never a constant)
  assert.ok(e.headCells.length > 0 && e.jambCells.length > 0);
  for (const [, block] of r.occ.cells) assert.equal(block, "stone_bricks");
  // deterministic
  const r2 = reconstructOpeningHeads(occ, recordOf(archOpening(DOME)));
  assert.deepEqual([...r.occ.cells], [...r2.occ.cells]);
  assert.deepEqual(r.openings, r2.openings);
});

test("flat squaring, fixpoint no-op, and the Rule 1 no-edit path", () => {
  // non-candidate ragged head [10,10,11,10] → squared to the modal level 10 (fill at y=11)
  const tops = { "-1": 10, 0: 10, 1: 11, 2: 10 };
  const occ = wall(tops);
  const flat = {
    extent: { axis: "z", range: [-1, 2] }, sillY: 0, crown: 11, width: 4, height: 12,
    jambs: [{ at: -1, y0: 0, y1: 10 }, { at: 2, y0: 0, y1: 10 }],
    headProfile: [{ at: -1, topY: 10 }, { at: 0, topY: 10 }, { at: 1, topY: 11 }, { at: 2, topY: 10 }],
    archCandidate: false, spring: null,
  };
  const r = reconstructOpeningHeads(occ, { openingGroups: [{ id: "og-f", dir: "+x", openings: [flat] }] });
  assert.equal(r.openings[0].kind, "flat");
  assert.equal(r.openings[0].spec.level, 10);
  assert.equal(r.carved, 0);
  assert.equal(r.filled, 2); // the over-tall column plugged at y=11, both depth layers
  assert.ok(r.occ.solid(0, 11, 1) && r.occ.solid(1, 11, 1));

  // already-flat → recorded no-op, zero edits (the supplying op is a no-op on a clean head)
  const flatTops = { "-1": 9, 0: 9, 1: 9 };
  const clean = wall(flatTops);
  const noop = reconstructOpeningHeads(clean, {
    openingGroups: [{
      id: "og-n", dir: "+x",
      openings: [{
        extent: { axis: "z", range: [-1, 1] }, sillY: 0, crown: 9, width: 3, height: 10,
        jambs: [{ at: -1, y0: 0, y1: 9 }, { at: 1, y0: 0, y1: 9 }],
        headProfile: [{ at: -1, topY: 9 }, { at: 0, topY: 9 }, { at: 1, topY: 9 }],
        archCandidate: false, spring: null,
      }],
    }],
  });
  assert.equal(noop.openings[0].noop, true);
  assert.equal(noop.carved + noop.filled, 0);
  assert.deepEqual([...noop.occ.cells], [...clean.cells]);

  // an unfittable candidate (too narrow) → kind none, NO edits — the sampled head stays
  const narrow = reconstructOpeningHeads(clean, {
    openingGroups: [{
      id: "og-x", dir: "+x",
      openings: [{
        extent: { axis: "z", range: [-1, 1] }, width: 3, sillY: 0, crown: 9,
        jambs: [{ at: -1, y0: 0, y1: 8 }, { at: 1, y0: 0, y1: 8 }],
        headProfile: [{ at: -1, topY: 8 }, { at: 0, topY: 9 }, { at: 1, topY: 8 }],
        archCandidate: true, spring: 9,
      }],
    }],
  });
  assert.equal(narrow.openings[0].kind, "none");
  assert.equal(narrow.openings[0].findings[0].code, "arch-too-narrow");
  assert.deepEqual([...narrow.occ.cells], [...clean.cells]);
});

// --- the T-097/E-25 integration case: dressed aperture under the FULL cage ----------------------

const TRAPDOOR_STATE = Object.freeze({ facing: "south", half: "bottom", open: "true" });
const dressedWall = (tops) => wall(tops, [-1, 0, 1].flatMap((z) => [0, 1, 2].map((y) => ({
  pos: [0, y, z], block: "spruce_trapdoor", form: "fixture", state: { ...TRAPDOOR_STATE },
}))));

test("caged integration: arch over a dressed aperture — accepted, dressing byte-identical, states survive rebuild", () => {
  const occ = dressedWall(BLOBBED);
  const step = openingHeadStep(recordOf(archOpening(DOME)));
  const r = regularizeShell(occ, { refSils: refsOf(occ), steps: [step], iouTolerance: 0.05 });
  assert.equal(r.accepted, 1);
  assert.equal(r.rejected, 0);
  assert.equal(r.trace[0].step, "opening-heads");
  assert.ok(r.trace[0].closure.reached <= r.trace[0].closure.inputReached, "closure no-regress");
  // the step's full report is stashed on the adapter
  assert.equal(step.report.openings[0].kind, "arch");
  assert.ok(step.report.carved > 0);
  // dressing preserved whole: block, form, and state byte-identical
  for (const z of [-1, 0, 1]) {
    for (const y of [0, 1, 2]) {
      const key = `0,${y},${z}`;
      assert.equal(r.occ.cells.get(key), "spruce_trapdoor", key);
      assert.equal(r.occ.forms.get(key), "fixture", key);
      assert.deepEqual(r.occ.states.get(key), TRAPDOOR_STATE, key);
    }
  }
  // and the artifact round-trip carries the fixture states (a strip must not undress a window)
  const artifact = rebuildArtifact(r.occ, {
    schema_version: "0.3", metadata: { title: "t" }, style: {}, palette: { manifest: [] },
  });
  const dressed = artifact.placements.filter((p) => p.block === "minecraft:spruce_trapdoor");
  assert.equal(dressed.length, 9);
  assert.ok(dressed.every((p) => p.state.open === "true"));
});

test("caged rollback: a zero-tolerance cage rejects the reconstruction and the input stands", () => {
  const occ = wall(BLOBBED);
  const step = openingHeadStep(recordOf(archOpening(DOME)));
  const r = regularizeShell(occ, { refSils: refsOf(occ), steps: [step], iouTolerance: 0 });
  assert.equal(r.rejected, 1);
  assert.equal(r.trace[0].accepted, false);
  assert.ok(r.trace[0].reasons.some((reason) => reason.startsWith("iou:")));
  assert.deepEqual([...r.occ.cells], [...occ.cells]); // rolled back whole
});

test("protect honored at edit time: protected cells skipped with a named finding, cage still clean", () => {
  const occ = wall(BLOBBED);
  const protect = [{ name: "head", contains: (pos) => pos[1] >= 7 && pos[2] === 0 }];
  const r = reconstructOpeningHeads(occ, recordOf(archOpening(DOME)), { protect });
  assert.ok(r.openings[0].findings.some((f) => f.code === "protected-cell-skipped"));
  for (const [key] of occ.cells) {
    const [, y, z] = key.split(",").map(Number);
    if (y >= 7 && z === 0) assert.equal(r.occ.cells.has(key), true, `protected ${key} must survive`);
  }
});

test("RECONSTRUCT_DEFAULTS declared; ring fills demand support (no lips into open air)", () => {
  assert.ok(Object.isFrozen(RECONSTRUCT_DEFAULTS));
  assert.equal(typeof RECONSTRUCT_DEFAULTS.minRingSupport, "number");
  // an opening whose flat level sits above the wall top would need unsupported fills — they are
  // skipped and named, not silently extruded
  const tops = { "-1": 14, 0: 16, 1: 14 }; // head reaches the wall top at the center column
  const occ = wall(tops);
  const r = reconstructOpeningHeads(occ, {
    openingGroups: [{
      id: "og-e", dir: "+x",
      openings: [{
        extent: { axis: "z", range: [-1, 1] }, sillY: 0, crown: 16, width: 3, height: 17,
        jambs: [{ at: -1, y0: 0, y1: 14 }, { at: 1, y0: 0, y1: 14 }],
        headProfile: [{ at: -1, topY: 14 }, { at: 0, topY: 16 }, { at: 1, topY: 14 }],
        archCandidate: false, spring: null,
      }],
    }],
  });
  // modal level 14: the center column needs fills at y 15..16 — y=17 row would float above the
  // wall; whatever cannot meet minRingSupport is a finding, and nothing lands above the wall top
  for (const [key] of r.occ.cells) assert.ok(Number(key.split(",")[1]) <= 16, key);
});
