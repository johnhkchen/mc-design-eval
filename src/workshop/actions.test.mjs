// workshop actions unit tests (T-126-01). Groups:
//   V — parseAction vocabulary + rejection matrix
//   SP — sprayPaintApplier on synthetic occupancy (dirs, filters, bounds, shape-respect)
//   AP — applyAction routing (program / paint / unavailable) + injectable appliers

import { test } from "node:test";
import assert from "node:assert/strict";

import { occupancyFromCells } from "../view/occupancy.mjs";
import {
  ACTION_NAMES, packVocabulary, parseAction, sprayPaintApplier, applyAction, DEFAULT_APPLIERS,
} from "./actions.mjs";
import { assertWorkshopProgram, WORKSHOP_PROGRAM_SCHEMA } from "./program.mjs";

const PACK = {
  palette: [{ block: "oak_planks" }, { block: "cobblestone" }, { block: "spruce_planks" }],
  decoration: [{ block: "lantern" }],
};

const PROGRAM = assertWorkshopProgram({
  schema: WORKSHOP_PROGRAM_SCHEMA,
  subject: "synthetic",
  pack: "rustic",
  budget: { rounds: 2 },
  declarations: {},
  elements: [
    { id: "shell", kind: "shell", spec: { footprint: { x0: 0, x1: 4, z0: 0, z1: 3 }, y0: 0, height: 3, wallBlock: "oak_planks" } },
  ],
});

const ctx = { program: PROGRAM, pack: PACK };

// --- V: parse + rejections ----------------------------------------------------------------------

test("V1 vocabulary: the three sanctioned names; done is not an action", () => {
  assert.deepEqual([...ACTION_NAMES], ["adjust-params", "spray-paint", "re-recognize"]);
  assert.throws(() => parseAction({ action: "done" }, ctx), /must be one of/);
  assert.throws(() => parseAction({ action: "demolish" }, ctx), /must be one of/);
});

test("V2 packVocabulary = palette ∪ decoration, bare ids (the paletteInPackCheck derivation)", () => {
  const v = packVocabulary(PACK);
  assert.deepEqual([...v].sort(), ["cobblestone", "lantern", "oak_planks", "spruce_planks"]);
  assert.ok(packVocabulary({ palette: [{ block: "minecraft:stone" }] }).has("stone"));
});

test("V3 adjust-params: element must exist, params non-empty; result frozen + key-stripped", () => {
  assert.throws(() => parseAction({ action: "adjust-params", elementId: "ghost", params: { a: 1 } }, ctx), /not a program element/);
  assert.throws(() => parseAction({ action: "adjust-params", elementId: "shell", params: {} }, ctx), /non-empty/);
  const a = parseAction({ action: "adjust-params", elementId: "shell", params: { height: 4 }, extra: "stripped" }, ctx);
  assert.ok(Object.isFrozen(a) && a.extra === undefined);
  assert.deepEqual(a, { action: "adjust-params", elementId: "shell", params: { height: 4 } });
});

test("V4 spray-paint: dir scope, vocabulary gate, bounds shape; diag dirs allowed", () => {
  const good = { action: "spray-paint", dir: "+x", toBlock: "minecraft:cobblestone", fromBlock: "oak_planks" };
  const a = parseAction(good, ctx);
  assert.deepEqual(a, { action: "spray-paint", dir: "+x", toBlock: "cobblestone", fromBlock: "oak_planks" });
  parseAction({ ...good, dir: "-x+z" }, ctx); // 45° diagonal is in scope
  assert.throws(() => parseAction({ ...good, dir: "northish" }, ctx), /arbitrary-oblique/);
  assert.throws(() => parseAction({ ...good, toBlock: "pink_wool" }, ctx), /not in the pack vocabulary/);
  assert.throws(() => parseAction({ ...good, bounds: { min: [0, 0], max: [1, 1, 1] } }, ctx), /bounds/);
  assert.throws(() => parseAction({ ...good, bounds: { min: [2, 0, 0], max: [1, 5, 5] } }, ctx), /min ≤ max/);
});

test("V5 re-recognize parses against the program (vocabulary-valid even though unwired)", () => {
  const a = parseAction({ action: "re-recognize", elementId: "shell" }, ctx);
  assert.deepEqual(a, { action: "re-recognize", elementId: "shell" });
  assert.throws(() => parseAction({ action: "re-recognize", elementId: "ghost" }, ctx), /not a program element/);
});

// --- SP: the spray-paint applier ------------------------------------------------------------------

/** A 3×2×1 slab of oak with one pink face cell and one stair cell: x 0..2, y 0..1, z 0. */
const occ = () => occupancyFromCells([
  { pos: [0, 0, 0], block: "oak_planks" },
  { pos: [1, 0, 0], block: "pink_wool" },
  { pos: [2, 0, 0], block: "oak_planks" },
  { pos: [0, 1, 0], block: "oak_planks" },
  { pos: [1, 1, 0], block: "oak_stairs", form: "fixture", state: { facing: "north", half: "bottom" } },
  { pos: [2, 1, 0], block: "cobblestone" },
]);

test("SP1 fromBlock filter: only matching surface cells repaint; already-target skipped", () => {
  const action = parseAction({ action: "spray-paint", dir: "+z", toBlock: "cobblestone", fromBlock: "pink_wool" }, ctx);
  const r = sprayPaintApplier({ occ: occ(), action });
  assert.equal(r.painted, 1);
  assert.deepEqual(r.placements, [{ op: "voxel", pos: [1, 0, 0], block: "minecraft:cobblestone" }]);
  assert.equal(r.skipped.fromMismatch, 5); // 3 oak + 1 cobble + the oak_stairs cell — none are pink_wool
});

test("SP2 no fromBlock: every visible cube repaints except already-target; shaped cells survive", () => {
  const action = parseAction({ action: "spray-paint", dir: "+z", toBlock: "cobblestone" }, ctx);
  const r = sprayPaintApplier({ occ: occ(), action });
  const painted = new Set(r.placements.map((p) => p.pos.join(",")));
  assert.ok(!painted.has("1,1,0"), "the stair cell is never smashed to a cube");
  assert.equal(r.skipped.shaped, 1);
  assert.equal(r.skipped.alreadyTarget, 1);
  assert.equal(r.painted, 4); // 3 oak + 1 pink
});

test("SP3 bounds clip the paint; out-of-bounds counted", () => {
  const action = parseAction(
    { action: "spray-paint", dir: "+z", toBlock: "cobblestone", bounds: { min: [0, 0, 0], max: [0, 1, 0] } }, ctx);
  const r = sprayPaintApplier({ occ: occ(), action });
  const byKey = (a, b) => a.join(",").localeCompare(b.join(","));
  assert.deepEqual(r.placements.map((p) => p.pos).sort(byKey), [[0, 0, 0], [0, 1, 0]]);
  assert.equal(r.skipped.outOfBounds, 4);
});

test("SP4 deterministic: double-run byte equality", () => {
  const action = parseAction({ action: "spray-paint", dir: "-x", toBlock: "spruce_planks" }, ctx);
  const a = sprayPaintApplier({ occ: occ(), action });
  const b = sprayPaintApplier({ occ: occ(), action });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

// --- AP: applyAction routing ----------------------------------------------------------------------

test("AP1 adjust-params routes to a new program; spray-paint to placements", () => {
  const adj = parseAction({ action: "adjust-params", elementId: "shell", params: { height: 4 } }, ctx);
  const r1 = applyAction({ program: PROGRAM, occ: occ() }, adj);
  assert.equal(r1.kind, "program");
  assert.equal(r1.program.elements[0].spec.height, 4);

  const sp = parseAction({ action: "spray-paint", dir: "+z", toBlock: "cobblestone", fromBlock: "pink_wool" }, ctx);
  const r2 = applyAction({ program: PROGRAM, occ: occ() }, sp);
  assert.equal(r2.kind, "paint");
  assert.equal(r2.painted, 1);
});

test("AP2 re-recognize is unavailable by default (the runner's injection seam) but injectable", () => {
  const rr = parseAction({ action: "re-recognize", elementId: "shell" }, ctx);
  const r = applyAction({ program: PROGRAM, occ: occ() }, rr);
  assert.equal(r.kind, "unavailable");
  assert.match(r.reason, /runner injects/);
  // an injected applier wires it without touching the default table
  const r2 = applyAction({ program: PROGRAM, occ: occ() }, rr, {
    appliers: { ...DEFAULT_APPLIERS, "re-recognize": () => ({ kind: "program", program: PROGRAM }) },
  });
  assert.equal(r2.kind, "program");
});

// --- G: geometry grounding (T-136-01) — source masses as adjust/re-recognize targets -------------

import { loadStylePack } from "../pack/style-pack.mjs";
import { assertBuildingProgram } from "../recognition/program.mjs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RUSTIC = loadStylePack(resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "packs", "rustic.json"));

const SOURCE = assertBuildingProgram({
  schema: "building-program/v1",
  subject: "synthetic",
  pack: "rustic",
  reading: { summary: "one gabled mass" },
  masses: [{
    id: "main",
    rect: { x0: 0, z0: 0, w: 9, d: 7 },
    storeys: 2, storeyHeight: 4,
    walls: { ground: { role: "wall.field.ground" }, upper: { role: "wall.infill.upper" } },
    roof: { idiom: "roof.gable", ridgeAxis: "x", pitchClass: 1, fieldRole: "roof.field" },
    openings: [],
  }],
});

const srcCtx = { program: PROGRAM, pack: RUSTIC, source: SOURCE };

test("G-V6 adjust-params dual grounding: element form unchanged, mass form carries massId + lever vocabulary", () => {
  // element grounding wins and stays key-stripped (the V3 contract)
  const legacy = parseAction({ action: "adjust-params", elementId: "shell", params: { height: 4 } }, srcCtx);
  assert.deepEqual(legacy, { action: "adjust-params", elementId: "shell", params: { height: 4 } });
  // mass grounding marks the geometry form
  const geo = parseAction({ action: "adjust-params", elementId: "main", params: { eaveHeight: 12 } }, srcCtx);
  assert.deepEqual(geo, { action: "adjust-params", elementId: "main", massId: "main", params: { eaveHeight: 12 } });
  // lever vocabulary enforced at parse time (the bounded re-ask gets the precise message)
  assert.throws(() => parseAction({ action: "adjust-params", elementId: "main", params: { ridgeY: 20 } }, srcCtx),
    /unknown geometry param/);
  assert.throws(() => parseAction({ action: "adjust-params", elementId: "main", params: { width: "wide" } }, srcCtx),
    /finite numbers/);
  assert.throws(() => parseAction({ action: "adjust-params", elementId: "main", params: { eaveHeight: 12, storeys: 3 } }, srcCtx),
    /exclusive/);
  // unknown everywhere still rejects, naming both vocabularies
  assert.throws(() => parseAction({ action: "adjust-params", elementId: "ghost", params: { width: 9 } }, srcCtx),
    /not a program element or a source mass.*masses: main/);
  // sourceless ctx: mass ids are NOT valid targets (today's behavior, byte-for-byte)
  assert.throws(() => parseAction({ action: "adjust-params", elementId: "main", params: { width: 9 } }, ctx),
    /not a program element \(/);
});

test("G-V7 re-recognize grounding: mass id direct; element id resolves to the owning mass", () => {
  const direct = parseAction({ action: "re-recognize", elementId: "main" }, srcCtx);
  assert.deepEqual(direct, { action: "re-recognize", elementId: "main", massId: "main" });
  const viaElement = parseAction({ action: "re-recognize", elementId: "shell" }, srcCtx);
  assert.deepEqual(viaElement, { action: "re-recognize", elementId: "shell" }, "no mass prefix — element grounding only");
  assert.throws(() => parseAction({ action: "re-recognize", elementId: "ghost" }, srcCtx),
    /not a program element or a source mass/);
});

test("G-AP3 the geometry form applies through recompile; sourceless ctx reports unavailable", () => {
  const geo = parseAction({ action: "adjust-params", elementId: "main", params: { eaveHeight: 12 } }, srcCtx);
  const seedBudget = { rounds: 5 };
  const live = assertWorkshopProgram({
    schema: WORKSHOP_PROGRAM_SCHEMA, subject: "synthetic", pack: "rustic",
    budget: seedBudget, declarations: {}, elements: PROGRAM.elements,
  });
  const r = applyAction({ program: live, occ: occ(), source: SOURCE, pack: RUSTIC }, geo);
  assert.equal(r.kind, "geometry");
  assert.equal(r.source.masses[0].storeys * r.source.masses[0].storeyHeight, 12);
  assert.equal(r.program.elements.find((e) => e.id === "main-shell").spec.height, 12);
  assert.deepEqual(r.program.budget, seedBudget, "live budget rides through the recompile");

  const r2 = applyAction({ program: live, occ: occ() }, geo);
  assert.equal(r2.kind, "unavailable");
  assert.match(r2.reason, /source building program/);
});
