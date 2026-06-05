// Staged-sculptor consolidation — the full wired loop (T-029-01, epic E-11 / story S-029).
//
// The terminal link. The five sibling modules (spine + the two seed passes + the two bookends) are each
// built and tested; THIS module wires them into one demonstrated loop and adds NO new capability — it only
// sequences the existing public functions:
//
//   massing → material-noise → self-shadow relief → diagnostic critic
//
// THE LOCK CHAIN IS THE POINT (the P14 cure, enforced by the orchestrator, not here). `mass` locks
// `occupied` (the proportion lock); `material` locks `material` over the locked occupancy; `relief` locks
// `relief` over the material-locked state. Each pass ADDS a field within bounds; none can undo a prior one.
// This harness must never re-lock or re-order — it relies entirely on each pass's own `runStages` call, so
// "improve is additive, never destructive" travels with the loop.
//
// THE ONLY FORM DEPENDENCY IS `MassingSource` (the E-09 reuse hook, AC #2). This module imports ONLY the
// spine + the passes — never a concept-grid / image module. A GLB voxelizer that emits the same
// `{width, height, occupied()}` contract is a drop-in: the material/relief/review stages never learn where
// the occupancy came from. `reuse-boundary.test.mjs` enforces this statically and functionally.
//
// LAYERING. `stagedSculpt` is PURE (no render, no model) — the chain + the less-flat metric, always
// runnable in `npm test`. `runStagedLoop` adds the critic via `reviewBuildState`, whose render/diagnose
// leaves are INJECTABLE (live GL + BAML by default; stubbed in the suite). The live BAML judge is metered,
// so the automated demonstration renders live but stubs diagnose — the wiring defaults to the real leaf.

import { mass, proportionsOf } from "./massing.mjs";
import { material } from "./material.mjs";
import { relief, reliefMetrics, compileRelief } from "./relief.mjs";
import { reviewBuildState } from "./review.mjs";

/**
 * Run the staged sculpt chain over a form source: massing → material → relief, each locking its own
 * field over the prior pass's locked output. PURE — no render, no model. Returns the relief-locked state,
 * its proportions, its `reliefMetrics`, and the massing-only `baseline` metrics for the less-flat
 * comparison (the baseline is all-flat, so every relief signal is zero on it).
 * @param {import("./massing.mjs").MassingSource} source  the ONLY form dependency
 * @param {object} [intent]  threaded read-only to both passes (`intent.material`, `intent.relief`)
 * @returns {{massingState: any, state: any, proportions: any, metrics: any, baseline: any}}
 */
export function stagedSculpt(source, intent = {}) {
  const { state: massingState, proportions } = mass(source); // locks `occupied`
  const skinned = material(massingState, intent); //            locks `material` over locked occupancy
  const state = relief(skinned, intent); //                     locks `relief` over locked material
  return {
    massingState,
    state,
    proportions,
    metrics: reliefMetrics(state), //     composed: coverage/variance > 0 once any feature is relieved
    baseline: reliefMetrics(massingState), // massing-only: all-flat → coverage/variance === 0
  };
}

/**
 * Name the less-flat deltas and the verdict — a pure comparator so the "measurably less flat" claim
 * (AC #1) lives in one place, citable by the test and the journal. "Less flat" = the composed facade has
 * BOTH non-zero relief coverage AND non-zero Z-variance where the baseline has neither.
 * @param {{coverage:number, variance:number, range:number}} baseline  massing-only metrics
 * @param {{coverage:number, variance:number, range:number}} metrics   composed metrics
 * @returns {{coverage:number, variance:number, range:number, isLessFlat:boolean}}
 */
export function lessFlat(baseline, metrics) {
  return {
    coverage: metrics.coverage - baseline.coverage,
    variance: metrics.variance - baseline.variance,
    range: metrics.range - baseline.range,
    isLessFlat: metrics.variance > baseline.variance && metrics.coverage > baseline.coverage,
  };
}

/**
 * The full wired loop: sculpt → compile → critic. Compiles the relief-locked state to a `DesignArtifact`
 * (via `compileRelief`) and runs the diagnostic critic over the state, returning the composed artifact,
 * the metric comparison, and the recorded `diagnosis` (the routed defects — "routes, never re-emits").
 * `render`/`diagnose` are forwarded to `reviewBuildState`: undefined → the live GL/BAML leaves; pass stubs
 * to keep the automated suite GL/BAML-free.
 * @param {import("./massing.mjs").MassingSource} source
 * @param {{brief?:string, intent?:object, render?:Function, diagnose?:Function}} [opts]
 * @returns {Promise<{state:any, artifact:any, proportions:any, metrics:any, baseline:any,
 *                     comparison:any, diagnosis:any, render:any}>}
 */
export async function runStagedLoop(source, { brief = "", intent = {}, render, diagnose } = {}) {
  const sculpt = stagedSculpt(source, intent);
  const artifact = compileRelief(sculpt.state);
  const review = await reviewBuildState(sculpt.state, { brief, render, diagnose });
  return {
    state: sculpt.state,
    artifact,
    proportions: sculpt.proportions,
    metrics: sculpt.metrics,
    baseline: sculpt.baseline,
    comparison: lessFlat(sculpt.baseline, sculpt.metrics),
    diagnosis: review.diagnosis,
    render: review.render,
  };
}

// Re-export the proportions projection so a consumer that imports the loop gets the review critic's
// bounds input from the same path (the single-import-site convenience the consolidation rests on).
export { proportionsOf };
