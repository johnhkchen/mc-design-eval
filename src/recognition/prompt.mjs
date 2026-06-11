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
 * Build the one recognition prompt. Deterministic; the runner commits it verbatim (the AC's
 * "prompt documented") and hashes it into the reply ledger.
 * @param {{pack:object, sketch:object, schemaJson?:object}} p
 * @returns {string}
 */
export function buildRecognitionPrompt({ pack, sketch, schemaJson = loadProgramSchema() }) {
  return [
    "# Read the building, write the program",
    "",
    "You are the recognition stage of a Minecraft pattern-book builder. Two images follow:",
    "1. the CONCEPT ART — authoritative for what the building IS: its idioms, materials, rhythm;",
    "2. the CONDITIONED FORM SKETCH — orthographic plan + elevations of a rough 3-D read (gray =",
    "   occupancy, black = raw mesh outline, red = footprint, blue = mirror axis, green/purple =",
    "   eave/ridge). It informs sizes and massing; it is EVIDENCE, never a target to copy —",
    "   recognize the canonical form (\"that lumpy thing is a gable roof\") and substitute it cleanly.",
    "",
    "Author the BUILDING PROGRAM: decompose the building into 1–4 rectangular masses (plan",
    "coordinates of your choice — anchor near the origin; masses must touch), and for each give",
    "storeys, wall bands, plinth/jetty where seen, the roof idiom with pitch class and dormers,",
    "chimney, and the openings per wall (count/size/sill/head). Use the sketch's measured digest",
    "for sizes; round to clean, regular numbers — regularity beats mesh fidelity, always.",
    "",
    packDigest(pack),
    "",
    "## The sketch's measured digest",
    "",
    sketchDigest(sketch),
    "",
    "## Output format — STRICT",
    "",
    "Output a SINGLE JSON object conforming to the JSON Schema below, and NOTHING ELSE — your",
    "first character must be `{` and your last `}`. No prose, no code fences, no commentary.",
    "Put your recognition reasoning in `reading.summary`.",
    "",
    "JSON Schema:",
    JSON.stringify(schemaJson, null, 2),
    "",
    "Now output ONLY the JSON object, beginning with `{`.",
  ].join("\n");
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
