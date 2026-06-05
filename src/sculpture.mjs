// vConcept SCULPTURE mode (T-035-01, E-13 / story S-035) — the PURE surface.
//
// A NAMED, VERSIONED pipeline that turns a single TERM into a freestanding 3-D voxel
// object: an imagined design document (no reference photo) → one 3/4 CONCEPT image
// (Nano Banana, via the BAML SculptureConceptPrompt) → a 3-D DesignArtifact built
// grounded on that ONE view → a 3/4 still + a front-arc "rock" turntable. It REUSES the
// proven facade-lineage seams (requestText / requestDesignArtifactWithImage / generateImage
// / renderArtifact / renderOrbit·oscillateAzimuths) — only the SUBJECT FRAMING is new.
//
// SINGLE-VIEW LIMITATION (a known property, not a bug): the model sees exactly one 3/4
// concept view. The back and far sides of the object are its plausible RECONSTRUCTION from
// that single view, not designed surfaces — which is precisely the standing case for an
// image→3D model (TRELLIS), deferred in E-13. The build prompt states this to the model,
// the turntable rocks only the front hemisphere (never parading the imagined back), and the
// benchmark README documents it.
//
// This module mirrors src/single-shot.mjs / src/iterative-multimodal.mjs: a frozen
// descriptor + PURE prompt builders + spec/scale validation, all SDK- and GL-free so the
// test glob (`src/**/*.test.mjs`) exercises every line without billing a model or loading
// GL. The one live/metered/GL runner lives in benchmarks/sculpture/run.mjs and imports this.

import { PHASE1_MODEL_ID, VCONCEPT_SCULPTURE_METHOD_ID } from "./config.mjs";

/**
 * The archetype descriptor. `id` is single-sourced from config.mjs so there is exactly one
 * spelling of this archetype's identity; the `.v1` suffix versions the doc/concept/build
 * prompt construction below (any change that could move results bumps it → `.v2`).
 * @type {Readonly<{ id: string, version: number, label: string }>}
 */
export const VCONCEPT_SCULPTURE = Object.freeze({
  id: VCONCEPT_SCULPTURE_METHOD_ID, // "vconcept-sculpture.v1"
  version: 1,
  label: "vConcept sculpture (term → 3/4 concept → freestanding 3-D object)",
});

/** Target longest-edge bounds (blocks). Below 8 no form survives voxelization; above 64 the
 *  render/token budget and the single-view reconstruction both degrade. */
export const SCALE_MIN = 8;
export const SCALE_MAX = 64;
export const DEFAULT_SCALE = 32;

/** Fixed bookkeeping a subject needs (subject + scale come from the CLI). seed is held
 *  constant across subjects so a Phase-2 model sweep is the only moving part. */
export const SCULPTURE_DEFAULTS = Object.freeze({
  seed: 17,
  serverStateId: "flat-creative-superflat.v1",
});

/** The canonical three-quarter still framing (a partial over the render rig's DEFAULT_VIEW).
 *  Slightly lower elevation than the 35° default so a tabletop object reads in the round. */
export const SCULPTURE_VIEW_3Q = Object.freeze({ azimuthDeg: 45, elevationDeg: 30, fov: 45 });

/** Front-arc "rock" turntable: a gentle sinusoidal sweep CENTERED on the 3/4 still's azimuth,
 *  staying in the front hemisphere (centerDeg ± amplitudeDeg = 5°..85°) so the imagined back is
 *  never paraded. Consumed by renderOrbit via oscillateAzimuths in the runner. */
export const TURNTABLE = Object.freeze({
  centerDeg: 45,
  amplitudeDeg: 40,
  frames: 24,
  elevationDeg: 30,
  fov: 45,
});

/**
 * Validate + normalize a sculpture spec before any metered work. A misconfigured run must
 * fail here, not after a billed call. Throws a field-named Error prefixed `sculpture:`.
 * @param {{ subject?: string, scale?: number }} spec
 * @returns {{ subject: string, scale: number }} the trimmed/validated pair
 */
export function assertSculptureSpec(spec) {
  const s = spec || {};
  const subject = typeof s.subject === "string" ? s.subject.trim() : "";
  if (!subject) {
    throw new Error(`sculpture: spec.subject must be a non-empty string (got ${JSON.stringify(s.subject)})`);
  }
  const scale = s.scale;
  if (!Number.isInteger(scale) || scale < SCALE_MIN || scale > SCALE_MAX) {
    throw new Error(
      `sculpture: spec.scale must be an integer in [${SCALE_MIN}, ${SCALE_MAX}] (got ${JSON.stringify(scale)})`,
    );
  }
  return { subject, scale };
}

/**
 * Per-axis bounding caps for a freestanding object whose target LONGEST edge is `scale`
 * blocks. PURE — this is the "scale wiring" the AC asks to unit-test. A sculpture is bounded
 * roughly cubically by its largest dimension, so every axis caps at `scale`; the build prompt
 * interpolates these and names `scale` as the longest-edge target. Validates its input the
 * same way assertSculptureSpec does so a caller cannot get silent garbage.
 * @param {number} scale target longest edge in blocks
 * @returns {{ maxW: number, maxH: number, maxD: number }}
 */
export function sculptureScaleCaps(scale) {
  if (!Number.isInteger(scale) || scale < SCALE_MIN || scale > SCALE_MAX) {
    throw new Error(`sculptureScaleCaps: scale must be an integer in [${SCALE_MIN}, ${SCALE_MAX}] (got ${scale})`);
  }
  return { maxW: scale, maxH: scale, maxD: scale };
}

/** A filesystem-safe, lexically-sortable run id for a subject. PURE. */
export function runIdForSubject(seq, subject) {
  const slug = String(subject).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "subject";
  return `${String(seq).padStart(3, "0")}-vConcept-${slug}`;
}

/**
 * The metadata this archetype pins on the artifact (shared identity for the build stage).
 * PURE. `prompting_method_id` is THIS archetype so the produced artifact is attributable.
 * NOTE: `metadata.target` is DELIBERATELY not set. In the live schema it is an ENUM
 * (`house | path | landscape`) — a sculpture is none of those, so pinning the subject term
 * there would FAIL the AJV gate (the build-prompt schema is looser than the live gate). The
 * per-subject join key is carried by `trial_id` (the run id embeds the subject slug) and by
 * the benchmark's summary.json instead.
 * @param {{ runId: string, model?: string }} p
 * @returns {import("./artifact.mjs").Metadata}
 */
export function sculptureMetadata({ runId, model }) {
  return {
    trial_id: runId,
    prompting_method_id: VCONCEPT_SCULPTURE.id,
    model_id: model || PHASE1_MODEL_ID,
    seed: SCULPTURE_DEFAULTS.seed,
    server_state_id: SCULPTURE_DEFAULTS.serverStateId,
  };
}

/** The `- metadata.x = …` prompt lines for a Metadata. PURE; shared by the build prompt. */
export function metadataPinLines(meta) {
  const lines = [
    `- metadata.trial_id = "${meta.trial_id}"`,
    `- metadata.prompting_method_id = "${meta.prompting_method_id}"`,
    `- metadata.model_id = "${meta.model_id}"`,
    `- metadata.seed = ${meta.seed}`,
    `- metadata.server_state_id = "${meta.server_state_id}"`,
  ];
  if (meta.target) lines.push(`- metadata.target = "${meta.target}"`);
  if (meta.created_at) lines.push(`- metadata.created_at = "${meta.created_at}"`);
  return lines;
}

/**
 * Stage 1 — the imagined DESIGN DOCUMENT prompt for a freestanding OBJECT (no reference
 * photo). PURE. Mirrors the facade design-doc's grounded-reasoning + color-theory palette
 * discipline, but every clause is about an object in the round — silhouette from all sides,
 * volumes and proportion, a stable base — NOT a front elevation. `scale` sets the size brief.
 * @param {{ subject: string, scale: number }} spec
 * @returns {string}
 */
export function composeSculptureDesignDocPrompt(spec) {
  const { subject, scale } = assertSculptureSpec(spec);
  return [
    "You are a master sculptor and worldbuilder. BEFORE building anything, write a tight",
    "DESIGN DOCUMENT for a FREESTANDING MINECRAFT-BLOCK SCULPTURE of the subject below — a",
    "single object you would display ON A TURNTABLE and view from any side, NOT a wall, facade,",
    "or scene. Output ONLY the document (markdown); no block list, JSON, or build yet.",
    "",
    "## Subject",
    `A block-built sculpture of: ${subject}.`,
    `Target size: about ${scale} blocks along its LONGEST dimension (a tabletop object, built`,
    "in the round so it reads from every angle).",
    "",
    "## Cover each, concisely and with REASONS (not just adjectives)",
    "1. **Read of the subject** — what this object fundamentally IS: its essential masses, its",
    "   characteristic silhouette, and the one or two features that make it instantly recognizable",
    "   as the subject (so a viewer names it at a glance).",
    "2. **Form & proportion (in the round)** — the major volumes and how they stack/join in x/y/z;",
    "   the key proportion ratios; how the silhouette reads from the FRONT, the SIDE, and the 3/4.",
    "   How it stands: a stable base/footing so it is not a floating or top-heavy shape.",
    "3. **Color palette (apply color theory)** — 3–5 Minecraft 1.20.1 blocks: a dominant, 1–2",
    "   supporting, and a sparing accent. Name the harmony and WHY it suits the subject. Map each to",
    "   a concrete named block. Restraint and hierarchy over a rainbow; commit to firm choices.",
    "4. **Surface & motifs** — 1–2 recurring textures/motifs and where they appear, at BLOCK scale",
    "   (anything finer than a whole block will not survive voxelization — design bold).",
    "5. **Block-budget plan** — roughly how the ~" + scale + "-block longest edge is spent across the",
    "   object's parts, so the build stays within a compact, readable footprint.",
    "",
    "FINALIZE the document — firm decisions, no open options. Keep it under ~350 words.",
  ].join("\n");
}

/**
 * Stage 3 — the 3-D BUILD prompt: realize the finalized doc as a freestanding object,
 * grounded on the attached 3/4 concept image. PURE. This DELIBERATELY inverts every facade
 * assumption — full x/y/z occupancy, in the round, NO "+Z / front elevation / relief into −Z
 * / one connected plane" — and states the single-view limitation to the model. Scale caps
 * come from sculptureScaleCaps; metadata is pinned for attribution.
 * @param {{ subject: string, scale: number, designDoc: string, runId: string, model?: string }} p
 * @returns {string}
 */
export function composeSculptureBuildPrompt({ subject, scale, designDoc, runId, model }) {
  const { subject: subj, scale: sc } = assertSculptureSpec({ subject, scale });
  const { maxW, maxH, maxD } = sculptureScaleCaps(sc);
  const meta = sculptureMetadata({ runId, model });
  return [
    "You are a master Minecraft sculptor. Build a FREESTANDING 3-D SCULPTURE as a structured",
    `design artifact that faithfully realizes the subject "${subj}" — its form, proportion,`,
    "palette, and motifs — per the finalized design document and the attached CONCEPT IMAGE.",
    "This is an OBJECT IN THE ROUND, displayed on a turntable: it occupies all three axes and",
    "must read as a solid sculpture from every side. It is NOT a facade, wall, relief, or scene.",
    "",
    "## Orientation (a sculpture, not a facade)",
    "Build a fully three-dimensional object in x/y/z, centered on a local origin (x = 0, z = 0),",
    "standing on the ground at y = 0. Model the WHOLE object — front, back, both sides, and top —",
    "as real volume; give it depth and roundness, not a single thin face. There is no privileged",
    "'front plane' and no relief-into-a-wall: massing projects in every direction as the form needs.",
    "",
    "## Single-view limitation (read this)",
    "The attached concept shows ONE 3/4 view. The back and the far side are NOT depicted — infer",
    "them as a plausible, coherent continuation of the visible form (mirror symmetric features where",
    "the subject is symmetric; keep volumes and palette consistent all the way around). Treat that",
    "hidden half as YOUR reconstruction from a single view — a known limit of this mode — and make it",
    "read as a finished, deliberate surface, never a flat or hollow back.",
    "",
    "## Finalized design document",
    designDoc,
    "",
    "## Scale (honor it)",
    `- Target ~${sc} blocks along the LONGEST dimension. Bounding box up to ~${maxW}(x) × ${maxH}(y)`,
    `  × ${maxD}(z); build a compact, solid object that fills that envelope without sprawling.`,
    "- Use `fill`/`box` for the major masses and `line` for struts/edges so you can afford solid",
    "  volume; reserve `voxel` (with block `state` for stairs/slabs) for shaping curves, facets,",
    "  and surface detail. Approximate curves/round forms with stepped stairs+slabs, not flat panels.",
    "",
    "## Realize the document with craft",
    "- Build the essential masses and the recognizable features the document names; honor its",
    "  proportions and its dominant/supporting/accent palette hierarchy.",
    "- Keep the object SOLID and connected — no detached floating parts unless the subject truly has",
    "  them (and then bridge them so they are supported).",
    "",
    "## Materials",
    "Survival-obtainable Minecraft 1.20.1 blocks, namespaced — primarily the document's palette.",
    "Declare every block you place in palette.manifest.",
    "",
    "## Required metadata (set EXACTLY)",
    ...metadataPinLines(meta),
    "",
    "## Style record",
    "Set style.name to the document's style label and style.rationale to one line tying the build to",
    "the subject and document.",
    "",
    "Emit ONE complete design artifact — the full set of placements, not a diff. Local origin at",
    "x = 0, y = 0, z = 0 (ground at y = 0).",
  ].join("\n");
}
