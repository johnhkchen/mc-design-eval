// THE re-recognize EXCHANGE CONTRACT (T-136-01, story S-136, epic E-33) — the seam T-126
// declared and T-127's round 3 reached for. The model names a part; the runner re-samples THAT
// MASS through recognition's native channel (the conditioned sketch digest — T-123's
// measurements are the evidence, no images, no GL) with the round's critique attached; the
// fragment passes the SAME gates every recognized program passes (schema + pack vocabulary,
// via whole-program substitution) and replaces that part of the source. Raw replies are the
// round's ledger material (the T-114 pattern: bounded SAME-prompt re-asks — a malformed
// fragment throws here and judge-reply re-asks within MAX_REPLY_ATTEMPTS).
//
// PURE — prompt DATA + reply PARSE only. The transport (BAML render, tiered shim, reply policy)
// is the RUNNER's; ISO4 keeps it out of the core. Replay never lands here: an accepted fragment
// is carried verbatim in the ledger and re-applied through geometry.substituteMass.

import { packDigest, sketchDigest, stripReplyToJson } from "../recognition/prompt.mjs";
import { loadProgramSchema } from "../recognition/program.mjs";
import { substituteMass } from "./geometry.mjs";

const fail = (msg) => { throw new Error(`rerecognize: ${msg}`); };

/** The masses-item subschema — the fragment's shape contract, extracted from the committed
 *  building-program schema (one source of truth; never restated). */
export function massSchemaJson(schemaJson = loadProgramSchema()) {
  const items = schemaJson?.properties?.masses?.items;
  if (!items) fail("building-program schema carries no masses.items — cannot scope the fragment");
  return JSON.stringify(items, null, 2);
}

/**
 * The fragment prompt's DATA — the typed inputs of the BAML function ReRecognizeMass
 * (baml_src/rerecognize.baml). Deterministic in its inputs; the SAME rendered prompt is re-sent
 * on a bounded re-ask (the reply policy's contract).
 * @param {{pack:object, sketch:object, mass:object, issues:object[]}} p
 *   issues: the round's critique issues (region/issue/severity) — the attached context
 */
export function rerecognizeRenderArgs({ pack, sketch, mass, issues }) {
  if (!mass?.id) fail("renderArgs needs the current mass (the part being re-recognized)");
  return {
    mass_id: mass.id,
    pack_digest: packDigest(pack),
    sketch_digest: sketchDigest(sketch),
    mass_json: JSON.stringify(mass, null, 2),
    critique_block: (issues ?? [])
      .map((i) => `  - ${i.severity}: ${i.region} — ${i.issue}`)
      .join("\n") || "  (no issues recorded this round)",
    mass_schema_json: massSchemaJson(),
  };
}

/**
 * THE runReplyPolicy PARSE for the fragment seam: strip → JSON → substitute into the source →
 * the whole-program gates (assertBuildingProgram + validateProgramAgainstPack) + recompile.
 * Throws on any violation (MALFORMED — the bounded re-ask). Returns the accepted fragment plus
 * the substituted, recompiled pair the applier hands the loop.
 * @param {string} text  raw model reply
 * @param {{source:object, massId:string, pack:object, budget:{rounds:number},
 *          proportions?:object|null}} ctx
 * @returns {{mass:object, program:object, source:object}}
 */
export function parseMassReply(text, { source, massId, pack, budget, proportions = null }) {
  let mass;
  try {
    mass = JSON.parse(stripReplyToJson(text));
  } catch (e) {
    fail(`fragment reply is not valid JSON: ${e.message}`);
  }
  const r = substituteMass({ source, pack, budget, proportions }, { massId, mass });
  return { mass: Object.freeze(structuredClone(mass)), program: r.program, source: r.source };
}
