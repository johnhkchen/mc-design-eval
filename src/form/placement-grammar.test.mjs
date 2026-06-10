import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "../view/occupancy.mjs";
import { roofRegion } from "../view/structural-read.mjs";
import { assertArtifact } from "../artifact.mjs";
import { PHASE1_MODEL_ID } from "../config.mjs";
import {
  GRAMMAR_SCHEMA, rankCandidates, bindKit, bindOpenings, placementGrammar,
} from "./placement-grammar.mjs";

// ------------------------------------------------------------------ synthetic kit (cottage-shaped)
const entry = (block, whereUsed, over = {}) => ({
  block, role: "r", formClass: "cube", whereUsed, confidence: "medium",
  valueCheck: { verdict: "verified" }, ...over,
});
const KIT = [
  entry("stone_bricks", ["band0", "base"], { confidence: "high" }),
  entry("cobblestone", ["corners-edges", "base", "roof"], { valueCheck: { verdict: "flagged-mismatch" } }),
  entry("spruce_planks", ["roof", "band1", "trim"], { confidence: "high" }),
  entry("smooth_sandstone", ["band1"]),
  entry("spruce_trapdoor", ["openings"], { formClass: "fixture", valueCheck: { verdict: null } }),
  entry("spruce_door", ["openings", "base"], { formClass: "fixture", valueCheck: { verdict: null } }),
  entry("lantern", ["openings", "base"], { formClass: "fixture", confidence: "high", valueCheck: { verdict: null } }),
];

// ------------------------------------------------------------- synthetic hut (frame-lines' hut A,
// with the chimney column carried down as a declared cobble shaft — the respect-rule case)
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
    { pos: [4, y, 3], block: "cobblestone" }; // the chimney shaft, ground to eave
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
const GOPTS = (h) => ({
  kit: KIT, bandNames: ["band0", "band1"], policy: POLICY,
  zoneOf: h.zoneOf, ...h.geom,
});

// ------------------------------------------------------------------------------------ binding rules
test("rankCandidates: specificity beats confidence beats block id — a total order", () => {
  const a = entry("zz_specific", ["band1"], { confidence: "low" });
  const b = entry("aa_broad", ["band1", "trim"], { confidence: "high" });
  const c = entry("aa_specific", ["band1"], { confidence: "low" });
  assert.deepEqual(rankCandidates([a, b, c]).map((e) => e.block), ["aa_specific", "zz_specific", "aa_broad"]);
  const hi = entry("zz", ["band1"], { confidence: "high" });
  assert.equal(rankCandidates([c, hi])[0].block, "zz", "confidence breaks a specificity tie");
});

test("bindKit: cottage-shaped kit binds frame/panels/course as the committed record implies", () => {
  const b = bindKit(KIT, { bandNames: ["band0", "band1"] });
  assert.equal(b.frame.block, "spruce_planks");
  assert.equal(b.panels.band0.block, "stone_bricks");
  assert.equal(b.panels.band1.block, "smooth_sandstone", "specificity 1 beats spruce_planks' 3");
  assert.equal(b.course.block, "spruce_planks", "flagged-mismatch cobblestone never binds");
  assert.deepEqual(b.openingTreatments.map((t) => t.block), ["spruce_trapdoor", "lantern", "spruce_door"]);
  assert.deepEqual(b.skipped, []);
});

test("bindKit: panel candidates exclude the frame-bound block (fields sit BETWEEN lines)", () => {
  const b = bindKit([entry("oak_planks", ["band1", "trim"])], { bandNames: ["band1"] });
  assert.equal(b.frame.block, "oak_planks");
  assert.equal(b.panels.band1, null);
  assert.ok(b.skipped.some((s) => s.feature === "panel:band1"));
});

test("bindKit: flagged-mismatch and fixture entries never bind cube features; nulls are recorded", () => {
  const b = bindKit([
    entry("bad_block", ["trim"], { valueCheck: { verdict: "flagged-mismatch" } }),
    entry("oak_fence", ["trim"], { formClass: "rail", valueCheck: { verdict: null } }),
  ], { bandNames: [] });
  assert.equal(b.frame, null);
  assert.equal(b.course, null);
  assert.deepEqual(b.skipped.map((s) => s.feature).sort(), ["course", "frame"]);
});

test("bindKit: empty/absent kit degrades to all-null bindings, never a throw", () => {
  const b = bindKit(undefined, { bandNames: ["band0"] });
  assert.equal(b.frame, null);
  assert.deepEqual(b.openingTreatments, []);
});

test("bindOpenings: door-kind takes the *_door candidate (a trapdoor is NOT a door), windows the rest", () => {
  const treatments = bindKit(KIT, { bandNames: [] }).openingTreatments;
  const bound = bindOpenings([
    { dir: "+z", kind: "door", bbox: {}, cells: 2, dressing: { cells: 0, blocks: [] } },
    { dir: "+z", kind: "window", bbox: {}, cells: 4, dressing: { cells: 0, blocks: [] } },
  ], treatments);
  assert.equal(bound[0].treatment, "spruce_door");
  assert.equal(bound[1].treatment, "spruce_trapdoor");
  assert.deepEqual(bound[0].candidates, ["spruce_trapdoor", "lantern", "spruce_door"]);
  assert.equal(bindOpenings([{ kind: "door" }], [])[0].treatment, null);
});

// --------------------------------------------------------------------------------- the grammar core
test("placementGrammar: frame painted, declared chimney respected, fields realized by the fill", () => {
  const h = hut();
  const g = placementGrammar(h.occ, GOPTS(h));
  assert.equal(g.schema, GRAMMAR_SCHEMA);
  assert.deepEqual(g.shipped, {
    frame: "spruce_planks",
    panels: { band0: "stone_bricks", band1: "smooth_sandstone" },
    course: "spruce_planks",
  });
  // 48 frame cells: 28 posts + 10 crown + 10 beam; the 7 cobble shaft cells are RESPECTED
  assert.equal(g.frame.counts.cornerPost + g.frame.counts.roofline + g.frame.counts.floorLine, 48);
  assert.equal(g.frame.respected, 7);
  assert.equal(g.frame.painted, 41);
  assert.equal(g.frame.adopted, 0, "no singleton gaps in this hut — nothing to adopt");
  assert.equal(g.frame.skippedIsolated, 0, "no broken-line isolates in this hut");
  assert.equal(g.frame.alreadyFrame, 0);
  // band1 walls (white_terracotta, off-policy) → panel; 56 band1 wall cells − 36 frame = 20
  assert.equal(g.fill.placements.length, 20);
  assert.ok(g.fill.placements.every((p) => p.block === "minecraft:smooth_sandstone"));
  // THE SURVIVAL PROOF: the fill never repaints a frame cell (frame block is a declared secondary)
  assert.equal(g.frameRefilled, 0);
  assert.equal(g.preconditions.frameInPreserve.band0, true);
  assert.equal(g.preconditions.frameInPreserve.band1, true);
  assert.deepEqual(g.preconditions.bindingAgreesWithPolicy, { band0: true, band1: true, roof: true });
});

test("placementGrammar: every placement recolors an EXISTING solid cell (no air op, no geometry)", () => {
  const h = hut();
  const g = placementGrammar(h.occ, GOPTS(h));
  for (const p of g.placements) {
    assert.equal(p.op, "voxel");
    assert.ok(h.occ.solid(...p.pos), `placement at ${p.pos} sits on a solid cell`);
  }
  assert.equal(g.placements.length, g.frame.placements.length + g.fill.placements.length);
});

test("placementGrammar: byte-deterministic — two invocations produce identical output", () => {
  const h = hut();
  const a = placementGrammar(h.occ, GOPTS(h));
  const b = placementGrammar(h.occ, GOPTS(h));
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("placementGrammar: a policy that does NOT declare the frame block reports the broken contract", () => {
  const h = hut();
  const policy = {
    ...POLICY,
    band1: { dominant: "smooth_sandstone", preserve: [] }, // frame undeclared in band1
  };
  const g = placementGrammar(h.occ, { ...GOPTS(h), policy });
  assert.equal(g.preconditions.frameInPreserve.band1, false);
  assert.ok(g.frameRefilled > 0, "the fill fights undeclared frame lines — reported, runner throws");
});

test("placementGrammar: sub is the one renaming point — bound blocks map to shipped space", () => {
  const h = hut();
  const sub = (b) => (b === "stone_bricks" ? "tuff" : b);
  const policy = { ...POLICY, band0: { dominant: "tuff", preserve: ["cobblestone", "spruce_planks"] } };
  const g = placementGrammar(h.occ, { ...GOPTS(h), policy, sub });
  assert.equal(g.shipped.panels.band0, "tuff");
  assert.equal(g.bindings.panels.band0, "stone_bricks", "bindings stay in NAMED space");
  assert.equal(g.preconditions.bindingAgreesWithPolicy.band0, true);
});

test("placementGrammar: a singleton gap in a partly-kept line ADOPTS the kept block, never a speck", () => {
  // floor-beam row y3 on the front face: kept log runs either side of a 1-cell dominant gap; the gap
  // has no paint neighbour and no frame-block neighbour, so the kit frame block would be an isolated
  // speck below minRun (the fill would strip it) — line continuity adopts the log instead.
  const h = hut();
  const cells = [];
  for (const [k, b] of h.occ.cells) cells.push({ pos: k.split(",").map(Number), block: b });
  const logged = new Set(["1,3,0", "1,2,0", "3,3,0", "3,2,0"]); // runs of 2 — the fill's keep rule
  const occ = occupancyFromCells(cells.map((c) =>
    logged.has(c.pos.join(",")) ? { ...c, block: "dark_oak_log" } : c));
  const g = placementGrammar(occ, { ...GOPTS(h), kit: KIT, zoneOf: h.zoneOf });
  const gap = g.frame.placements.find((p) => p.pos.join(",") === "2,3,0");
  assert.ok(gap, "the gap cell is painted");
  assert.equal(gap.block, "minecraft:dark_oak_log", "adopted from the kept run, not the kit frame block");
  assert.ok(g.frame.adopted >= 1);
  assert.equal(g.frameRefilled, 0, "the adopted cell joins the run and survives the fill");
});

test("placementGrammar: opening instances are bound per kind and carried for T-099 — no fixture placements", () => {
  // 1-thick facade with an enclosed window hole and a ground-touching door hole
  const cells = [];
  box(cells, [0, 6], [0, 6], [0, 0], "stone_bricks");
  const carved = new Set(["2,2,0", "3,2,0", "2,3,0", "3,3,0", "5,0,0", "5,1,0"]);
  const occ = occupancyFromCells(cells.filter((c) => !carved.has(c.pos.join(","))));
  const roofKeys = new Set(roofRegion(occ).cells.map((c) => `${c.x},${c.y},${c.z}`));
  const zoneOf = ([, y]) => (y >= 7 ? "roof" : "band0");
  const g = placementGrammar(occ, {
    kit: KIT, bandNames: ["band0"],
    policy: { band0: { dominant: "stone_bricks", preserve: ["spruce_planks"] } },
    zoneOf, floorLines: [0], upperTop: 7, roofKeys,
  });
  const windows = g.openings.filter((o) => o.kind === "window");
  const doors = g.openings.filter((o) => o.kind === "door");
  assert.ok(windows.length >= 1 && doors.length >= 1);
  assert.ok(windows.every((o) => o.treatment === "spruce_trapdoor"));
  assert.ok(doors.every((o) => o.treatment === "spruce_door"));
  assert.ok(g.placements.every((p) => !p.state), "grammar placements are cube recolors only");
});

test("placementGrammar: output composes into a live-gate-valid artifact (AJV)", () => {
  const h = hut();
  const g = placementGrammar(h.occ, GOPTS(h));
  const base = [];
  for (const [k, b] of h.occ.cells) {
    base.push({ op: "voxel", pos: k.split(",").map(Number), block: `minecraft:${b}` });
  }
  const placements = [...base, ...g.placements];
  const artifact = {
    schema_version: "1.0.0",
    metadata: {
      trial_id: "t-098-grammar-test", prompting_method_id: "procedural/placement-grammar@1",
      model_id: PHASE1_MODEL_ID, seed: 0, server_state_id: "in-memory",
    },
    style: { name: "test-hut", rationale: "T-098 grammar unit fixture — frame lines over a two-storey hut." },
    palette: { manifest: [...new Set(placements.map((p) => p.block))].sort() },
    placements,
  };
  assert.doesNotThrow(() => assertArtifact(artifact));
});
