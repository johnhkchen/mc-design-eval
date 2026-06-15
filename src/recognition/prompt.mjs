// Recognition prompt + reply parser (T-125-01, story S-125, epic E-31). PURE — no transport
// imports (the runner owns the live call), no Date/random, fully deterministic strings.
//
// THE PROMPT TEACHES THE VOCABULARY, THE PARSER ENFORCES IT. The model sees the pack's roles
// (with their diegetic rationales), the realizable idioms with their style parameters, the
// proportion bounds, and the conditioned sketch's measured digest — then must answer in the
// building-program/v1 schema. parseProgramReply is the runReplyPolicy `parse`: fence/prose strip
// (the kit-extraction idiom), schema gate, pack-vocabulary gate — ANY violation throws, the reply
// classifies MALFORMED, and the SAME prompt is re-asked within the declared budget
// (judge-reply-policy seam: no corrective addendum, ever — the instrument stays byte-identical).
//
// MATERIAL PRECEDENCE (style-pack.mjs MATERIAL_PRECEDENCE) is taught, not hard-coded: concept
// evidence may pick any pack role for a surface (beating the vernacular default), but never a
// block outside the pack. Subject-agnostic: the subject enters only via the sketch record (data).

import { IDIOM_REGISTRY } from "../pack/idiom-registry.mjs";
import { MATERIAL_PRECEDENCE } from "../pack/style-pack.mjs";
import {
  ROOF_LAYOUTS,
  assertBuildingProgram,
  validateProgramAgainstPack,
  loadProgramSchema,
} from "./program.mjs";

/** Reduce a model reply to its bare JSON object text (the kit-extract / stripToJson idiom). */
export function stripReplyToJson(text) {
  let s = String(text).trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!s.startsWith("{")) {
    const lo = s.indexOf("{");
    const hi = s.lastIndexOf("}");
    if (lo >= 0 && hi > lo) s = s.slice(lo, hi + 1);
  }
  return s;
}

/** The measured digest of a conditioned form sketch (form-sketch/v1) — the numbers the model
 *  reads its dimensions from. PURE; renders missing optional fields as "—". */
export function sketchDigest(sketch) {
  const fp = sketch.footprint;
  const pr = sketch.proportions;
  const storeys = pr.storeyCandidates.filter((c) => c.plausible)
    .map((c) => `${c.n} storeys (~${c.perStoreyBlocks} blocks each)`)
    .join(", ") || "—";
  return [
    `subject: ${sketch.subject}`,
    `plan: ${fp.planDims[0]}×${fp.planDims[1]} cells (sample scale ${sketch.params.sampleScale}; ` +
      `working block scale ${sketch.params.registryScale} — sizes below are already in BLOCKS where named so)`,
    `footprint polygon (plan cells): ${JSON.stringify(fp.polygon)}${fp.isRectangle ? " (clean rectangle)" : ""}`,
    `roof pitch read: ${sketch.pitch.class} (dominant tilt ${sketch.pitch.dominantTiltDeg}°), ridge axis ${sketch.pitch.ridgeAxis}`,
    `eave ≈ ${pr.eaveBlocks} blocks, total height ≈ ${pr.heightBlocks} blocks (eave fraction ${pr.eaveFrac})`,
    `plausible storey counts: ${storeys}`,
    `mirror symmetry: axis ${sketch.symmetry.axis}, score ${sketch.symmetry.score} (threshold ${sketch.symmetry.threshold}) — ` +
      (sketch.symmetry.applied ? "applied" : "below threshold"),
    `bodies: ${pr.massCount} (${pr.masses.map((m) => m.role).join(", ") || "single"})`,
  ].join("\n");
}

/** The pack-vocabulary digest: roles with diegetic rationales, realizable idioms, proportions. */
export function packDigest(pack, { registry = IDIOM_REGISTRY } = {}) {
  const roleLines = pack.palette.map((p) => `- \`${p.role}\` → ${p.block}: ${p.rationale}`);
  const roofs = Object.keys(ROOF_LAYOUTS).filter((n) => pack.idioms.some((i) => i.name === n));
  const passes = pack.idioms.filter((i) => registry[i.name]?.kind === "pass").map((i) => i.name);
  const pr = pack.proportions;
  return [
    `Style pack: **${pack.style}** — ${pack.provenance.setting}`,
    "",
    "Palette ROLES (your program names roles, NEVER block ids; the realizer resolves them):",
    ...roleLines,
    "",
    `Roof idioms available: ${roofs.join(", ")} (ridge-bearing roofs need ridgeAxis).`,
    `Wall-surface treatments (recorded for the workshop's dressing passes): ${passes.join(", ") || "none"}.`,
    `Proportions: storey height ${pr.storeyHeight.min}–${pr.storeyHeight.max} blocks; ` +
      `pitch classes ${JSON.stringify(pr.pitchClasses)} (rise per run — your pitchClass MUST be one of these); ` +
      `opening spacing ${pr.openingRhythm.minSpacing}–${pr.openingRhythm.maxSpacing} cells edge-to-edge.`,
    "",
    `Material precedence: ${MATERIAL_PRECEDENCE.join(" > ")} — what you SEE in the concept picks the role ` +
      "(e.g. a dressed-stone ground storey where the style's default is rubble), but every choice stays a pack role.",
  ].join("\n");
}

/**
 * The schema the BASE recognition pass shows the model: the program schema MINUS the optional
 * `facade` block AND the optional `style` field. The facade grammar is a SEPARATE second pass
 * (T-145-01, src/recognition/facade-grammar.mjs); the base pass never authors it. `style` is NOT
 * model-authored either — it is stamped at the recognition seam from the conditioning pack
 * (T-165-01, E-39). Stripping both keeps the base prompt byte-identical to the pre-E-35 instrument
 * (the FX-R1 sha pins). Returns a fresh object; the committed schema is untouched. PURE.
 */
export function baseRecognitionSchema(schema = loadProgramSchema()) {
  const s = structuredClone(schema);
  delete s.properties?.masses?.items?.properties?.facade;
  delete s.properties?.style;
  return s;
}

/**
 * The recognition prompt's DATA — the typed inputs of the BAML function
 * RecognizeBuildingProgram (baml_src/recognition.baml, T-129-01). The prose skeleton lives in
 * the BAML template; this serializes the live objects into its string params. The fixture test
 * pins the rendered prompt's sha256 against the committed recognition records.
 * @param {{pack:object, sketch:object, schemaJson?:object}} p
 * @returns {{pack_digest:string, sketch_digest:string, schema_json:string}}
 */
export function recognitionRenderArgs({ pack, sketch, schemaJson = baseRecognitionSchema() }) {
  return {
    pack_digest: packDigest(pack),
    sketch_digest: sketchDigest(sketch),
    schema_json: JSON.stringify(schemaJson, null, 2),
  };
}

/**
 * THE runReplyPolicy PARSE for the recognition seam: strip → JSON-parse → schema gate →
 * pack-vocabulary gate. Throws on any violation (the precise message is the ledger's evidence);
 * returns the validated, frozen program.
 * @param {string} text  raw model reply
 * @param {{pack:object, registry?:object}} opts
 */
export function parseProgramReply(text, { pack, registry } = {}) {
  if (!pack) throw new Error("parseProgramReply: opts.pack is required");
  const program = assertBuildingProgram(stripReplyToJson(text));
  const { ok, findings } = validateProgramAgainstPack(program, pack, registry ? { registry } : {});
  if (!ok) {
    throw new Error(
      `program is off the pack vocabulary:\n` +
      findings.map((f) => `  at ${f.where}: ${f.msg}`).join("\n"),
    );
  }
  return program;
}
