// Tests for the aperture-carve core (T-194-01, story S-194, epic E-51) — the charter narrowing that lets the
// loop CARVE a DECLARED opening. PURE: the carve target + the aperture-coherence gate are deterministic
// geometry, so they gate `npm test` (the metered climb does not). The gate is what makes the relaxation SAFE —
// these tests are the recorded discriminator between an OPENING and a HOLE.
//
// Fixture: a fully-closed stone box (all six faces solid) with a 1-wide vertical slot on the −x face — the
// declared narrow door the climb stalled on. The closed box makes closureCheck meaningful (an interior to
// breach). The declared-aperture record carries exactly the fields carveTargetCells reads (dir, cells).

import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "./occupancy.mjs";
import { closureCheck } from "./shell-integrity.mjs";
import { frameArchPlacements } from "./arch-frame.mjs";
import {
  carveTargetCells, carvedVoidCoherence, archedVoidCoherence, apertureCoherenceGate, carveAperture,
  apertureColumns, APERTURE_CARVE_SCHEMA,
} from "./aperture-carve.mjs";

// A closed box x,z∈[0..6], y∈[0..6] (all six faces solid), with a 1-wide slot on the −x wall (x=0) at z=3,
// y∈[1..4]. Returns {occ, aperture} — aperture.cells are the slot's air cells in world {au=z, av=y}.
function closedBoxWithSlot({ slotZ = 3, slotYLo = 1, slotYHi = 4 } = {}) {
  const N = 6;
  const slot = new Set();
  for (let y = slotYLo; y <= slotYHi; y++) slot.add(`${slotZ},${y}`); // (z,y) holes on the x=0 face
  const cells = [];
  for (let x = 0; x <= N; x++) for (let y = 0; y <= N; y++) for (let z = 0; z <= N; z++) {
    const onFace = x === 0 || x === N || y === 0 || y === N || z === 0 || z === N;
    if (!onFace) continue;                                   // hollow interior
    if (x === 0 && slot.has(`${z},${y}`)) continue;          // the slot = air on the −x face
    cells.push({ pos: [x, y, z], block: "stone_bricks" });
  }
  const occ = occupancyFromCells(cells);
  const apCells = [];
  for (let y = slotYLo; y <= slotYHi; y++) apCells.push({ au: slotZ, av: y });
  return { occ, aperture: { kind: "door", dir: "-x", cells: apCells } };
}

const BAND = { floor: 0, eaveY: 6 };

// ---- AC1: carveTargetCells widens the slot, centred, at the wall plane (depth:"plane"); only solid removed ----
test("AC1 carveTargetCells widens the declared slot to T, centred, removing only wall (plane)", () => {
  const { occ, aperture } = closedBoxWithSlot();
  const { remove, target, widenedRegion } = carveTargetCells(occ, aperture, { programW: 4, scale: 1, depth: "plane" });
  assert.equal(target.width, 5, "programW 4 clamps up to minArchWidth 5");
  assert.equal(target.uLo, 1); assert.equal(target.uHi, 5); // centred on z=3
  assert.equal(target.wStar, 0, "wall plane is x=0");
  // every removed key is a previously-solid wall cell inside the widened region
  for (const k of remove) {
    const [x, y, z] = k.split(",").map(Number);
    assert.ok(occ.solid(x, y, z), "only solid wall removed");
    assert.ok(x >= widenedRegion.min[0] && x <= widenedRegion.max[0] &&
              y >= widenedRegion.min[1] && y <= widenedRegion.max[1] &&
              z >= widenedRegion.min[2] && z <= widenedRegion.max[2], "removed inside the widened region");
  }
  // the slot column (z=3) was already air → not in remove; the four flanking columns are
  assert.ok(![...remove].some((k) => k.split(",")[2] === "3"), "the existing slot air is not re-removed");
  assert.equal([...remove].filter((k) => k.split(",")[2] === "1").length, 4, "z=1 column (4 cells) carved");
});

// ---- AC1b: the DEFAULT carve is a TUNNEL — it removes the full passage depth (both faces), region spans w ----
test("AC1b the default tunnel carve removes the full passage depth", () => {
  const { occ, aperture } = closedBoxWithSlot();
  const { remove, target, widenedRegion } = carveTargetCells(occ, aperture, { programW: 4, scale: 1 });
  assert.equal(widenedRegion.min[0], 0); assert.equal(widenedRegion.max[0], 6); // full x-depth
  const xs = new Set([...remove].map((k) => Number(k.split(",")[0])));
  assert.ok(xs.has(0) && xs.has(6), "both the near and far wall are carved (a through-passage)");
});

// ---- AC2: the gate PASSES a clean carve — scope, coherent, closure all ok ----
test("AC2 apertureCoherenceGate accepts a clean wide carve", () => {
  const { occ, aperture } = closedBoxWithSlot();
  const { remove, target } = carveTargetCells(occ, aperture, { programW: 4, scale: 1 });
  const after = carveAperture(occ, remove);
  const gate = apertureCoherenceGate(occ, after, target, BAND);
  assert.equal(gate.ok, true, gate.reason ?? "should accept");
  assert.equal(gate.scope.ok, true);
  assert.equal(gate.coherent.single, true);
  assert.equal(gate.coherent.continuous, true);
  assert.equal(gate.closure.ok, true);
});

// ---- AC3: the gate FAILS a ragged carve — a split void (notch + two components) reads as a HOLE ----
test("AC3 apertureCoherenceGate rejects a ragged carve (notched + multi-component)", () => {
  const { occ, aperture } = closedBoxWithSlot();
  const { remove, target } = carveTargetCells(occ, aperture, { programW: 4, scale: 1 });
  // leave the centre column (z=3) SOLID after carving → splits the void into left/right + notches z=3
  const ragged = new Set([...remove].filter((k) => k.split(",")[2] !== "3"));
  // and the original slot at z=3 must be re-filled so the column is fully solid (simulate a botched carve)
  const cells = [];
  for (const [k, b] of occ.cells) if (!ragged.has(k)) cells.push({ pos: k.split(",").map(Number), block: b });
  for (let y = target.vLo; y <= target.vHi; y++) cells.push({ pos: [0, y, 3], block: "stone_bricks" });
  const after = occupancyFromCells(cells);
  const gate = apertureCoherenceGate(occ, after, target, BAND);
  assert.equal(gate.coherent.single, false, "two void components");
  assert.equal(gate.coherent.continuous, false, "z=3 column notched");
  assert.equal(gate.ok, false);
  assert.match(gate.reason, /ragged/);
});

// ---- AC4: the gate FAILS a scope leak — a removed cell on a NON-aperture wall ----
test("AC4 apertureCoherenceGate rejects a carve that leaks outside the declared aperture", () => {
  const { occ, aperture } = closedBoxWithSlot();
  const { remove, target } = carveTargetCells(occ, aperture, { programW: 4, scale: 1 });
  // a clean carve PLUS one removed cell on the z=0 wall (z=0 is outside the aperture's z∈[1..5] span — a
  // genuine NON-aperture surface, regardless of the tunnel's full x-depth region)
  const leaky = carveAperture(occ, remove);
  const cells = [];
  for (const [k, b] of leaky.cells) if (k !== "3,3,0") cells.push({ pos: k.split(",").map(Number), block: b });
  const after = occupancyFromCells(cells);
  const gate = apertureCoherenceGate(occ, after, target, BAND);
  assert.equal(gate.scope.ok, false, "the z=0 removal must be flagged as a leak");
  assert.ok(gate.scope.leaked.includes("3,3,0"));
  assert.equal(gate.ok, false);
  assert.match(gate.reason, /leaked outside/);
});

// ---- AC5: closure-EXCEPT-aperture — the wide opening reads CLOSED only WITH the aperture as allow-region ----
test("AC5 the carved opening is a breach without the allow-region, closed with it (closure-except-aperture)", () => {
  const { occ, aperture } = closedBoxWithSlot();
  const { remove, target } = carveTargetCells(occ, aperture, { programW: 4, scale: 1 });
  const after = carveAperture(occ, remove);
  // WITHOUT the declared aperture as honorary skin, the 5-wide hole is an open breach
  assert.equal(closureCheck(after, { regions: [] }).closed, false, "the wide opening is a breach on its own");
  // WITH the declared aperture region, closure holds (it is an intentional opening, not a hole)
  assert.equal(closureCheck(after, { regions: [target.widenedRegion] }).closed, true, "closed except at the aperture");
  // and the gate's closure conjunct reflects that
  assert.equal(apertureCoherenceGate(occ, after, target, BAND).closure.ok, true);
});

// ---- AC6: PURE / byte-stable — two runs give the identical (sorted) removal + deterministic verdict ----
test("AC6 carveTargetCells + gate are byte-stable across runs", () => {
  const a = closedBoxWithSlot(), b = closedBoxWithSlot();
  const ra = carveTargetCells(a.occ, a.aperture, { programW: 4, scale: 1 });
  const rb = carveTargetCells(b.occ, b.aperture, { programW: 4, scale: 1 });
  assert.deepEqual([...ra.remove].sort(), [...rb.remove].sort());
  const ga = apertureCoherenceGate(a.occ, carveAperture(a.occ, ra.remove), ra.target, BAND);
  const gb = apertureCoherenceGate(b.occ, carveAperture(b.occ, rb.remove), rb.target, BAND);
  assert.equal(ga.ok, gb.ok);
  assert.equal(APERTURE_CARVE_SCHEMA, "aperture-carve/v1");
});

// ---- AC7: a too-narrow declared width still clamps UP so an arch is always buildable once we carve ----
test("AC7 a sub-minArchWidth declared width clamps up to minArchWidth", () => {
  const { occ, aperture } = closedBoxWithSlot();
  const { target } = carveTargetCells(occ, aperture, { programW: 2, scale: 1 });
  assert.equal(target.width, 5, "programW 2 clamps up to minArchWidth 5 (arch always buildable)");
});

// ---- AC8: carvedVoidCoherence in isolation — a clean box void is single + continuous ----
test("AC8 carvedVoidCoherence reports single+continuous on a clean carve", () => {
  const { occ, aperture } = closedBoxWithSlot();
  const { remove, target } = carveTargetCells(occ, aperture, { programW: 4, scale: 1 });
  const c = carvedVoidCoherence(carveAperture(occ, remove), target);
  assert.equal(c.single, true);
  assert.equal(c.continuous, true);
  assert.equal(c.components, 1);
});

// ===== T-203-01 (S-203, E-52): the wide-arch REBUILD — arch-aware coherence + closure-except-aperture =====
// The capstone failure (T-201): carve_arch carved a CLEAN wide rectangle then ADDED a voxel arch ring, and the
// SAME full-height coherence check refuted the arch spandrels as "notched columns 3,4,8,9". These tests run the
// REAL frameArchPlacements/archRing geometry (not a mock) and prove the arch-aware gate KEEPS what carve_arch
// could not, while still refuting a true passage blockage.

const cellsOf = (occ) => [...occ.cells].map(([k, b]) => ({ pos: k.split(",").map(Number), block: b }));

/** Mirror the picture-climb rebuild_arch hand on a synthetic box: carve the wide tunnel, then dress with the
 *  REAL frame + arch ring. Returns { target, carved, dressed, spring }. */
function archedRebuild(occ, aperture, programW = 5) {
  const { remove, target } = carveTargetCells(occ, aperture, { programW, scale: 1 });
  const carved = carveAperture(occ, remove);
  // the wide aperture record (mirrors picture-climb apertureFromTarget)
  const cells = [], flanks = { left: [], right: [] }, lintel = [];
  for (let av = target.vLo; av <= target.vHi; av++) for (let au = target.uLo; au <= target.uHi; au++) cells.push({ au, av });
  for (let av = target.vLo; av <= target.vHi; av++) { flanks.left.push({ au: target.uLo - 1, av }); flanks.right.push({ au: target.uHi + 1, av }); }
  for (let au = target.uLo - 1; au <= target.uHi + 1; au++) lintel.push({ au, av: target.vHi + 1 });
  const wideAp = { kind: "door", dir: target.dir, cells, flanks, lintel };
  const { placements } = frameArchPlacements(carved, [wideAp], { frameBlock: "dark_oak_log" });
  const dressed = occupancyFromCells([...cellsOf(carved), ...placements.map((p) => ({ pos: p.pos, block: p.block }))]);
  const radius = target.width / 2;
  const spring = Math.max(target.vLo + 1, target.vHi - Math.floor(radius));
  return { target, carved, dressed, spring };
}

// A wider closed box so a width-5 arch fits (z,y∈[0..8]); 1-wide slot on −x at z=4, y∈[1..4].
function wideClosedBoxWithSlot() {
  const N = 8, slotZ = 4, slotYLo = 1, slotYHi = 4;
  const slot = new Set();
  for (let y = slotYLo; y <= slotYHi; y++) slot.add(`${slotZ},${y}`);
  const cells = [];
  for (let x = 0; x <= N; x++) for (let y = 0; y <= N; y++) for (let z = 0; z <= N; z++) {
    const onFace = x === 0 || x === N || y === 0 || y === N || z === 0 || z === N;
    if (!onFace) continue;
    if (x === 0 && slot.has(`${z},${y}`)) continue;
    cells.push({ pos: [x, y, z], block: "stone_bricks" });
  }
  const apCells = [];
  for (let y = slotYLo; y <= slotYHi; y++) apCells.push({ au: slotZ, av: y });
  return { occ: occupancyFromCells(cells), aperture: { kind: "door", dir: "-x", cells: apCells } };
}
const WIDE_BAND = { floor: 0, eaveY: 8 };

// ---- AR1: arch-aware coherence credits the spandrels the legacy full-height check refutes (same build) ----
test("AR1 archedVoidCoherence: single+passageContinuous+headBuilt where carvedVoidCoherence reads notched", () => {
  const { occ, aperture } = wideClosedBoxWithSlot();
  const { dressed, target, spring } = archedRebuild(occ, aperture);
  const arched = archedVoidCoherence(dressed, target, { spring });
  assert.equal(arched.single, true, "the arched void is one component");
  assert.equal(arched.passageContinuous, true, "the rectangular passage below the spring is clean");
  assert.equal(arched.headBuilt, true, "an arch head (spandrels) was built above the spring");
  // the SAME build read by the legacy full-height check: the spandrels read as notches (the T-201 bug)
  const legacy = carvedVoidCoherence(dressed, target);
  assert.equal(legacy.continuous, false, "legacy full-height continuity refutes the arch spandrels");
  assert.ok(legacy.notches.length > 0, "the notched columns are the arch's end (spandrel) columns");
});

// ---- AR2: the gate ACCEPTS the rebuilt arch with arch:{spring}, and REFUTES it without (the exact regression) ----
test("AR2 apertureCoherenceGate accepts the arched rebuild with arch:{spring}, refutes it without", () => {
  const { occ, aperture } = wideClosedBoxWithSlot();
  const { dressed, target, spring } = archedRebuild(occ, aperture);
  const archGate = apertureCoherenceGate(occ, dressed, target, { ...WIDE_BAND, arch: { spring } });
  assert.equal(archGate.ok, true, archGate.reason ?? "arch-aware gate should accept the rebuilt arch");
  assert.equal(archGate.scope.ok, true);
  assert.equal(archGate.closure.ok, true);
  const legacyGate = apertureCoherenceGate(occ, dressed, target, WIDE_BAND);
  assert.equal(legacyGate.ok, false, "the legacy full-height gate refutes the arch (the T-201 fallback)");
  assert.match(legacyGate.reason, /ragged/);
});

// ---- AR3: a real blockage BELOW the spring is still refuted, even with arch (the gate is not blinded) ----
test("AR3 apertureCoherenceGate(arch) still refutes a solid blockage in the passage", () => {
  const { occ, aperture } = wideClosedBoxWithSlot();
  const { dressed, target, spring } = archedRebuild(occ, aperture);
  // re-fill one passage cell at the wall plane (av=1 ≤ spring) — a botched carve / blockage
  const blocked = occupancyFromCells([...cellsOf(dressed), { pos: [target.wStar, 1, target.uLo + 1], block: "stone_bricks" }]);
  const c = archedVoidCoherence(blocked, target, { spring });
  assert.equal(c.passageContinuous, false, "the passage blockage is a notch below the spring");
  const gate = apertureCoherenceGate(occ, blocked, target, { ...WIDE_BAND, arch: { spring } });
  assert.equal(gate.ok, false);
  assert.match(gate.reason, /blocked passage/);
});

// ---- AR5: PURE / byte-stable — two rebuilds give the identical dressed cells + identical verdict ----
test("AR5 the arched rebuild + arch gate are byte-stable across runs; apertureColumns covers the tunnel", () => {
  const a = wideClosedBoxWithSlot(), b = wideClosedBoxWithSlot();
  const ra = archedRebuild(a.occ, a.aperture), rb = archedRebuild(b.occ, b.aperture);
  assert.deepEqual([...ra.dressed.cells.keys()].sort(), [...rb.dressed.cells.keys()].sort());
  const ga = apertureCoherenceGate(a.occ, ra.dressed, ra.target, { ...WIDE_BAND, arch: { spring: ra.spring } });
  const gb = apertureCoherenceGate(b.occ, rb.dressed, rb.target, { ...WIDE_BAND, arch: { spring: rb.spring } });
  assert.equal(ga.ok, gb.ok);
  // the declared-open aperture columns (a through-tunnel ⇒ the full u-span × w-depth footprint)
  const cols = apertureColumns(ra.target);
  assert.ok(cols.size > 0 && [...cols].every((c) => /^\d+,\d+$/.test(c)), "apertureColumns are x,z keys");
});
