// Facade-grammar recognition — prompt builder + reply parser (T-145-01, story S-145, epic E-35).
// PURE — no transport imports (the runner owns the live call), no Date/random; deterministic strings.
//
// THE SECOND RECOGNITION PASS. Stage 3 first writes the building program (masses, roof, openings —
// src/recognition/prompt.mjs). This pass adds the FACADE GRAMMAR the single concept view can't fully
// carry: per-face rhythm (pilaster/stud spacing), panel fields, quoins, course lines, eave overhang,
// per-storey jetty depth, and openings on a rhythm — on the back/sides the concept never shows. The
// model reads the concept (front, authoritative) AND multi-angle TEXTURED-GLB renders for SPATIAL
// LAYOUT (where the articulation falls) — the 2026-06-14 ratified narrowing of "textures never read":
// layout evidence, never material identity. Each face records which evidence sourced it.
//
// THE PROMPT TEACHES, THE PARSER ENFORCES. The model sees the program's masses, which faces are seen
// vs unseen, the pack's admissible roles + articulation bounds, and the facade sub-schema; it answers
// a {massId → facade} map. parseFacadeReply is the runReplyPolicy `parse`: strip → merge → schema gate
// → pack-vocabulary + diegetic gate. ANY violation throws → the reply classifies MALFORMED and the
// SAME prompt is re-asked within the budget (T-114 judge-reply seam — no corrective addendum, ever).
//
// MATERIALS STAY DIEGETIC. The facade names ROLES only (the schema forbids a block field); a textured
// render can inform geometry but has nowhere to inject a material. assertFacadeDiegetic proves it.

import { MAX_REPLY_ATTEMPTS } from "../form/judge-reply.mjs";
import { BUILDING_VIEW_3Q } from "../building.mjs";
import {
  assertBuildingProgram,
  validateProgramAgainstPack,
  facadeBounds,
  loadProgramSchema,
} from "./program.mjs";
import { stripReplyToJson } from "./prompt.mjs";

/** The DECLARED re-ask budget (AC #5): 1 ask + bounded re-asks, the T-114 ledger pattern. */
export const FACADE_REPLY_BUDGET = MAX_REPLY_ATTEMPTS;

/** All four wall faces, in a fixed order (the record's canonical sequence). */
export const ALL_WALLS = Object.freeze(["+x", "-x", "+z", "-z"]);

/**
 * Which faces the single 3/4 concept view shows vs the faces only the textured GLB can reach. A
 * REGISTRY-level fact (the concept camera azimuth, `config.BUILDING_VIEW_3Q`), not a per-building
 * one: a camera looking from the +x+z quadrant sees the +x and +z faces; the -x and -z faces are
 * unseen. PURE; subject-agnostic.
 * @returns {{seen:string[], unseen:string[]}}
 */
export function unseenFaces() {
  const az = ((BUILDING_VIEW_3Q.azimuthDeg % 360) + 360) % 360;
  // The camera at azimuth `az` looks toward the build; faces on the camera side are seen. The 3/4
  // building view sits in the +x+z quadrant (az≈45) → +x and +z are lit; the opposite pair is dark.
  const seen = [];
  if (az > 270 || az < 90) seen.push("+z");
  if (az > 90 && az < 270) seen.push("-z");
  if (az > 0 && az < 180) seen.push("+x");
  if (az > 180 && az < 360) seen.push("-x");
  const seenSet = new Set(seen);
  return { seen: seen.slice().sort(), unseen: ALL_WALLS.filter((w) => !seenSet.has(w)) };
}

/** The facade sub-schema (masses[].facade), extracted from the committed program schema — the typed
 *  shape the model answers in, without the whole program schema's noise. PURE (committed-file read). */
export function facadeSubSchema(schema = loadProgramSchema()) {
  return schema.properties.masses.items.properties.facade;
}

/** The pack-vocabulary digest for the facade pass: admissible roles, the articulation bounds, and the
 *  seen/unseen split. The prompt's prose skeleton; the parser enforces every claim. PURE. */
export function facadeDigest(program, pack, { seenFaces = unseenFaces() } = {}) {
  const b = facadeBounds(pack);
  const roleLines = pack.palette.map((p) => `- \`${p.role}\``);
  const massLines = program.masses.map((m) =>
    `- mass \`${m.id}\`: ${m.rect.w}×${m.rect.d} plan, ${m.storeys}×${m.storeyHeight}-block storeys` +
    `${m.jetty ? `, jettied on ${m.jetty.walls.join("/")}` : ""}`);
  return [
    `Style pack: **${pack.style}** — ${pack.provenance.setting}`,
    "",
    "The building program (already recognized) — add a facade grammar to each mass:",
    ...massLines,
    "",
    `Concept view shows faces: ${seenFaces.seen.join(", ")} (authoritative). ` +
      `Faces ${seenFaces.unseen.join(", ")} are unseen by the concept — read the textured-GLB ` +
      "multi-angle renders for their SPATIAL LAYOUT (where studs/courses/openings fall), and tag " +
      "those faces `evidence.source: \"textured-glb\"`, `layoutOnly: true`. Texture informs LAYOUT, " +
      "never material — every material is a pack ROLE below.",
    "",
    "Material ROLES (the facade names roles, NEVER block ids):",
    ...roleLines,
    "",
    `Articulation bounds (pack-carried): member spacing period ${b.periodMin}–${b.periodMax} cells; ` +
      `eave overhang ≤ ${b.maxOverhang}; jetty depth ≤ ${b.maxJettyDepth}; quoin run ≤ ${b.maxQuoinRun}. ` +
      "rhythm is EITHER {period, phase} OR {count}. One face entry per wall.",
    "",
    "If a face cannot be read from either the concept or the GLB, set " +
      "`evidence.source: \"pack-idealised\"` (the honest fallback — a named state, never a silent default).",
  ].join("\n");
}

/**
 * The facade pass's render DATA — the live request's text params (images are concept + the textured-GLB
 * azimuth renders, attached by the runner). PURE.
 * @param {{program:object, pack:object, sketch?:object, schemaJson?:object}} p
 * @returns {{facade_digest:string, schema_json:string}}
 */
export function facadeRenderArgs({ program, pack, schemaJson = facadeSubSchema() }) {
  return {
    facade_digest: facadeDigest(program, pack),
    schema_json: JSON.stringify(schemaJson, null, 2),
  };
}

/**
 * Merge a `{massId → facade}` map into a clone of the program (PURE; the input is never mutated).
 * Unknown mass ids throw — the model must name a mass that exists.
 * @param {object} program
 * @param {Record<string, object>} facadeByMass
 * @returns {object} a new program with facade blocks attached
 */
export function mergeFacade(program, facadeByMass) {
  if (facadeByMass === null || typeof facadeByMass !== "object" || Array.isArray(facadeByMass)) {
    throw new Error("mergeFacade: facade map must be an object of {massId: facade}");
  }
  const ids = new Set(program.masses.map((m) => m.id));
  for (const id of Object.keys(facadeByMass)) {
    if (!ids.has(id)) throw new Error(`mergeFacade: facade names unknown mass "${id}" (have: ${[...ids].join(", ")})`);
  }
  const next = structuredClone(program);
  for (const m of next.masses) {
    if (Object.prototype.hasOwnProperty.call(facadeByMass, m.id)) m.facade = structuredClone(facadeByMass[m.id]);
  }
  return next;
}

/**
 * THE runReplyPolicy PARSE for the facade seam: strip → JSON-parse a `{facades:{massId:facade}}` map →
 * merge into the base program → schema gate → pack-vocabulary + diegetic gate. Throws on any violation
 * (the precise message is the ledger's evidence); returns the merged, validated program.
 * @param {string} text   raw model reply
 * @param {{program:object, pack:object, registry?:object}} opts  `program` is the recognized base
 */
export function parseFacadeReply(text, { program, pack, registry } = {}) {
  if (!program) throw new Error("parseFacadeReply: opts.program (the recognized base) is required");
  if (!pack) throw new Error("parseFacadeReply: opts.pack is required");
  let payload;
  try {
    payload = JSON.parse(stripReplyToJson(text));
  } catch (e) {
    throw new Error(`facade reply is not JSON: ${e.message}`);
  }
  const facades = payload?.facades;
  if (facades === undefined) throw new Error('facade reply must be {"facades": {massId: facade}}');
  const merged = assertBuildingProgram(mergeFacade(program, facades));
  const { ok, findings } = validateProgramAgainstPack(merged, pack, registry ? { registry } : {});
  if (!ok) {
    throw new Error(
      "facade grammar is off the pack vocabulary:\n" +
      findings.map((f) => `  at ${f.where}: ${f.msg}`).join("\n"),
    );
  }
  return merged;
}
