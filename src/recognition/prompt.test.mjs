// Unit tests — recognition prompt + reply parser (T-125-01). Pure; committed-file IO only
// (the rustic pack + a committed form sketch as fixtures — never a fit target, just digest data).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadStylePack } from "../pack/style-pack.mjs";
import { BUILDING_PROGRAM_SCHEMA } from "./program.mjs";
import {
  recognitionRenderArgs,
  baseRecognitionSchema,
  packDigest,
  sketchDigest,
  stripReplyToJson,
  parseProgramReply,
} from "./prompt.mjs";
import { loadProgramSchema } from "./program.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..");
const pack = loadStylePack(resolve(root, "packs", "rustic.json"));

/** A synthetic form-sketch/v1 digest fixture — only the fields sketchDigest reads. */
const sketch = {
  schema: "form-sketch/v1",
  subject: "test-subject",
  params: { sampleScale: 48, registryScale: 32 },
  footprint: { planDims: [40, 48], polygon: [[0, 0], [40, 0], [40, 48], [0, 48]], isRectangle: true },
  pitch: { class: "pitched45", dominantTiltDeg: 44.1, ridgeAxis: "x" },
  proportions: {
    eaveBlocks: 8, heightBlocks: 14, eaveFrac: 0.57, massCount: 1, masses: [{ role: "primary" }],
    storeyCandidates: [{ n: 2, perStoreyBlocks: 4, plausible: true }, { n: 5, perStoreyBlocks: 1.6, plausible: false }],
  },
  symmetry: { axis: "x", score: 0.91, threshold: 0.8, applied: true },
};

const validReply = JSON.stringify({
  schema: BUILDING_PROGRAM_SCHEMA,
  subject: "test-subject",
  pack: "rustic",
  reading: { summary: "banded two-storey mass under a 45° gable" },
  masses: [{
    id: "main",
    rect: { x0: 0, z0: 0, w: 13, d: 9 },
    storeys: 2,
    storeyHeight: 4,
    walls: { ground: { role: "wall.field.ground" }, upper: { role: "wall.infill.upper" } },
    roof: { idiom: "roof.gable", ridgeAxis: "x", pitchClass: 1, fieldRole: "roof.field" },
    openings: [],
  }],
});

// The prompt SKELETON moved to baml_src/recognition.baml (T-129-01); the full rendered prompt
// is sha-pinned to the committed records by src/baml/fixtures.test.mjs. These tests pin the
// DATA the template interpolates — the typed args of the BAML function.
test("render args are deterministic and carry the whole vocabulary", () => {
  const a = recognitionRenderArgs({ pack, sketch });
  const b = recognitionRenderArgs({ pack, sketch });
  assert.deepEqual(a, b);
  for (const p of pack.palette) assert.ok(a.pack_digest.includes(`\`${p.role}\``), `role ${p.role} taught`);
  for (const name of ["roof.gable", "roof.hip", "roof.pyramid"]) assert.ok(a.pack_digest.includes(name));
  assert.ok(a.pack_digest.includes("timber-frame"), "treatments taught");
  assert.ok(a.schema_json.includes('"building-program/v1"'), "schema embedded");
  assert.ok(a.pack_digest.includes("pitch classes [1,2]"), "pitch vocabulary taught"); // T-141-01: rustic gained class 2
  assert.ok(a.pack_digest.includes("concept-evidence > pack-assignment > vernacular-default"));
});

test("the base recognition prompt excludes the facade block (it is a separate pass — T-145-01)", () => {
  // The facade grammar is authored by src/recognition/facade-grammar.mjs, NOT the base pass. The base
  // prompt's schema must stay byte-identical to the pre-E-35 instrument (the FX-R1 sha pins), so the
  // optional `facade` property is stripped from the schema the base pass shows the model.
  const stripped = baseRecognitionSchema();
  assert.equal(stripped.properties.masses.items.properties.facade, undefined);
  // and the committed schema itself is untouched (facade still present on disk)
  assert.ok(loadProgramSchema().properties.masses.items.properties.facade, "committed schema keeps facade");
  // the render args' schema_json carries no facade text
  assert.ok(!recognitionRenderArgs({ pack, sketch }).schema_json.includes('"facade"'));
});

test("render args embed the sketch digest numbers", () => {
  const a = recognitionRenderArgs({ pack, sketch });
  assert.ok(a.sketch_digest.includes("40×48 cells"));
  assert.ok(a.sketch_digest.includes("pitched45"));
  assert.ok(a.sketch_digest.includes("eave ≈ 8 blocks, total height ≈ 14 blocks"));
  assert.ok(a.sketch_digest.includes("2 storeys (~4 blocks each)"));
  assert.ok(!a.sketch_digest.includes("5 storeys"), "implausible candidates filtered");
});

test("sketchDigest reads a COMMITTED sketch record's shape (contract with form-sketch/v1)", () => {
  // Any committed sketch works; pick deterministically (first by name) — digest data, never a target.
  const dir = resolve(root, "benchmarks", "sculpture", "form-sketch");
  const first = readdirSync(dir).filter((f) => f.endsWith(".json")).sort()[0];
  const committed = JSON.parse(readFileSync(resolve(dir, first), "utf8"));
  const d = sketchDigest(committed);
  assert.match(d, /subject: /);
  assert.match(d, /roof pitch read: /);
  assert.match(d, /plausible storey counts: \d/);
});

test("stripReplyToJson: fences, prose brackets, clean passthrough", () => {
  assert.equal(stripReplyToJson('```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(stripReplyToJson('Sure! Here it is: {"a":1} — done.'), '{"a":1}');
  assert.equal(stripReplyToJson('{"a":1}'), '{"a":1}');
});

test("parseProgramReply: valid reply → frozen program; violations throw with evidence", () => {
  const program = parseProgramReply("```json\n" + validReply + "\n```", { pack });
  assert.equal(program.subject, "test-subject");
  assert.ok(Object.isFrozen(program));

  assert.throws(() => parseProgramReply("I would build something lovely!", { pack }), /invalid_json|invalid building program/);
  const offSchema = validReply.replace('"storeys":2', '"storeys":99');
  assert.notEqual(offSchema, validReply);
  assert.throws(() => parseProgramReply(offSchema, { pack }), /invalid building program/);
  const offPack = validReply.replace("wall.field.ground", "wall.marble");
  assert.throws(() => parseProgramReply(offPack, { pack }), /off the pack vocabulary[\s\S]*wall.marble/);
});
