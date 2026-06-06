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
