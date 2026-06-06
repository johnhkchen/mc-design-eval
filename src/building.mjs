// vConcept BUILDING mode (T-067-01, E-20 / story S-067) — the PURE surface.
//
// The THIRD vConcept framing. `vConcept` so far handles facades (a head-on front elevation) and
// sculptures (a freestanding 3/4 object). A BUILDING is a whole structure IN THE ROUND — four sides,
// a roof, real depth — imagined as a design document (no reference photo) → ONE 3/4 CONCEPT image
// (Nano Banana, via the BAML BuildingConceptPrompt) of a SINGLE complete building → a 3-D
// DesignArtifact built grounded on that one view, and (the E-20 point) a TRELLIS GLB the GLB→voxel
// pipeline places as bulk. It REUSES the proven sculpture seams (requestText /
// requestDesignArtifactWithImage / generateImage / renderArtifact / renderOrbit·oscillateAzimuths) —
// only the SUBJECT FRAMING is new: a building, not a tabletop object.
//
// SINGLE-BUILDING / SINGLE-VIEW (a hard constraint, the load-bearing lesson): the concept is ONE
// complete building in ONE 3/4 view — never a turnaround, contact sheet, or multi-view elevation grid.
// The moai's duplicate-mass / hallucinated-connector mess came from a multi-view contact sheet; a
// building contact sheet would yield multiple buildings + invented connectors. The back and far side
// are the model's plausible RECONSTRUCTION from the single view (the same standing case as sculpture,
// the case TRELLIS exists to serve). The build prompt states this; the README documents it.
//
// This module mirrors src/sculpture.mjs: a frozen descriptor + PURE prompt builders + spec/scale
// validation, all SDK- and GL-free so the test glob (`src/**/*.test.mjs`) exercises every line without
// billing a model or loading GL. The one live/metered/GL runner is benchmarks/sculpture/run.mjs
// (--mode building), which imports this. `metadataPinLines` is reused from sculpture.mjs (generic).

import { PHASE1_MODEL_ID, VCONCEPT_BUILDING_METHOD_ID } from "./config.mjs";
import { metadataPinLines } from "./sculpture.mjs";

/**
 * The archetype descriptor. `id` is single-sourced from config.mjs so there is exactly one spelling of
 * this archetype's identity; the `.v1` suffix versions the doc/concept/build prompt construction below
 * (any change that could move results bumps it → `.v2`).
 * @type {Readonly<{ id: string, version: number, label: string }>}
 */
export const VCONCEPT_BUILDING = Object.freeze({
  id: VCONCEPT_BUILDING_METHOD_ID, // "vconcept-building.v1"
  version: 1,
  label: "vConcept building (term → 3/4 concept → whole building in the round)",
});

/** Target longest-edge bounds (blocks). A whole building needs more extent than a tabletop object;
 *  below 16 no architectural massing survives voxelization, and above 96 the render/token budget and
 *  the single-view reconstruction both degrade (typical runs sit at 48–64). */
export const BUILDING_SCALE_MIN = 16;
export const BUILDING_SCALE_MAX = 96;
export const BUILDING_DEFAULT_SCALE = 48;

/** Fixed bookkeeping a subject needs (subject + scale come from the CLI). seed is held constant across
 *  subjects — matching sculpture — so a Phase-2 model sweep is the only moving part. */
export const BUILDING_DEFAULTS = Object.freeze({
  seed: 17,
  serverStateId: "flat-creative-superflat.v1",
});

/** The canonical three-quarter still framing — shared with sculpture: a building in the round reads at
 *  the same 3/4 angle (two faces + roof), slightly from above. */
export const BUILDING_VIEW_3Q = Object.freeze({ azimuthDeg: 45, elevationDeg: 30, fov: 45 });

/** Front-arc "rock" turntable — shared with sculpture: a gentle sinusoidal sweep CENTERED on the 3/4
 *  still's azimuth, staying in the front hemisphere (centerDeg ± amplitudeDeg = 5°..85°) so the imagined
 *  back is never paraded. */
export const BUILDING_TURNTABLE = Object.freeze({
  centerDeg: 45,
  amplitudeDeg: 40,
  frames: 24,
  elevationDeg: 30,
  fov: 45,
});

/**
 * Validate + normalize a building spec before any metered work. A misconfigured run must fail here,
 * not after a billed call. Throws a field-named Error prefixed `building:`.
 * @param {{ subject?: string, scale?: number }} spec
 * @returns {{ subject: string, scale: number }} the trimmed/validated pair
 */
export function assertBuildingSpec(spec) {
  const s = spec || {};
  const subject = typeof s.subject === "string" ? s.subject.trim() : "";
  if (!subject) {
    throw new Error(`building: spec.subject must be a non-empty string (got ${JSON.stringify(s.subject)})`);
  }
  const scale = s.scale;
  if (!Number.isInteger(scale) || scale < BUILDING_SCALE_MIN || scale > BUILDING_SCALE_MAX) {
    throw new Error(
      `building: spec.scale must be an integer in [${BUILDING_SCALE_MIN}, ${BUILDING_SCALE_MAX}] (got ${JSON.stringify(scale)})`,
    );
  }
  return { subject, scale };
}

/**
 * Per-axis bounding caps for a building whose target LONGEST edge is `scale` blocks. PURE — this is the
 * "scale wiring" the AC asks to unit-test. The numeric cap stays cubic (every axis = scale): the longest
 * edge is what the size brief and TRELLIS care about, and a non-cubic cap would bake in an architectural
 * assumption that excludes towers. The prompt narrates footprint-vs-height proportion in prose. Validates
 * its input the same way assertBuildingSpec does so a caller cannot get silent garbage.
 * @param {number} scale target longest edge in blocks
 * @returns {{ maxW: number, maxH: number, maxD: number }}
 */
export function buildingScaleCaps(scale) {
  if (!Number.isInteger(scale) || scale < BUILDING_SCALE_MIN || scale > BUILDING_SCALE_MAX) {
    throw new Error(`buildingScaleCaps: scale must be an integer in [${BUILDING_SCALE_MIN}, ${BUILDING_SCALE_MAX}] (got ${scale})`);
  }
  return { maxW: scale, maxH: scale, maxD: scale };
}

/** A filesystem-safe, lexically-sortable run id for a building subject. PURE. Uses a `vBuilding` infix
 *  (vs sculpture's `vConcept`) so building runs never collide by slug with sculpture runs in the shared
 *  runs/ dir, and provenance stays greppable. */
export function runIdForBuilding(seq, subject) {
  const slug = String(subject).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "subject";
  return `${String(seq).padStart(3, "0")}-vBuilding-${slug}`;
}

/**
 * The metadata this archetype pins on the artifact (shared identity for the build stage). PURE.
 * `prompting_method_id` is THIS archetype so the produced artifact is attributable.
 * NOTE: `metadata.target` is DELIBERATELY not set. In the live schema it is an ENUM
 * (`house | path | landscape`) — pinning the subject term there would FAIL the AJV gate (the
 * build-prompt schema is looser than the live gate). The per-subject join key is carried by `trial_id`
 * (the run id embeds the subject slug) and by the benchmark's summary.json instead.
 * @param {{ runId: string, model?: string }} p
 * @returns {import("./artifact.mjs").Metadata}
 */
export function buildingMetadata({ runId, model }) {
  return {
    trial_id: runId,
    prompting_method_id: VCONCEPT_BUILDING.id,
    model_id: model || PHASE1_MODEL_ID,
    seed: BUILDING_DEFAULTS.seed,
    server_state_id: BUILDING_DEFAULTS.serverStateId,
  };
}

/**
 * Stage 1 — the imagined DESIGN DOCUMENT prompt for a WHOLE BUILDING (no reference photo). PURE.
 * Mirrors the sculpture design-doc's grounded-reasoning + color-theory palette discipline, but every
 * clause is about a building in the round — the four elevations + roof, the footprint, a stable ground
 * footing — and explicitly ONE building, not a campus. `scale` sets the size brief.
 * @param {{ subject: string, scale: number }} spec
 * @returns {string}
 */
export function composeBuildingDesignDocPrompt(spec) {
  const { subject, scale } = assertBuildingSpec(spec);
  return [
    "You are a master architect and worldbuilder. BEFORE building anything, write a tight DESIGN",
    "DOCUMENT for a WHOLE MINECRAFT-BLOCK BUILDING of the subject below — a single complete structure",
    "you would view IN THE ROUND from any side (all four elevations and the roof), NOT a single front",
    "wall or facade, and NOT a campus, street, or cluster of buildings. Output ONLY the document",
    "(markdown); no block list, JSON, or build yet.",
    "",
    "## Subject",
    `A block-built building of: ${subject}.`,
    `Target size: about ${scale} blocks along its LONGEST dimension — a whole structure built in the`,
    "round so it reads as a real building from every side, with a clear roof and footprint.",
    "",
    "## Cover each, concisely and with REASONS (not just adjectives)",
    "1. **Read of the building** — what this structure fundamentally IS: its building type and era, its",
    "   essential massing, and the one or two features that make it instantly recognizable as the subject",
    "   (so a viewer names it at a glance).",
    "2. **Form & proportion (in the round)** — the major masses and how they stack/join in x/y/z; the",
    "   FOOTPRINT (width × depth) and overall HEIGHT and their ratio; how each of the FOUR ELEVATIONS and",
    "   the ROOF read (roof form: gable / hip / flat / dome / stepped); the entry side. How it sits: a",
    "   stable ground footing at the base, not floating or top-heavy.",
    "3. **Color palette (apply color theory)** — 3–5 Minecraft 1.20.1 blocks: a dominant wall/structure",
    "   block, 1–2 supporting (roof, trim), and a sparing accent. Name the harmony and WHY it suits the",
    "   building. Map each to a concrete named block. Restraint and hierarchy over a rainbow.",
    "4. **Surface & architectural detail** — 1–2 recurring motifs and where they appear, at BLOCK scale:",
    "   the window/door rhythm and framing, cornice/banding, roof texture, buttresses or pilasters",
    "   (anything finer than a whole block will not survive voxelization — design bold and chunky).",
    "5. **Block-budget plan** — roughly how the ~" + scale + "-block longest edge is spent across walls,",
    "   roof, and openings, so the build stays one compact, readable structure within its footprint.",
    "",
    "FINALIZE the document — firm decisions, no open options. Keep it under ~350 words.",
  ].join("\n");
}

/**
 * Stage 3 — the 3-D BUILD prompt: realize the finalized doc as a whole building, grounded on the
 * attached 3/4 concept image. PURE. Full x/y/z occupancy, in the round (four sides + roof + depth), NOT
 * a facade/relief/wall, and ONE building (not a campus). States the single-view limitation to the model.
 * Scale caps come from buildingScaleCaps; metadata is pinned for attribution.
 * @param {{ subject: string, scale: number, designDoc: string, runId: string, model?: string }} p
 * @returns {string}
 */
export function composeBuildingBuildPrompt({ subject, scale, designDoc, runId, model }) {
  const { subject: subj, scale: sc } = assertBuildingSpec({ subject, scale });
  const { maxW, maxH, maxD } = buildingScaleCaps(sc);
  const meta = buildingMetadata({ runId, model });
  return [
    "You are a master Minecraft architect. Build a WHOLE 3-D BUILDING as a structured design artifact",
    `that faithfully realizes the subject "${subj}" — its massing, proportion, roof, palette, and`,
    "architectural detail — per the finalized design document and the attached CONCEPT IMAGE. This is a",
    "complete STRUCTURE IN THE ROUND: it occupies all three axes and must read as a real building from",
    "every side, with all four elevations and a finished roof. It is NOT a facade, wall, relief, or scene,",
    "and it is ONE building — not a campus, street, courtyard complex, or cluster of structures.",
    "",
    "## Orientation (a building in the round, not a facade)",
    "Build a fully three-dimensional structure in x/y/z, centered on a local origin (x = 0, z = 0),",
    "sitting on the ground at y = 0. Model the WHOLE building — front, back, both sides, and the roof —",
    "as real volume with real depth: four walls enclosing a footprint, a roof on top, framed openings.",
    "There is no privileged 'front plane' and no relief-into-a-wall: massing projects in every direction",
    "as the form needs. Give it depth, not a single thin face.",
    "",
    "## Single-view limitation (read this)",
    "The attached concept shows ONE 3/4 view — two faces and the roof. The back and the far side are NOT",
    "depicted — infer them as a plausible, coherent continuation of the visible building (mirror symmetric",
    "features where the building is symmetric; keep the roof, wall material, opening rhythm, and palette",
    "consistent all the way around). Treat that hidden half as YOUR reconstruction from a single view — a",
    "known limit of this mode — and make every elevation read as a finished, deliberate wall, never flat",
    "or hollow.",
    "",
    "## Finalized design document",
    designDoc,
    "",
    "## Scale (honor it)",
    `- Target ~${sc} blocks along the LONGEST dimension. Bounding box up to ~${maxW}(x) × ${maxH}(y)`,
    `  × ${maxD}(z); build one compact, solid building that fills that envelope without sprawling into`,
    "  multiple structures.",
    "- Use `fill`/`box` for walls, floors, and the roof's major masses and `line` for edges/trim so you",
    "  can afford solid volume; reserve `voxel` (with block `state` for stairs/slabs) for shaping the roof",
    "  pitch, openings, and surface detail. Approximate slopes/round forms with stepped stairs+slabs.",
    "",
    "## Realize the document with craft",
    "- Build the essential masses, the roof form, and the recognizable features the document names; honor",
    "  its footprint/height proportions and its dominant/supporting/accent palette hierarchy.",
    "- Keep the building SOLID and connected — one principal mass; no detached floating parts unless the",
    "  subject truly has them (and then bridge them so they are supported).",
    "",
    "## Materials",
    "Survival-obtainable Minecraft 1.20.1 blocks, namespaced — primarily the document's palette. Declare",
    "every block you place in palette.manifest.",
    "",
    "## Required metadata (set EXACTLY)",
    ...metadataPinLines(meta),
    "",
    "## Style record",
    "Set style.name to the document's style label and style.rationale to one line tying the build to the",
    "subject and document.",
    "",
    "Emit ONE complete design artifact — the full set of placements, not a diff. Local origin at",
    "x = 0, y = 0, z = 0 (ground at y = 0).",
  ].join("\n");
}
