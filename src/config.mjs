// Single source of the harness's Phase-1 configuration (T-004-01).
//
// Mirrors the render harness's version pin (render/src/version.mjs): the model id
// the experiment harness runs against lives in EXACTLY ONE place. Spec §4 is
// explicit — "pin the Phase-1 model by a current ID in config, single-sourced so
// Phase 2 can sweep it." A Phase-2 model sweep is therefore a single edit (or a
// per-trial `model` override passed to runTrial), not a hunt through call sites.
//
// This module is pure data — no SDK import, no I/O — so it is safe to import
// anywhere (the runner, future archetype configs, tests).

/**
 * The Phase-1 pinned model id (spec §4). Phase 2 sweeps the model by overriding
 * this constant or passing `model` to runTrial. Kept current per spec §4's
 * warning against hardcoding deprecated ids.
 * @type {string}
 */
export const PHASE1_MODEL_ID = "claude-opus-4-8";

/**
 * Per-op MODEL TIERS for the agentic-engineering seam (E-23 / S-082 / T-082-01). Because the 2.5-D view
 * layer (T-078-01) scopes each op to a single view, narrow sub-tasks (a single-view detector /
 * classification) suffice on a LIGHTER model; only cross-view judgement, authoring a generator, or
 * material zoning needs the strong tier. Single-sourced HERE like every other model id so a Phase-2 sweep
 * is one edit and every logged op carries one spelling of its tier.
 *
 * HARD INVARIANT (ticket + standing Phase-1 rule): a lighter tier is reached via the `claude -p`
 * SUBSCRIPTION shim with a `--model` override — it is still the subscription, just a smaller `--model`.
 * The metered API key MUST NEVER enter this path. `strong` aliases {@link PHASE1_MODEL_ID} so the pinned
 * default stays single-sourced; `light` is the Haiku family (the dateless rolling alias, mirroring the
 * opus id style — `claude -p --model` accepts the family alias).
 * @type {Readonly<{ light: string, strong: string }>}
 */
export const MODEL_TIERS = Object.freeze({
  light: "claude-haiku-4-5",
  strong: PHASE1_MODEL_ID,
});

/** Default tier when an op does not declare one — the strong (pinned-default) tier. @type {"strong"} */
export const DEFAULT_TIER = "strong";

/**
 * The multi-angle same-object gate contract (E-25 / S-093 / T-093-01). FOUR fixed ground-diagonal
 * azimuths (named per src/view/multi-angle.mjs VIEW_ANGLES: 45/135/225/315 deg at the 30 deg contract
 * elevation — the E-22 3/4 lens elevation) and the aggregate gap budget. E-25 Rule 4: the set is
 * CONFIG, never a per-run option — no runner flag may drop an angle, change the elevation, or lower
 * the 512x512 render contract. Frozen here, single-sourced like every other contract id.
 *
 * BUDGET POLICY v2 (T-144-01, E-34): the deciding arithmetic is identity-first + severity-aware
 * (every view "same object" ∧ zero major gaps ∧ total minors ≤ minorBudget). `gapBudget` is the
 * LEGACY flat budget, kept beside v2 for dual reporting and so every committed record (which pins
 * contract.gapBudget:2) stays valid. `minorBudget` is the v2 cap, CALIBRATED from committed data:
 * the glance-passing observed ceiling is 8 minors (the two T-138 barns); the structural ceiling is
 * 4×MAX_GAPS_PER_VIEW = 12; 10 is the midpoint — it bites only at >2.5 cosmetic papercuts per view
 * averaged (more hedging than any glance-passing build has shown) while clearing both barn anchors
 * with headroom. Calibrated, then frozen — not declared, then frozen.
 * @type {Readonly<{azimuths: readonly string[], gapBudget: number, minorBudget: number}>}
 */
export const MULTI_ANGLE_GATE = Object.freeze({
  azimuths: Object.freeze(["+x+z", "+x-z", "-x-z", "-x+z"]),
  gapBudget: 2,
  minorBudget: 10,
});

/**
 * Default prompting-archetype id for the skeleton trial (spec §7). The single-shot
 * archetype is the Phase-1 baseline; multi-shot / multimodal are later, versioned
 * configs layered on top of the runner.
 * @type {string}
 */
export const DEFAULT_PROMPTING_METHOD_ID = "single-shot.v1";

/**
 * The iterative-multimodal archetype id (spec §7 archetype 3): a harness-orchestrated
 * generate → render → see → revise loop. Single-sourced — like
 * DEFAULT_PROMPTING_METHOD_ID — so every logged trial carries exactly one spelling of
 * this archetype's identity and a Phase-2 model sweep stays greppable.
 * @type {string}
 */
export const ITERATIVE_MULTIMODAL_METHOD_ID = "iterative-multimodal.v1";

/**
 * The vConcept SCULPTURE-mode archetype id (E-13, spec §7). A term-grounded pipeline:
 * imagined design doc → a single 3/4 concept image (Nano Banana) → a freestanding 3-D
 * voxel object built grounded on that one view → a 3/4 still + a front-arc rock turntable.
 * Single-sourced here (like the other method ids) so every logged sculpture run carries one
 * spelling of this archetype's identity and a Phase-2 model sweep stays greppable. The `.v1`
 * suffix versions the doc/concept/build prompt construction in src/sculpture.mjs.
 * @type {string}
 */
export const VCONCEPT_SCULPTURE_METHOD_ID = "vconcept-sculpture.v1";

/**
 * The value-matched vConcept SCULPTURE archetype id (E-14 / story S-041 / T-041-01). The `.v2`
 * build path SHARES the `.v1` build PROMPT — the model still owns form + where — and differs only by
 * a post-build ENGINE step: after the model proposes the artifact, the concept's realized palette is
 * extracted and each placement's block is snapped to the value-true block that hits that region's
 * value (curing the documented moai value drift). Single-sourced here like the other method ids so a
 * value-matched run carries exactly one spelling of its identity and a Phase-2 sweep stays greppable.
 * @type {string}
 */
export const VCONCEPT_SCULPTURE_METHOD_ID_V2 = "vconcept-sculpture.v2";

/**
 * The vConcept BUILDING-mode archetype id (E-20 / story S-067 / T-067-01). The third vConcept
 * framing after facade (front elevation) and sculpture (freestanding 3/4 object): a WHOLE BUILDING
 * IN THE ROUND — four sides, roof, depth — imagined as a design doc → ONE 3/4 concept image of a
 * SINGLE complete building (never a turnaround/contact sheet, which produces multiple buildings +
 * hallucinated connectors, the moai lesson) → a TRELLIS GLB the GLB→voxel pipeline places as bulk.
 * Single-sourced here like the other method ids so every logged building run carries one spelling of
 * this archetype's identity and a Phase-2 model sweep stays greppable. The `.v1` suffix versions the
 * doc/concept/build prompt construction in src/building.mjs.
 * @type {string}
 */
export const VCONCEPT_BUILDING_METHOD_ID = "vconcept-building.v1";

/**
 * The GLB-voxel build archetype id (E-16 / story S-051 / T-051-01). This build is NOT produced by a
 * model: a real 3-D mesh (TRELLIS GLB) is voxelized to occupancy (T-050-01), each occupied cell is
 * colored value-true by sampling the GLB's surface texture and snapping to the nearest block in Lab
 * (E-10 `nearestLab`), and the result is compiled to a standard DesignArtifact. It is the image→3D arm
 * that goes head-to-head against the text→JSON sculpture builds. Single-sourced here like the other
 * method ids so every GLB-voxel build carries one spelling of its identity and a Phase-2 sweep stays
 * greppable. `model_id` on such an artifact records the pinned id for join-key parity even though no
 * model was invoked; this method id makes the GLB provenance unambiguous.
 * @type {string}
 */
export const GLB_VOXEL_METHOD_ID = "glb-voxel.v1";

/**
 * Tool names that must NEVER be enabled in a trial — the code-execution surface
 * (spec §3: the `allow_insecure_coding` / LLM-writes-and-runs-code path is out of
 * scope). The runner's safe-options guard rejects any attempt to allow these.
 * @type {readonly string[]}
 */
export const FORBIDDEN_TOOLS = Object.freeze([
  "Bash",
  "BashOutput",
  "KillShell",
  "NotebookEdit",
  "Task",
]);

/**
 * Agent SDK `query` options that DISABLE code execution (AC #4 / spec §3). A
 * structured-output-only trial needs no tools at all:
 *   - `allowedTools: []`        — nothing is pre-approved.
 *   - `permissionMode: "dontAsk"` — deny anything not pre-approved WITHOUT
 *                                   prompting (a headless trial must never hang on
 *                                   an interactive permission request).
 *   - `disallowedTools`         — names the code-exec tools explicitly, as defense
 *                                 in depth and a greppable statement of intent.
 * The runner never sets `permissionMode: "bypassPermissions"` nor
 * `allowDangerouslySkipPermissions`. When the render tool is later exposed to the
 * harness (spec §4) it is added to `allowedTools` as an `mcp__render__*` tool — a
 * non-code-exec in-process tool — without touching this posture.
 * @type {Readonly<{ allowedTools: string[], disallowedTools: readonly string[], permissionMode: string }>}
 */
export const SAFE_TRIAL_OPTIONS = Object.freeze({
  allowedTools: Object.freeze([]),
  disallowedTools: FORBIDDEN_TOOLS,
  permissionMode: "dontAsk",
});
