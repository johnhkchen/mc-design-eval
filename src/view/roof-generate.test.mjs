// Unit tests for roof-generate.mjs (T-104-01, story S-104, epic E-27) — synthetic gables only.
import { test } from "node:test";
import assert from "node:assert/strict";

import { CARD_ROWS } from "../form/fixture-card.mjs";
import { STAIR_FACING, roofFamily, roofHeightfield, generateRoof, stairShape, gableEndColumns, roofMaterialFraction, gableRidgeForRatio } from "./roof-generate.mjs";
import { closureOf } from "./wall-generate.mjs";

const VOCAB = new Set([
  "spruce_planks", "spruce_stairs", "spruce_slab",
  "deepslate_bricks", "deepslate_brick_stairs", "deepslate_brick_slab",
]);

/** A minimal sane gable: ridge along z at x=0, eaves at x=±E, symmetric pitch. */
function gable({ pitch = 1, eaveY = 10, ridgeY = 14, E = 4, z0 = 0, z1 = 5, hip = null } = {}) {
  const cols = new Set();
  for (let x = -E; x <= E; x++) for (let z = z0; z <= z1; z++) cols.add(`${x},${z}`);
  return {
    id: "gable-test",
    ridge: { axis: "z", y: ridgeY },
    sides: [
      { planeId: "roof-a", eaveDir: "+x", pitch, pitchSource: "glb", eaveY, eaveEdge: E, extentCells: [] },
      { planeId: "roof-b", eaveDir: "-x", pitch, pitchSource: "glb", eaveY, eaveEdge: -E, extentCells: [] },
    ],
    footprint: { cols, bbox: { minX: -E, maxX: E, minZ: z0, maxZ: z1 }, area: cols.size },
    hip: hip ?? { demanded: false, lo: false, hi: false },
    sane: true,
    reasons: [],
  };
}

const SPRUCE = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab", findings: [] };
const byPos = (cells) => new Map(cells.map((c) => [c.pos.join(","), c]));

test("roofFamily derives and vocabulary-checks the kit course family", () => {
  const planks = roofFamily([{ block: "spruce_planks", role: "roof field", formClass: "cube", whereUsed: ["roof"] }], VOCAB);
  assert.deepEqual([planks.field, planks.stairs, planks.slab], ["spruce_planks", "spruce_stairs", "spruce_slab"]);
  const bricks = roofFamily([{ block: "deepslate_bricks", role: "roof field (sloped courses)", formClass: "cube", whereUsed: ["roof"] }], VOCAB);
  assert.deepEqual([bricks.field, bricks.stairs, bricks.slab], ["deepslate_bricks", "deepslate_brick_stairs", "deepslate_brick_slab"]);
  // fixture rows never name the family; a missing shaped block is a named finding, not an invention
  const odd = roofFamily([
    { block: "stone_brick_stairs", role: "roof eaves", formClass: "fixture", whereUsed: ["roof"] },
    { block: "sponge", role: "roof field", formClass: "cube", whereUsed: ["roof"] },
  ], VOCAB);
  assert.equal(odd.field, "sponge");
  assert.equal(odd.stairs, null);
  assert.ok(odd.findings.some((f) => f.code === "kit-roof-stairs-missing"));
  const none = roofFamily([{ block: "oak_planks", role: "floor", formClass: "cube", whereUsed: ["band1"] }], VOCAB);
  assert.equal(none.field, null);
  assert.ok(none.findings.some((f) => f.code === "kit-roof-field-missing"));
});

test("pitch 1: the whole slope is stair courses facing the ridge", () => {
  const g = gable({ pitch: 1 });
  const { cells, counts } = generateRoof([g], SPRUCE);
  const m = byPos(cells);
  // column x=3 (one in from the +x eave): h = 10+1 = 11, uphill is −x → facing west
  const top = m.get("3,11,0");
  assert.equal(top.block, "spruce_stairs");
  assert.deepEqual(top.state, { facing: "west", half: "bottom", shape: "straight" });
  assert.equal(top.form, "fixture");
  // mirrored side faces east
  assert.deepEqual(m.get("-3,11,0").state.facing, "east");
  // the eave course itself is a stair (downhill neighbor is off the footprint)
  assert.equal(m.get("4,10,0").block, "spruce_stairs");
  // the ridge cap is a full block (no downhill — owner is the ridge)
  assert.equal(m.get("0,14,0").block, "spruce_planks");
  assert.ok(counts.stairs > 0 && counts.slabs === 0);
});

test("pitch 0.5: slab half-steps, no stairs on half landings", () => {
  const g = gable({ pitch: 0.5, ridgeY: 12 });
  const { cells, counts } = generateRoof([g], SPRUCE);
  const m = byPos(cells);
  // x=3: h = 10.5 → solid to 10, slab type:bottom at 11
  const slab = m.get("3,11,0");
  assert.equal(slab.block, "spruce_slab");
  assert.deepEqual(slab.state, { type: "bottom" });
  assert.equal(m.get("3,10,0").block, "spruce_planks");
  // x=2: h = 11 whole — but uphill neighbor is 11.5 (< h+1) → full block, not a stair
  assert.equal(m.get("2,11,0").block, "spruce_planks");
  assert.ok(counts.slabs > 0 && counts.stairs === 0);
});

test("pitch 2: full blocks carry the riser, stair only at the tread edge", () => {
  const g = gable({ pitch: 2, ridgeY: 18 });
  const { cells } = generateRoof([g], SPRUCE);
  const m = byPos(cells);
  // x=3: h = 12; downhill (x=4) h=10 ≤ 11, uphill (x=2) h=14 ≥ 13 → stair tread at 12
  assert.equal(m.get("3,12,0").block, "spruce_stairs");
  // the riser below the tread is solid field
  assert.equal(m.get("3,11,0").block, "spruce_planks");
  assert.equal(m.get("3,10,0").block, "spruce_planks");
});

test("solid infill: no air inside the wedge, footprint containment, legal states", () => {
  const g = gable({ pitch: 1 });
  const { cells, heights, bandFloor } = generateRoof([g], SPRUCE);
  const m = byPos(cells);
  for (const [key, h] of heights) {
    const [x, z] = key.split(",").map(Number);
    for (let y = bandFloor; y <= Math.floor(h); y++) {
      assert.ok(m.has(`${x},${y},${z}`), `void at ${x},${y},${z} under h=${h}`);
    }
  }
  const stairProps = new Set(["facing", "half", "shape"]);
  const stairVals = { facing: new Set(Object.values(STAIR_FACING)), half: new Set(["bottom", "top"]), shape: new Set(["straight"]) };
  for (const c of cells) {
    assert.ok(g.footprint.cols.has(`${c.pos[0]},${c.pos[2]}`), `cell outside footprint: ${c.pos}`);
    if (c.block.endsWith("_stairs")) {
      assert.deepEqual(new Set(Object.keys(c.state)), stairProps);
      for (const [k, v] of Object.entries(c.state)) assert.ok(stairVals[k].has(v), `${k}=${v}`);
    }
    if (c.block.endsWith("_slab")) assert.deepEqual(c.state, { type: "bottom" });
  }
  // the CARD_ROWS vocabulary covers every state shape we emit (the proven T-097 path)
  const cardStair = CARD_ROWS.find((r) => r.family === "stairs");
  assert.deepEqual(Object.keys(cardStair.state).sort(), [...stairProps].sort());
});

test("two intersecting gables: max-height composition makes the valley", () => {
  const main = gable({ pitch: 1, eaveY: 10, ridgeY: 14, E: 4, z0: 0, z1: 9 });
  // cross gable: ridge along x at z=4..5 region, lower ridge
  const cols = new Set();
  for (let x = 0; x <= 6; x++) for (let z = 2; z <= 7; z++) cols.add(`${x},${z}`);
  const cross = {
    id: "gable-cross",
    ridge: { axis: "x", y: 13 },
    sides: [
      { planeId: "roof-c", eaveDir: "+z", pitch: 1, pitchSource: "glb", eaveY: 10, eaveEdge: 7, extentCells: [] },
      { planeId: "roof-d", eaveDir: "-z", pitch: 1, pitchSource: "glb", eaveY: 10, eaveEdge: 2, extentCells: [] },
    ],
    footprint: { cols, bbox: { minX: 0, maxX: 6, minZ: 2, maxZ: 7 }, area: cols.size },
    hip: { demanded: false, lo: false, hi: false },
    sane: true, reasons: [],
  };
  const { heights, owner } = roofHeightfield([main, cross]);
  // far from the main ridge (x=6), the cross gable is the only cover
  assert.equal(heights.get("6,4"), 12); // min(ridge 13, −z side 10+1·(4−2)=12, +z side 10+1·(7−4)=13)
  assert.equal(owner.get("6,4").gableId, "gable-cross");
  // near the main ridge the main gable wins (h=14 at x=0)
  assert.equal(heights.get("0,4"), 14);
  assert.equal(owner.get("0,4").gableId, "gable-test");
});

test("hip ends slope down at the gable pitch when demanded", () => {
  const g = gable({ pitch: 1, eaveY: 10, ridgeY: 14, E: 4, z0: 0, z1: 9,
    hip: { demanded: true, lo: true, hi: true } });
  const { heights } = roofHeightfield([g]);
  assert.equal(heights.get("0,0"), 10);  // ridge column at the lo end pulled to the hip eave
  assert.equal(heights.get("0,4"), 14);  // mid-ridge unaffected
  assert.equal(heights.get("0,9"), 10);  // hi end
});

test("missing slab in the family floors half-steps; missing stairs keep full blocks", () => {
  const g = gable({ pitch: 0.5, ridgeY: 12 });
  const noSlab = generateRoof([g], { ...SPRUCE, slab: null });
  assert.equal(noSlab.counts.slabs, 0);
  assert.ok(noSlab.cells.every((c) => !c.block.endsWith("_slab")));
  const steep = gable({ pitch: 1 });
  const noStairs = generateRoof([steep], { ...SPRUCE, stairs: null });
  assert.equal(noStairs.counts.stairs, 0);
  assert.ok(noStairs.cells.every((c) => c.block === "spruce_planks"));
});

test("insane gables are skipped; empty family generates nothing", () => {
  const bad = { ...gable(), sane: false, reasons: ["synthetic"] };
  const { cells } = generateRoof([bad], SPRUCE);
  assert.equal(cells.length, 0);
  const none = generateRoof([gable()], { field: null, stairs: null, slab: null, findings: [] });
  assert.equal(none.cells.length, 0);
});

test("determinism: two generations are deep-equal", () => {
  const a = generateRoof([gable({ pitch: 1 })], SPRUCE);
  const b = generateRoof([gable({ pitch: 1 })], SPRUCE);
  assert.deepEqual(a.cells, b.cells);
  assert.deepEqual(a.counts, b.counts);
});

// --- fitted ends (T-108-01): footprint trim + verge/eave sheet course ----------------------------

/** The standard test gable with fitted ends attached (roof-end-fit shape, minimal fields). */
function endedGable(ends, opts = {}) {
  return { ...gable(opts), ends };
}

test("ends trim: columns past the fitted verge tip are not generated", () => {
  // blob footprint z 0..5; fitted hi end: face at z=3, verge tip at z=4 → z=5 not generated
  const g = endedGable({ lo: null, hi: { dir: "+z", coord: 4, faceCoord: 3, overhang: 1 } });
  const { heights } = generateRoof([g], SPRUCE);
  assert.equal(heights.has("0,5"), false, "column past the fitted end is trimmed");
  assert.equal(heights.has("0,4"), true);
  assert.equal(heights.get("0,4"), heights.get("0,3"), "the sheet keeps the gable surface height");
});

test("sheet strip: surface course only — open underside past the gable face", () => {
  const g = endedGable({ lo: null, hi: { dir: "+z", coord: 5, faceCoord: 3, overhang: 2 } }, { pitch: 1 });
  const { cells } = generateRoof([g], SPRUCE);
  const m = byPos(cells);
  // solid column inside the face (z=3): filled from the band floor (y10) to the surface
  assert.ok(m.has("3,10,3") && m.has("3,11,3"), "solid wedge inside the gable face");
  // sheet column (z=4,5): ONLY the surface course — x=3 surface is y11 (a stair tread), y10 open
  assert.ok(m.has("3,11,4") && m.has("3,11,5"), "sheet places the surface course");
  assert.equal(m.has("3,10,4"), false, "sheet underside is open (the overhang face)");
  assert.equal(m.has("3,10,5"), false);
  assert.equal(m.get("3,11,4").block, "spruce_stairs", "verge courses keep the stair vocabulary");
  // the ridge column's sheet cell is full-height at the ridge cap
  assert.ok(m.has("0,14,4") && !m.has("0,13,4"), "ridge sheet cell carries no fill below");
});

test("no ends → byte-identical to the un-ended generation (regression pin)", () => {
  const a = generateRoof([gable({ pitch: 1 })], SPRUCE);
  const b = generateRoof([endedGable(undefined, { pitch: 1 })], SPRUCE);
  assert.deepEqual(a.cells, b.cells);
  assert.deepEqual(a.counts, b.counts);
});

test("composition: a solid winner overrides a sheet loser at shared columns", () => {
  // sheet gable (low ridge) overlapped by a taller solid cross gable at z=4
  const sheetG = endedGable({ lo: null, hi: { dir: "+z", coord: 5, faceCoord: 3, overhang: 2 } }, { pitch: 1 });
  const solidG = {
    ...gable({ pitch: 1, eaveY: 12, ridgeY: 16, E: 4, z0: 4, z1: 5 }),
    id: "gable-cross",
  };
  const { cells } = generateRoof([sheetG, solidG], SPRUCE);
  const m = byPos(cells);
  // at (0,*,4): the cross gable's ridge (y16) beats the sheet gable's surface (y14) → solid fill
  assert.ok(m.has("0,12,4") && m.has("0,16,4"), "winning solid gable fills to its surface");
});

// ---------------------------------------------------------------- ridge cap courses (T-109-01)

test("cap courses: every ridge column is marked, one cap cell per column (T-109-01)", () => {
  const g = gable({ pitch: 1, eaveY: 10, ridgeY: 14, E: 4, z0: 0, z1: 5 });
  const { counts, capKeys, owner } = generateRoof([g], SPRUCE);
  assert.equal(counts.cap, 6, "x=0 reaches the ridge for every z 0..5");
  for (let z = 0; z <= 5; z++) {
    assert.ok(capKeys.has(`0,14,${z}`), `cap cell at z=${z}`);
    assert.equal(owner.get(`0,${z}`).cap, true);
  }
  assert.equal(owner.get("3,0").cap, false, "slope columns are not cap");
  assert.equal(capKeys.size, 6);
});

test("cap courses: a half-height fitted ridge caps with the slab cell (T-109-01)", () => {
  const g = gable({ pitch: 1, eaveY: 10, ridgeY: 13.5, E: 4 });
  const { cells, capKeys, counts } = generateRoof([g], SPRUCE);
  const m = byPos(cells);
  assert.equal(m.get("0,14,0").block, "spruce_slab", "the cap course is the slab half-step");
  assert.ok(capKeys.has("0,14,0"), "the slab cell IS the cap cell");
  assert.equal(capKeys.has("0,13,0"), false, "the solid course below is fill, not the cap");
  assert.equal(counts.cap, 6);
});

test("cap marking changes no emission: cells byte-identical to the count-free view (T-109-01)", () => {
  const g = gable({ pitch: 1 });
  const r = generateRoof([g], SPRUCE);
  for (const k of r.capKeys) assert.ok(r.cells.some((c) => c.pos.join(",") === k));
  assert.equal(r.counts.cap, r.capKeys.size);
});

// --- T-112-01: corner states for hip constructions ------------------------------------------------

/** A four-sided hip-cap gable (roof-hip-fit's output shape) over an inclusive plan rectangle. */
function hipCap({ pitch = 1, eaveY = 10, x0 = 0, x1 = 6, z0 = 0, z1 = 6, kind = "hip-cap" } = {}) {
  const cols = new Set();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) cols.add(`${x},${z}`);
  const apex = eaveY + pitch * Math.min((x1 - x0) / 2, (z1 - z0) / 2);
  const side = (eaveDir, eaveEdge) => ({
    planeId: null, eaveDir, pitch, pitchSource: "glb-quadrant", eaveY, eaveEdge, extentCells: [],
  });
  return {
    id: "hip-cap-test",
    ...(kind ? { kind } : {}),
    ridge: { axis: x1 - x0 >= z1 - z0 ? "x" : "z", y: apex },
    sides: [side("+x", x1), side("-x", x0), side("+z", z1), side("-z", z0)],
    footprint: { cols, bbox: { minX: x0, maxX: x1, minZ: z0, maxZ: z1 }, area: cols.size },
    hip: { demanded: false, lo: false, hi: false },
    sane: true,
    reasons: [],
  };
}

test("stairShape exhaustives: every (downhill × perpendicular-class²) configuration", () => {
  // hand-written oracle: PERP order is [+z,-z] for x downhills, [+x,-x] for z downhills;
  // facing = uphill; left-of-facing: east→north(-z), west→south(+z), south→east(+x), north→west(-x)
  const LEFT_PERP = { "+x": "+z", "-x": "-z", "+z": "-x", "-z": "+x" }; // keyed by DOWNHILL d
  for (const d of ["+x", "-x", "+z", "-z"]) {
    const perps = d[1] === "x" ? ["+z", "-z"] : ["+x", "-x"];
    const CLASSES = { drop: 9, level: 10, rise: 11 }; // h = 10
    for (const [c1, v1] of Object.entries(CLASSES)) {
      for (const [c2, v2] of Object.entries(CLASSES)) {
        const probe = (dir) => (dir === perps[0] ? v1 : dir === perps[1] ? v2 : 10);
        const r = stairShape(d, 10, probe);
        const left = LEFT_PERP[d];
        let want;
        if (c1 === "drop" && c2 === "drop") want = { stair: false, shape: null };
        else if (c1 === "drop") want = { stair: true, shape: perps[0] === left ? "outer_left" : "outer_right" };
        else if (c2 === "drop") want = { stair: true, shape: perps[1] === left ? "outer_left" : "outer_right" };
        else if (c1 === "rise" && c2 === "rise") want = { stair: true, shape: "straight" };
        else if (c1 === "rise") want = { stair: true, shape: perps[0] === left ? "inner_left" : "inner_right" };
        else if (c2 === "rise") want = { stair: true, shape: perps[1] === left ? "inner_left" : "inner_right" };
        else want = { stair: true, shape: "straight" };
        assert.deepEqual(r, want, `${d} ${c1}/${c2}`);
      }
    }
    // absent neighbors count as drops
    assert.deepEqual(stairShape(d, 10, () => undefined), { stair: false, shape: null }, `${d} absent/absent`);
  }
});

test("square pyramid: all four eave corners turn with outer shapes, oriented per quadrant", () => {
  const { cells } = generateRoof([hipCap()], SPRUCE);
  const pos = byPos(cells);
  const corner = (x, z) => {
    const c = pos.get(`${x},10,${z}`);
    assert.equal(c.block, "spruce_stairs", `corner ${x},${z} is a stair`);
    return [c.state.facing, c.state.shape];
  };
  assert.deepEqual(corner(0, 0), ["east", "outer_left"]);
  assert.deepEqual(corner(6, 0), ["west", "outer_right"]);
  assert.deepEqual(corner(0, 6), ["east", "outer_right"]);
  assert.deepEqual(corner(6, 6), ["west", "outer_left"]);
  // the arris cells one step in keep turning the same way
  assert.deepEqual(pos.get("1,11,1").state.shape, "outer_left");
  assert.deepEqual(pos.get("5,11,5").state.shape, "outer_left");
  // every emitted shape is in the proven vocabulary enum
  const SHAPES = new Set(["straight", "inner_left", "inner_right", "outer_left", "outer_right"]);
  for (const c of cells) if (c.state?.shape) assert.ok(SHAPES.has(c.state.shape), c.state.shape);
});

test("the same 4-sided geometry WITHOUT the hip-cap kind emits straight-only (the gate)", () => {
  const { cells } = generateRoof([hipCap({ kind: null })], SPRUCE);
  for (const c of cells) {
    if (c.block === "spruce_stairs") assert.equal(c.state.shape, "straight");
  }
});

test("legacy 2-side gables (incl. heuristic hips) stay byte-identical: never corner-eligible", () => {
  const legacyHip = gable({ hip: { demanded: true, lo: true, hi: true } });
  const a = generateRoof([legacyHip], SPRUCE);
  for (const c of a.cells) if (c.state?.shape) assert.equal(c.state.shape, "straight");
  for (const o of a.owner.values()) assert.equal(o.cornerEligible, false);
});

test("a fitted hip end marks its columns corner-eligible; the slopes stay ineligible", () => {
  const g = gable({ hip: { demanded: true, lo: true, hi: false, fitted: { lo: { pitch: 1 } } } });
  const { owner } = roofHeightfield([g]);
  assert.equal(owner.get("0,0").downhill, "-z");
  assert.equal(owner.get("0,0").cornerEligible, true, "fitted lo end column");
  assert.equal(owner.get("3,3").cornerEligible, false, "side-slope column");
});

test("hip-cap generation is deterministic and the apex column is the cap course", () => {
  const norm = (r) => JSON.parse(JSON.stringify({ cells: r.cells, counts: r.counts }));
  const a = generateRoof([hipCap()], SPRUCE);
  assert.deepEqual(norm(a), norm(generateRoof([hipCap()], SPRUCE)));
  assert.ok(a.capKeys.has("3,13,3"), "apex cell marked as cap course");
});

// ---------------------------------------------------------------- ridge closure realization (T-122-01)

test("a closed gable realizes the closed ridge height within ±1, both axes", async () => {
  const { closeRidge } = await import("../form/roof-ridge-fit.mjs");
  for (const axis of ["z", "x"]) {
    // a deliberately-low fit: ridge.y 12 with shallow pitches that intersect even lower
    const g = axis === "z" ? gable({ pitch: 0.5, eaveY: 10, ridgeY: 12, E: 4 }) : (() => {
      const base = gable({ pitch: 0.5, eaveY: 10, ridgeY: 12, E: 4 });
      const cols = new Set([...base.footprint.cols].map((k) => k.split(",").reverse().join(",")));
      return {
        ...base,
        ridge: { axis: "x", y: 12 },
        sides: [
          { ...base.sides[0], eaveDir: "+z" },
          { ...base.sides[1], eaveDir: "-z" },
        ],
        footprint: { cols, bbox: { minX: 0, maxX: 5, minZ: -4, maxZ: 4 }, area: cols.size },
      };
    })();
    g.sides.forEach((s) => { s.run = 4; });
    const profile = { height: 16, span: axis === "z" ? [0, 5] : [0, 5], length: 6, rmse: 0 };
    const anchors = { buildEave: 10, glbEave: 10, perSide: [], dropped: [] };
    const { gable: closed, closure } = closeRidge(g, { profile, anchors });
    assert.equal(closure.applied, true, closure.refusals.join("; "));
    assert.equal(closed.ridge.y, 16);
    const { cells } = generateRoof([closed], SPRUCE);
    const top = Math.max(...cells.map((c) => c.pos[1]));
    assert.ok(Math.abs(top - 16) <= 1, `${axis}-axis built ridge top ${top} within ±1 of the closed 16`);
    // and the as-fitted gable demonstrably under-built (the witness mechanism, synthetic)
    const before = Math.max(...generateRoof([g], SPRUCE).cells.map((c) => c.pos[1]));
    assert.ok(before <= 12, `as-fitted tops at ${before}`);
  }
});

test("two closed intersecting gables compose by max height (the cross-gable case)", async () => {
  const { closeRidge } = await import("../form/roof-ridge-fit.mjs");
  const main = gable({ pitch: 1, eaveY: 10, ridgeY: 14, E: 4, z0: 0, z1: 9 });
  main.sides.forEach((s) => { s.run = 4; });
  const cross = (() => {
    const cols = new Set();
    for (let x = -4; x <= 4; x++) for (let z = 3; z <= 6; z++) cols.add(`${x},${z}`);
    return {
      id: "gable-cross",
      ridge: { axis: "x", y: 12 },
      sides: [
        { planeId: "c-a", eaveDir: "+z", pitch: 0.5, pitchSource: "glb", eaveY: 10, eaveEdge: 6, run: 1.5, extentCells: [] },
        { planeId: "c-b", eaveDir: "-z", pitch: 0.5, pitchSource: "glb", eaveY: 10, eaveEdge: 3, run: 1.5, extentCells: [] },
      ],
      footprint: { cols, bbox: { minX: -4, maxX: 4, minZ: 3, maxZ: 6 }, area: cols.size },
      hip: { demanded: false, lo: false, hi: false },
      sane: true,
      reasons: [],
    };
  })();
  const { gable: closedCross, closure } = closeRidge(cross, {
    profile: { height: 13, span: [-4, 4], length: 9, rmse: 0 },
    anchors: { buildEave: 10, glbEave: 10, perSide: [], dropped: [] },
  });
  assert.equal(closure.applied, true, closure.refusals.join("; "));
  const { cells } = generateRoof([main, closedCross], SPRUCE);
  const m = byPos(cells);
  // the main ridge still owns its height where the cross-gable is lower
  assert.ok(m.get("0,14,0"), "main ridge cap survives");
  // the closed cross ridge reaches 13 at its own row outside the main wedge's higher region
  const crossTop = Math.max(...cells.filter((c) => c.pos[2] >= 3 && c.pos[2] <= 6 && Math.abs(c.pos[0]) === 4).map((c) => c.pos[1]));
  assert.ok(Math.abs(crossTop - 13) <= 1, `cross ridge edge tops at ${crossTop}`);
});

test("closed gables keep stair/slab cap states renderable: every shaped cell carries a state", async () => {
  const { closeRidge } = await import("../form/roof-ridge-fit.mjs");
  const g = gable({ pitch: 0.5, eaveY: 10, ridgeY: 12, E: 4 });
  g.sides.forEach((s) => { s.run = 4; });
  const { gable: closed } = closeRidge(g, {
    profile: { height: 15.5, span: [0, 5], length: 6, rmse: 0 }, // half-block target → slab cap path
    anchors: { buildEave: 10, glbEave: 10, perSide: [], dropped: [] },
  });
  const { cells } = generateRoof([closed], SPRUCE);
  for (const c of cells) {
    assert.ok(["spruce_planks", "spruce_stairs", "spruce_slab"].includes(c.block), `unmapped block ${c.block}`);
    if (c.block !== "spruce_planks") assert.ok(c.state, `${c.block} at ${c.pos} carries a block state`);
  }
});

// --- T-150-01: envelope-then-covering (gable-end-as-wall, opt-in gableBlock) ---

test("gableEndColumns: the outermost slice along the ridge axis, hip ends excluded", () => {
  const g = gable({ E: 4, z0: 0, z1: 5 }); // ridge along z → end walls at z=0 and z=5
  const ends = gableEndColumns(g);
  // every x at z=0 and z=5 is an end column; none at z=1..4
  for (let x = -4; x <= 4; x++) {
    assert.ok(ends.has(`${x},0`), `z=0 end col x=${x}`);
    assert.ok(ends.has(`${x},5`), `z=5 end col x=${x}`);
    assert.ok(!ends.has(`${x},2`), `z=2 is interior, not an end col`);
  }
  // a hip-demanded gable has no vertical triangular face → empty
  const hipped = gable({ hip: { demanded: true, lo: true, hi: true } });
  assert.equal(gableEndColumns(hipped).size, 0);
});

test("gableBlock: gable-end sub-surface is wall, covering surface stays roof", () => {
  const g = gable({ pitch: 1, eaveY: 10, ridgeY: 14, E: 4, z0: 0, z1: 5 });
  const GABLE = "minecraft:cobblestone";
  const { cells, gableWallKeys } = generateRoof([g], SPRUCE, { gableBlock: GABLE });
  const m = byPos(cells);
  // z=0 is a gable end. column x=0 (the ridge): surface at y=14 (ridge cap, full field), fill below is wall.
  assert.equal(m.get("0,14,0").block, "spruce_planks", "ridge cap surface stays roof");
  assert.equal(m.get("0,13,0").block, GABLE, "sub-surface end-slice cell is wall");
  assert.equal(m.get("0,10,0").block, GABLE, "eave-level end-slice fill is wall");
  // z=2 (interior slice) is untouched roof
  assert.equal(m.get("0,13,2").block, "spruce_planks", "interior fill stays roof");
  // gableWallKeys holds only sub-surface end cells, never the surface
  assert.ok(gableWallKeys.has("0,13,0"));
  assert.ok(!gableWallKeys.has("0,14,0"), "the covering surface is never a gable-wall key");
  for (const k of gableWallKeys) {
    const [, , z] = k.split(",").map(Number);
    assert.ok(z === 0 || z === 5, `gable-wall key ${k} is on an end slice`);
  }
});

// --- T-172-01: covering (hollow over the envelope), opt-in opts.covering ---

test("covering hollows the wedge interior; the surface stays put", () => {
  const g = gable({ pitch: 1 }); // E=4, eaveY10, ridgeY14: x=±1→13, ±2→12, ±3→11, ±4→10
  const solid = byPos(generateRoof([g], SPRUCE).cells);
  const cov = byPos(generateRoof([g], SPRUCE, { covering: true }).cells);
  // INTERIOR row z=3 (z=0/5 are gable-END walls — the envelope, kept solid by design).
  // ridge column x=0 (h=14): solid fills 10..14; covering keeps only the surface course
  assert.ok(solid.has("0,10,3") && solid.has("0,12,3"), "solid wedge fills the interior");
  assert.equal(cov.has("0,10,3"), false, "covering hollows the deep interior (y=10 under the ridge)");
  assert.equal(cov.has("0,12,3"), false, "covering hollows the interior (y=12 under the ridge)");
  assert.ok(cov.has("0,14,3"), "covering keeps the surface/cap course");
  // a slope column x=1 (h=13): interior 10..12 gone, surface 13 kept
  assert.ok(solid.has("1,11,3"));
  assert.equal(cov.has("1,11,3"), false, "slope-column interior hollowed");
  assert.ok(cov.has("1,13,3"), "slope-column surface kept");
});

test("covering pitch 2 stays watertight: every riser is sealed (no daylight column)", () => {
  const g = gable({ pitch: 2, ridgeY: 18 }); // x=±1→16, ±2→14, ±3→12, ±4→10
  const { cells, heights } = generateRoof([g], SPRUCE, { covering: true });
  const present = new Set(cells.map((c) => c.pos.join(",")));
  // watertight invariant (impl-independent): for every column, the cells from its surface DOWN to
  // one above its LOWEST orthogonal neighbour's surface must all be solid — that face has no gap.
  for (const [key, h] of heights) {
    const [x, z] = key.split(",").map(Number);
    const top = Math.floor(h);
    let minNbrTop = Infinity;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nh = heights.get(`${x + dx},${z + dz}`);
      if (nh !== undefined) minNbrTop = Math.min(minNbrTop, Math.floor(nh));
    }
    const lo = Number.isFinite(minNbrTop) ? Math.min(top, minNbrTop + 1) : top;
    for (let y = lo; y <= top; y++) {
      assert.ok(present.has(`${x},${y},${z}`), `daylight gap at ${x},${y},${z} (riser unsealed)`);
    }
  }
});

test("covering keeps the sloped surface + caps byte-identical (only interior fill differs)", () => {
  const g = gable({ pitch: 1, eaveY: 10, ridgeY: 14, E: 4, z0: 0, z1: 5 });
  const solid = generateRoof([g], SPRUCE);
  const cov = generateRoof([g], SPRUCE, { covering: true });
  const fixtures = (r) => r.cells.filter((c) => c.form === "fixture");
  assert.deepEqual(fixtures(cov), fixtures(solid), "stairs/slabs (the slope skin) byte-identical");
  assert.deepEqual([...cov.capKeys].sort(), [...solid.capKeys].sort(), "ridge caps unchanged");
  assert.deepEqual([...cov.heights.keys()].sort(), [...solid.heights.keys()].sort(), "footprint cols unchanged");
  assert.ok(cov.cells.length < solid.cells.length, "covering removes interior cells");
});

test("covering preserves gable-end walls + footprint closure (envelope intact)", () => {
  const g = gable({ pitch: 1, eaveY: 10, ridgeY: 14, E: 4, z0: 0, z1: 5 });
  const GABLE = "minecraft:cobblestone";
  const solid = generateRoof([g], SPRUCE, { gableBlock: GABLE });
  const cov = generateRoof([g], SPRUCE, { gableBlock: GABLE, covering: true });
  assert.deepEqual([...cov.gableWallKeys].sort(), [...solid.gableWallKeys].sort(),
    "gable-end walls (envelope) untouched by covering");
  // closure of the footprint perimeter is identical (covering removes only sub-surface fill)
  const ring = (r) => new Set([...r.heights.keys()]);
  assert.equal(closureOf(ring(cov)), closureOf(ring(solid)), "footprint closure unchanged");
  assert.equal(closureOf(ring(cov)), 1, "the test gable footprint is a watertight rectangle");
});

test("covering census: the SLOPE interior prism is hollowed out (envelope aside)", () => {
  const g = gable({ pitch: 1, eaveY: 10, ridgeY: 14, E: 4, z0: 0, z1: 5 });
  const GABLE = "minecraft:cobblestone";
  const solid = generateRoof([g], SPRUCE, { gableBlock: GABLE });
  const cov = generateRoof([g], SPRUCE, { gableBlock: GABLE, covering: true });
  // count sub-surface, non-fixture, non-gable-WALL cells: the prism interior we mean to delete
  const interiorFill = (r) => r.cells.filter((c) => {
    const top = Math.floor(r.heights.get(`${c.pos[0]},${c.pos[2]}`));
    return c.pos[1] < top && c.form !== "fixture" && !r.gableWallKeys.has(c.pos.join(","));
  }).length;
  assert.ok(interiorFill(solid) > 0, "the solid prism has interior fill");
  assert.equal(interiorFill(cov), 0, "pitch-1 covering leaves NO slope interior fill (fully hollow)");
  assert.ok(cov.cells.length < solid.cells.length, "covering is strictly smaller than the prism");
  // roofMaterialFraction is a generic build census (namespace-insensitive)
  const f = roofMaterialFraction(
    [{ block: "spruce_planks" }, { block: "minecraft:stone_bricks" }, { block: "spruce_stairs" }],
    ["spruce_planks", "spruce_stairs", "spruce_slab"]);
  assert.deepEqual(f, { roof: 2, total: 3, frac: 2 / 3 });
});

test("absent covering ⇒ byte-identical legacy prism (regression pin)", () => {
  const g = gable({ pitch: 1 });
  assert.deepEqual(generateRoof([g], SPRUCE, {}).cells, generateRoof([g], SPRUCE).cells);
  assert.deepEqual(generateRoof([g], SPRUCE, { covering: false }).cells, generateRoof([g], SPRUCE).cells);
});

test("covering composes multi-gable: the cross-gable valley still reads, both ridges kept", () => {
  const main = gable({ pitch: 1, eaveY: 10, ridgeY: 14, E: 4, z0: 0, z1: 9 });
  const cols = new Set();
  for (let x = 0; x <= 6; x++) for (let z = 2; z <= 7; z++) cols.add(`${x},${z}`);
  const cross = {
    id: "gable-cross", ridge: { axis: "x", y: 13 },
    sides: [
      { planeId: "roof-c", eaveDir: "+z", pitch: 1, pitchSource: "glb", eaveY: 10, eaveEdge: 7, extentCells: [] },
      { planeId: "roof-d", eaveDir: "-z", pitch: 1, pitchSource: "glb", eaveY: 10, eaveEdge: 2, extentCells: [] },
    ],
    footprint: { cols, bbox: { minX: 0, maxX: 6, minZ: 2, maxZ: 7 }, area: cols.size },
    hip: { demanded: false, lo: false, hi: false }, sane: true, reasons: [],
  };
  const cov = generateRoof([main, cross], SPRUCE, { covering: true });
  // heights/owner are emission-independent: composition is identical to solid
  const solidHf = roofHeightfield([main, cross]);
  for (const [k, h] of solidHf.heights) assert.equal(cov.heights.get(k), h, `valley/comp height at ${k}`);
  const m = byPos(cov.cells);
  assert.ok(m.has("0,14,0"), "main ridge cap present in covering");
  assert.ok(cov.cells.some((c) => c.pos[1] === 13 && c.pos[2] >= 2 && c.pos[2] <= 7), "cross ridge present");
});

test("gableBlock byte-identity: the sloped COVERING is unchanged on/off", () => {
  const g = gable({ pitch: 1, eaveY: 10, ridgeY: 14, E: 4, z0: 0, z1: 5 });
  const off = generateRoof([g], SPRUCE);
  const on = generateRoof([g], SPRUCE, { gableBlock: "minecraft:cobblestone" });
  // covering = every cell that is a fixture (stair/slab) or sits at the column top, plus caps.
  // It must be byte-identical: the gable change only retags SUB-SURFACE fill of the end slices.
  const coveringOff = off.cells.filter((c) => c.form === "fixture");
  const coveringOn = on.cells.filter((c) => c.form === "fixture");
  assert.deepEqual(coveringOn, coveringOff, "stairs/slabs (the slope skin) byte-identical");
  // and with no gableBlock the whole emission is the legacy prism
  const legacy = generateRoof([g], SPRUCE, {});
  assert.deepEqual(legacy.cells, off.cells, "absent gableBlock ⇒ byte-identical legacy");
  assert.equal(legacy.gableWallKeys.size, 0);
});

// ─── gableRidgeForRatio — the pitch lever (T-204-01, S-204, E-52) ───────────────────────────────────
// RR1 in-tolerance no-op: the gatehouse-like honest gable (≈1.55 vs target 1.35, relDelta 0.148 < 0.2)
// is kept EXACTLY at pitch 1 — the byte-identical guarantee that makes wiring the lever a no-op there.
test("RR1 gableRidgeForRatio keeps pitch 1 byte-identical when within tolerance", () => {
  const eaveY = 18, eaveHeight = 9, perp = 11; // ratioBefore = (9+5)/9 = 1.5556
  const r = gableRidgeForRatio({ eaveY, eaveHeight, perp, targetRatio: 1.35 });
  assert.equal(r.changed, false);
  assert.equal(r.pitch, 1);
  assert.equal(r.ridgeY, eaveY + Math.floor(perp / 2), "ridgeY identical to the hardcoded eaveY+floor(perp/2)");
  assert.ok(Math.abs(r.ratioBefore - 14 / 9) < 1e-9);
});

// RR2 correcting fire: a clearly out-of-tolerance (too-steep) gable IS corrected toward the target, and
// the achieved ratio is no worse than the pitch-1 ratio. This refutes "the pitch lever doesn't exist".
test("RR2 gableRidgeForRatio fires and moves the ratio toward target when out of tolerance", () => {
  const eaveY = 12, eaveHeight = 6, perp = 20; // ratioBefore = (6+10)/6 = 2.667, target 1.2 → far out of tol
  const r = gableRidgeForRatio({ eaveY, eaveHeight, perp, targetRatio: 1.2 });
  assert.equal(r.changed, true);
  assert.ok(r.pitch < 1, "snaps to a shallower pitch class");
  assert.ok(Math.abs(r.ratioAfter - 1.2) <= Math.abs(r.ratioBefore - 1.2), "ratio moves toward (not past, no worse than) target");
  assert.ok(r.ratioAfter < r.ratioBefore, "the steep roof was flattened");
});

// RR3 cap: the achieved rise never exceeds the half-perp run (no roof taller than its own slope).
test("RR3 gableRidgeForRatio never raises the ridge above the half-perp run", () => {
  const eaveY = 5, eaveHeight = 3, perp = 8; // riseAtPitch1 = 4; a high target would over-demand
  const r = gableRidgeForRatio({ eaveY, eaveHeight, perp, targetRatio: 5 });
  assert.ok(r.ridgeY - eaveY <= Math.floor(perp / 2), "rise capped at floor(perp/2)");
});

// RR4 degenerate input: no throw on the hand path; pitch-1 default returned.
test("RR4 gableRidgeForRatio tolerates degenerate input without throwing", () => {
  for (const bad of [
    { eaveY: 10, eaveHeight: 0, perp: 8, targetRatio: 1.3 },
    { eaveY: 10, eaveHeight: 6, perp: 0, targetRatio: 1.3 },
    { eaveY: 10, eaveHeight: 6, perp: 8, targetRatio: 0.5 },
  ]) {
    const r = gableRidgeForRatio(bad);
    assert.equal(r.changed, false);
    assert.equal(r.pitch, 1);
  }
});

// RR5 the returned pitch is always a generator-supported class.
test("RR5 gableRidgeForRatio returns a supported pitch class", () => {
  const supported = new Set([0.5, 1, 2, 3]);
  for (const t of [1.1, 1.35, 1.8, 2.5, 4]) {
    const r = gableRidgeForRatio({ eaveY: 12, eaveHeight: 6, perp: 16, targetRatio: t });
    assert.ok(supported.has(r.pitch), `pitch ${r.pitch} ∈ {0.5,1,2,3} for target ${t}`);
  }
});
