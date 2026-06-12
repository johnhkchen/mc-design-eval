// Unit tests — the re-recognize exchange contract (T-136-01). Pure render-args + reply-parse
// against the REAL rustic pack and a synthetic sketch/program; one bridge smoke proves the BAML
// function renders (codegen present) without pinning a golden (no committed record yet).

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadStylePack } from "../pack/style-pack.mjs";
import { assertBuildingProgram } from "../recognition/program.mjs";
import { massSchemaJson, rerecognizeRenderArgs, parseMassReply } from "./rerecognize.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const rustic = loadStylePack(resolve(here, "..", "..", "packs", "rustic.json"));

const SOURCE = assertBuildingProgram({
  schema: "building-program/v1",
  subject: "test-subject",
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

const SKETCH = {
  schema: "form-sketch/v1",
  subject: "test-subject",
  params: { sampleScale: 48, registryScale: 48 },
  footprint: { planDims: [9, 7], polygon: [[0, 0], [9, 0], [9, 7], [0, 7]], isRectangle: true },
  pitch: { class: "pitched45", dominantTiltDeg: 45, ridgeAxis: "x", eaveLayer: 7, ridgeLayer: 12 },
  symmetry: { axis: "x", score: 0.9, threshold: 0.8, applied: true },
  proportions: {
    eaveBlocks: 12, heightBlocks: 17, eaveFrac: 0.7,
    storeyCandidates: [{ n: 3, perStoreyBlocks: 4, plausible: true }],
    massCount: 1,
    masses: [{ id: "mass-0", role: "primary",
               bbox: { minX: 0, maxX: 8, minZ: 0, maxZ: 6 },
               pitch: { class: "pitched45", dominantTiltDeg: 45 } }],
  },
};

const ISSUES = [
  { region: "roof vs walls", issue: "roof mass dominates; the build reads as mostly roof", severity: "major" },
];

const ctx = { source: SOURCE, massId: "main", pack: rustic, budget: { rounds: 6 } };

test("RR1 renderArgs: deterministic, digests + fragment + critique + the masses-item schema", () => {
  const a = rerecognizeRenderArgs({ pack: rustic, sketch: SKETCH, mass: SOURCE.masses[0], issues: ISSUES });
  const b = rerecognizeRenderArgs({ pack: rustic, sketch: SKETCH, mass: SOURCE.masses[0], issues: ISSUES });
  assert.equal(JSON.stringify(a), JSON.stringify(b), "deterministic in its inputs");
  assert.equal(a.mass_id, "main");
  assert.match(a.pack_digest, /Style pack: \*\*rustic\*\*/);
  assert.match(a.sketch_digest, /eave ≈ 12 blocks, total height ≈ 17 blocks/);
  assert.match(a.mass_json, /"id": "main"/);
  assert.match(a.critique_block, /major: roof vs walls — roof mass dominates/);
  assert.match(a.mass_schema_json, /"storeyHeight"/);
  const noIssues = rerecognizeRenderArgs({ pack: rustic, sketch: SKETCH, mass: SOURCE.masses[0], issues: [] });
  assert.match(noIssues.critique_block, /no issues recorded/);
  assert.equal(JSON.parse(massSchemaJson()).required.includes("roof"), true, "the committed schema's own fragment");
});

test("RR2 parseMassReply: a valid fragment substitutes and recompiles; budget rides", () => {
  const fragment = structuredClone(SOURCE.masses[0]);
  fragment.storeys = 3;
  const text = "```json\n" + JSON.stringify(fragment, null, 2) + "\n```";
  const r = parseMassReply(text, ctx);
  assert.equal(r.mass.storeys, 3);
  assert.equal(r.source.masses[0].storeys, 3);
  assert.equal(r.program.elements.find((e) => e.id === "main-shell").spec.height, 12);
  assert.deepEqual(r.program.budget, { rounds: 6 });
  assert.ok(Object.isFrozen(r.mass));
});

test("RR3 parseMassReply throws on every violation class (the bounded re-ask contract)", () => {
  assert.throws(() => parseMassReply("I would describe the roof differently.", ctx), /not valid JSON/);
  const offRole = structuredClone(SOURCE.masses[0]);
  offRole.roof.fieldRole = "roof.nonsense";
  assert.throws(() => parseMassReply(JSON.stringify(offRole), ctx), /not in the pack palette/);
  const renamed = structuredClone(SOURCE.masses[0]);
  renamed.id = "other";
  assert.throws(() => parseMassReply(JSON.stringify(renamed), ctx), /must keep the named part's id/);
  const offSchema = structuredClone(SOURCE.masses[0]);
  offSchema.rect.w = 1; // below the schema minimum
  assert.throws(() => parseMassReply(JSON.stringify(offSchema), ctx), /invalid building program/);
});

test("RR4 bridge smoke: ReRecognizeMass renders through the batch bridge (codegen present)", async () => {
  const { bamlRender } = await import("../baml/bridge.mjs");
  const args = rerecognizeRenderArgs({ pack: rustic, sketch: SKETCH, mass: SOURCE.masses[0], issues: ISSUES });
  const { prompt, images } = await bamlRender({ fn: "ReRecognizeMass", args, images: {} });
  assert.match(prompt, /Re-read one part of the building/);
  assert.match(prompt, /mass "main"/);
  assert.match(prompt, /roof mass dominates/);
  assert.match(prompt, /Style pack: \*\*rustic\*\*/);
  assert.deepEqual(images, [], "text-only — the sketch digest is the evidence, no GL");
});
