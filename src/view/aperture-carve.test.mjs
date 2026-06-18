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
import {
  carveTargetCells, carvedVoidCoherence, apertureCoherenceGate, carveAperture, APERTURE_CARVE_SCHEMA,
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
