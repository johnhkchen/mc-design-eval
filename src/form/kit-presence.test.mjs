// Unit tests for kit-presence.mjs (T-100-01, story S-100, epic E-26) — synthetic occupancies
// mirroring the placement-grammar and opening-dressing test fixtures; the live cottage proof
// lives in the runner (benchmarks/sculpture/kit-presence.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells, bareBlock } from "../view/occupancy.mjs";
import { roofRegion } from "../view/structural-read.mjs";
import { extractApertures, dressOpenings } from "../view/opening-dressing.mjs";
import { placementGrammar } from "./placement-grammar.mjs";
import {
  KIT_PRESENCE_SCHEMA, KIT_AWARE_GATE_SCHEMA, toleratedConflict,
  kitPresence, composeKitAwareVerdict,
} from "./kit-presence.mjs";

// ------------------------------------------------------------------ synthetic kit (cottage-shaped)
const entry = (block, whereUsed, over = {}) => ({
  block, role: "r", formClass: "cube", whereUsed, confidence: "medium",
  valueCheck: { verdict: "verified" }, ...over,
});
const KIT = [
  entry("stone_bricks", ["band0", "base"], { confidence: "high" }),
  entry("spruce_planks", ["roof", "band1", "trim"], { confidence: "high" }),
  entry("smooth_sandstone", ["band1"]),
  entry("spruce_trapdoor", ["openings"], { formClass: "fixture", valueCheck: { verdict: null } }),
];

// -------------------------------------------------- the two-storey hut (placement-grammar's hut A)
function box(cells, [x0, x1], [y0, y1], [z0, z1], block) {
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    cells.push({ pos: [x, y, z], block });
  }
}
function hut() {
  const cells = [];
  box(cells, [0, 4], [0, 2], [0, 3], "stone_bricks");
  box(cells, [0, 4], [3, 6], [0, 3], "white_terracotta");
  box(cells, [0, 4], [7, 7], [0, 3], "spruce_planks");
  box(cells, [1, 3], [8, 8], [0, 3], "spruce_planks");
  box(cells, [2, 2], [9, 9], [0, 3], "spruce_planks");
  for (let y = 0; y <= 6; y++) cells[cells.findIndex((c) => c.pos.join() === [4, y, 3].join())] =
    { pos: [4, y, 3], block: "cobblestone" }; // the declared chimney shaft (respect-rule case)
  for (const y of [8, 9, 10]) cells.push({ pos: [4, y, 3], block: "cobblestone" });
  const occ = occupancyFromCells(cells);
  const roofKeys = new Set(roofRegion(occ).cells.map((c) => `${c.x},${c.y},${c.z}`));
  const upperTop = 7;
  const zoneOf = ([x, y, z]) =>
    (y >= upperTop || roofKeys.has(`${x},${y},${z}`)) ? "roof" : y >= 3 ? "band1" : "band0";
  return { occ, zoneOf, geom: { floorLines: [0, 3, 7], upperTop, roofKeys } };
}
const POLICY = {
  band0: { dominant: "stone_bricks", preserve: ["cobblestone", "spruce_planks", "dark_oak_log"] },
  band1: { dominant: "smooth_sandstone", preserve: ["cobblestone", "spruce_planks", "dark_oak_log"] },
  roof: { dominant: "spruce_planks", preserve: ["cobblestone"] },
};
const HOPTS = (h, over = {}) => ({
  kit: KIT, bandNames: ["band0", "band1"], policy: POLICY,
  zoneOf: h.zoneOf, ...h.geom, ...over,
});

/** Apply grammar/dressing placements over an occupancy's cells (the satisfied-build constructor). */
function withPlacements(occ, placements) {
  const cells = [];
  for (const [k, b] of occ.cells) {
    const pos = k.split(",").map(Number);
    const state = occ.states.get(k);
    cells.push(state === undefined ? { pos, block: b } : { pos, block: b, state });
  }
  for (const p of placements) {
    const block = bareBlock(p.block);
    const form = block.endsWith("fence") ? "rail"
      : /trapdoor|door|lantern/.test(block) ? "fixture" : undefined;
    cells.push({ pos: p.pos, block, form, state: p.state });
  }
  return occupancyFromCells(cells);
}

// ------------------------------------------------------- the window box (opening-dressing's twin)
function windowBox({ sealed = false } = {}) {
  const cells = [];
  for (let x = 0; x <= 6; x++) for (let y = 0; y <= 5; y++) for (let z = 0; z <= 4; z++) {
    const shell = x === 0 || x === 6 || z === 0 || z === 4 || y === 5;
    if (!shell) continue;
    if (!sealed && (x === 0 || x === 6) && (y === 2 || y === 3) && z === 2) continue;
    cells.push({ pos: [x, y, z], block: "stone_bricks" });
  }
  const occ = occupancyFromCells(cells);
  const roofKeys = new Set(roofRegion(occ).cells.map((c) => `${c.x},${c.y},${c.z}`));
  const zoneOf = ([x, y, z]) => (roofKeys.has(`${x},${y},${z}`) || y >= 5 ? "roof" : "band0");
  return { occ, zoneOf, geom: { floorLines: [0], upperTop: 5, roofKeys } };
}
const BOX_KIT = [entry("stone_bricks", ["band0", "roof", "base"], { confidence: "high" })];
// the dressing's lintel/sill recolors (spruce_planks) must be DECLARED secondaries — the same
// frame-in-preserve contract the grammar runner enforces (T-090-01), or the fill rightly fights them
const BOX_POLICY = {
  band0: { dominant: "stone_bricks", preserve: ["spruce_planks"] },
  roof: { dominant: "stone_bricks", preserve: ["spruce_planks"] },
};
const BOX_OPTS = (b, over = {}) => ({
  kit: BOX_KIT, bandNames: ["band0"], policy: BOX_POLICY,
  zoneOf: b.zoneOf, ...b.geom, ...over,
});
const TREATMENTS = {
  slots: {
    infill: { block: "spruce_fence", source: "test" },
    shutter: { block: "spruce_trapdoor", source: "test" },
    door: { block: "spruce_door", source: "test" },
    light: { block: "lantern", source: "test" },
    frame: { block: "spruce_planks", source: "test" },
  },
};

// ------------------------------------------------------------------------------ cube half (grammar)
test("kit-less hut: frame and band1 panel come back as NAMED gaps; course passes", () => {
  const h = hut();
  const r = kitPresence(h.occ, HOPTS(h));
  assert.equal(r.schema, KIT_PRESENCE_SCHEMA);
  assert.equal(r.passed, false);
  // grammar fixture truth: 41 paintable of 48 frame cells; 20 band1 fill cells
  assert.ok(r.gaps.includes("missing: spruce_planks frame @ 41/48 frame-line cells"), r.gaps.join(" | "));
  assert.ok(r.gaps.includes("missing: smooth_sandstone panel @ band1 (20 cells)"), r.gaps.join(" | "));
  const frame = r.checks.find((c) => c.feature === "frame");
  assert.equal(frame.tolerated.respected, 7, "the chimney shaft is tolerated, not missing");
  const course = r.checks.find((c) => c.feature === "course");
  assert.equal(course.passed, true, "the roof already carries the course block");
  const band0 = r.checks.find((c) => c.feature === "panel:band0");
  assert.equal(band0.passed, true);
  assert.ok(r.skips.some((s) => s.feature === "openings"), "no apertures supplied — recorded skip");
});

test("grammar-satisfied hut: the fixpoint holds — all cube rows pass", () => {
  const h = hut();
  const g = placementGrammar(h.occ, HOPTS(h));
  const satisfied = withPlacements(h.occ, g.placements);
  const r = kitPresence(satisfied, HOPTS(h));
  assert.equal(r.passed, true, JSON.stringify(r.gaps));
  assert.deepEqual(r.gaps, []);
  const frame = r.checks.find((c) => c.feature === "frame");
  assert.equal(frame.missing, 0);
  assert.ok(frame.satisfied > 0);
});

test("a kit binding nothing for a feature is a recorded skip, never a crash or a silent pass", () => {
  const h = hut();
  const kit = [entry("smooth_sandstone", ["band1"])]; // no trim, no band0, no roof cube
  const r = kitPresence(h.occ, HOPTS(h, { kit }));
  for (const feature of ["frame", "course", "panel:band0"]) {
    assert.ok(r.skips.some((s) => s.feature === feature), `${feature} skipped`);
    assert.equal(r.checks.find((c) => c.feature === feature), undefined);
  }
});

// ------------------------------------------------------------------------- fixture half (dressing)
test("sealed window box: infill and shutters are NAMED gaps with 1-based opening indices", () => {
  const open = windowBox();
  const sealedB = windowBox({ sealed: true });
  const apertures = extractApertures(open.occ, ["+x", "-x"]);
  assert.equal(apertures.length, 2);
  const r = kitPresence(sealedB.occ, BOX_OPTS(sealedB, { apertures, treatments: TREATMENTS }));
  assert.equal(r.passed, false);
  assert.ok(r.gaps.includes("missing: spruce_fence infill @ openings 1/2"), r.gaps.join(" | "));
  assert.ok(r.gaps.includes("missing: spruce_trapdoor shutters @ openings 1/2"), r.gaps.join(" | "));
  // the cube half passes (everything stone) — frame skipped (no trim entry), panel/course clean
  assert.equal(r.checks.find((c) => c.feature === "panel:band0").passed, true);
});

test("dressed window box: the dressing fixpoint holds — fixture rows pass via idempotence", () => {
  const open = windowBox();
  const apertures = extractApertures(open.occ, ["+x", "-x"]);
  const d = dressOpenings(open.occ, apertures, TREATMENTS);
  const dressed = withPlacements(open.occ, d.placements);
  const r = kitPresence(dressed, BOX_OPTS(open, { apertures, treatments: TREATMENTS }));
  assert.equal(r.passed, true, JSON.stringify(r.gaps));
  const infill = r.checks.find((c) => c.feature === "openings:infill");
  const shutters = r.checks.find((c) => c.feature === "openings:shutters");
  assert.deepEqual(infill.missingAt, []);
  assert.deepEqual(shutters.missingAt, []);
  const ls = r.checks.find((c) => c.feature === "openings:lintel-sill");
  assert.equal(ls.gating, false, "lintel/sill is evidence, not a gate (the frame-line check gates)");
});

test("a no-jamb shutter side is TOLERATED on a dressed-where-possible target, never a gap", () => {
  // +z wall with a window whose left flank jambs are gone (the floating-pane case)
  const holes = [[2, 2, 0], [3, 2, 0], [2, 3, 0], [3, 3, 0]];
  const wall = ({ extraHoles = [] } = {}) => {
    const drop = new Set([...holes, ...extraHoles].map((p) => p.join(",")));
    const cells = [];
    for (let x = 0; x <= 6; x++) for (let y = 0; y <= 5; y++) {
      if (!drop.has(`${x},${y},0`)) cells.push({ pos: [x, y, 0], block: "stone_bricks" });
    }
    return occupancyFromCells(cells);
  };
  const ref = wall();
  const target = wall({ extraHoles: [[4, 2, 0], [4, 3, 0]] }); // left jamb missing
  const apertures = extractApertures(ref, ["+z"]);
  const d = dressOpenings(target, apertures, TREATMENTS);
  assert.ok(d.perOpening[0].conflicts.some((c) => c.name === "shutter-no-jamb-left"));
  const dressed = withPlacements(target, d.placements);
  const roofKeys = new Set(roofRegion(dressed).cells.map((c) => `${c.x},${c.y},${c.z}`));
  const r = kitPresence(dressed, {
    kit: BOX_KIT, bandNames: ["band0"], policy: BOX_POLICY,
    zoneOf: ([x, y, z]) => (roofKeys.has(`${x},${y},${z}`) ? "roof" : "band0"),
    floorLines: [0], upperTop: 6, roofKeys,
    apertures, treatments: TREATMENTS,
  });
  const shutters = r.checks.find((c) => c.feature === "openings:shutters");
  assert.deepEqual(shutters.missingAt, []);
  assert.deepEqual(shutters.toleratedAt, [1]);
  assert.ok(!r.gaps.some((gap) => gap.includes("shutters")), r.gaps.join(" | "));
});

test("an undressed door-kind aperture gaps the door slot; absent door apertures are a named skip", () => {
  const holes = [[3, 0, 0], [3, 1, 0]]; // ground-touching → door kind
  const cells = [];
  for (let x = 0; x <= 6; x++) for (let y = 0; y <= 5; y++) {
    if (!holes.some((p) => p.join(",") === `${x},${y},0`)) cells.push({ pos: [x, y, 0], block: "stone_bricks" });
  }
  const occ = occupancyFromCells(cells);
  const roofKeys = new Set(roofRegion(occ).cells.map((c) => `${c.x},${c.y},${c.z}`));
  const opts = {
    kit: BOX_KIT, bandNames: ["band0"], policy: BOX_POLICY,
    zoneOf: ([x, y, z]) => (roofKeys.has(`${x},${y},${z}`) ? "roof" : "band0"),
    floorLines: [0], upperTop: 6, roofKeys, treatments: TREATMENTS,
  };
  const withDoor = kitPresence(occ, { ...opts, apertures: extractApertures(occ, ["+z"]) });
  assert.ok(withDoor.gaps.some((gap) => gap.startsWith("missing: spruce_door door @ openings")),
    withDoor.gaps.join(" | "));
  // a windows-only aperture set: door/light families become NAMED skips (T-099 D7 honesty)
  const open = windowBox();
  const windowsOnly = kitPresence(open.occ, BOX_OPTS(open, {
    apertures: extractApertures(open.occ, ["+x", "-x"]), treatments: TREATMENTS,
  }));
  assert.ok(windowsOnly.skips.some((s) => s.feature === "openings:door" && /detector gap/.test(s.reason)));
});

test("an unfulfilled treatment slot is a recorded skip — the kit defines the demand", () => {
  const open = windowBox();
  const sealedB = windowBox({ sealed: true });
  const apertures = extractApertures(open.occ, ["+x", "-x"]);
  const noShutter = { slots: { infill: { block: "spruce_fence", source: "test" } } };
  const r = kitPresence(sealedB.occ, BOX_OPTS(sealedB, { apertures, treatments: noShutter }));
  assert.ok(r.skips.some((s) => s.feature === "openings:shutters" && /no treatment/.test(s.reason)));
  assert.ok(!r.gaps.some((gap) => gap.includes("shutters")));
  assert.ok(r.gaps.some((gap) => gap.includes("infill")), "the fulfilled slot still gates");
});

// ----------------------------------------------------------------------- invariants + composition
test("toleratedConflict matches T-099's acceptance predicate", () => {
  assert.ok(toleratedConflict({ slot: "shutterLeft", name: "shutter-no-jamb-left" }));
  assert.ok(toleratedConflict({ slot: "lintel", name: "lintel-no-band-cells" }));
  assert.ok(!toleratedConflict({ slot: "shutterRight", name: "shutter-blocked-right" }));
  assert.ok(!toleratedConflict({ slot: "infill", name: "occupied-by-other-fixture" }));
});

test("the kit is IMMUTABLE input (AC #4): deep-frozen kit and treatments run unchanged", () => {
  const h = hut();
  const deepFreeze = (o) => {
    if (o && typeof o === "object") { Object.values(o).forEach(deepFreeze); Object.freeze(o); }
    return o;
  };
  const frozenKit = deepFreeze(structuredClone(KIT));
  const snapshot = structuredClone(frozenKit);
  const r = kitPresence(h.occ, HOPTS(h, { kit: frozenKit }));
  assert.equal(r.schema, KIT_PRESENCE_SCHEMA);
  assert.deepEqual(frozenKit, snapshot, "the checker never mutates or re-ranks the kit");
});

test("kitPresence is byte-deterministic", () => {
  const open = windowBox();
  const sealedB = windowBox({ sealed: true });
  const apertures = extractApertures(open.occ, ["+x", "-x"]);
  const a = kitPresence(sealedB.occ, BOX_OPTS(sealedB, { apertures, treatments: TREATMENTS }));
  const b = kitPresence(sealedB.occ, BOX_OPTS(sealedB, { apertures, treatments: TREATMENTS }));
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("composeKitAwareVerdict: presence fail vetoes a passing judge — and never replaces it", () => {
  const pass = { decided: true, passed: true };
  const fail = { decided: true, passed: false };
  const presenceFail = { schema: KIT_PRESENCE_SCHEMA, passed: false, gaps: ["missing: x shutters @ openings 1"] };
  const presencePass = { schema: KIT_PRESENCE_SCHEMA, passed: true, gaps: [] };

  const vetoed = composeKitAwareVerdict(pass, presenceFail);
  assert.equal(vetoed.schema, KIT_AWARE_GATE_SCHEMA);
  assert.equal(vetoed.passed, false, "cannot pass a build missing kit entries");
  assert.equal(vetoed.components.resemblance.passed, true, "the judge verdict is reported, not erased");
  assert.deepEqual(vetoed.components.kitPresence.gaps, presenceFail.gaps);

  const notReplaced = composeKitAwareVerdict(fail, presencePass);
  assert.equal(notReplaced.passed, false, "the kit check cannot replace the resemblance judgement");

  assert.equal(composeKitAwareVerdict(pass, presencePass).passed, true);
  assert.equal(composeKitAwareVerdict(fail, presenceFail).passed, false);
});

test("composeKitAwareVerdict: a resemblance refusal stays a refusal; presence is still reported", () => {
  const refusal = { decided: false, refusal: "missing-view:+x+z" };
  const presenceFail = { schema: KIT_PRESENCE_SCHEMA, passed: false, gaps: ["missing: y frame @ 1/2 frame-line cells"] };
  const v = composeKitAwareVerdict(refusal, presenceFail);
  assert.equal(v.decided, false);
  assert.equal(v.refusal, "missing-view:+x+z");
  assert.equal(v.passed, undefined);
  assert.equal(v.components.kitPresence.ran, true);
  assert.deepEqual(v.components.kitPresence.gaps, presenceFail.gaps);
});

test("composeKitAwareVerdict: not-run presence passes the aggregate through with the reason recorded", () => {
  const v = composeKitAwareVerdict({ decided: true, passed: true }, { ran: false, reason: "no-kit-record" });
  assert.equal(v.passed, true);
  assert.deepEqual(v.components.kitPresence, { ran: false, reason: "no-kit-record" });
  const w = composeKitAwareVerdict({ decided: true, passed: true }, null);
  assert.equal(w.components.kitPresence.ran, false);
  assert.throws(() => composeKitAwareVerdict(null, null), /aggregate/);
});
