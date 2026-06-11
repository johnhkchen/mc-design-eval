// Unit tests for roof-generate.mjs (T-104-01, story S-104, epic E-27) — synthetic gables only.
import { test } from "node:test";
import assert from "node:assert/strict";

import { CARD_ROWS } from "../form/fixture-card.mjs";
import { STAIR_FACING, roofFamily, roofHeightfield, generateRoof, stairShape } from "./roof-generate.mjs";

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
