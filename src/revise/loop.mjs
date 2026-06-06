// The deterministic surgical-revision loop (T-045-01, story S-045, epic E-15).
//
// THE LOOP E-11 LEFT OPEN. E-11 built staged passes + a diagnose-and-route critic (review.mjs:
// "routes, never re-emits" — the P14 cure) but `staged-loop.mjs` runs ONE forward pass and the
// diagnosis is never consumed. This module wires the real loop — and proves the CAGE before any model
// joins it (T-046-01): an accepted region locks and is never touched again; a tweak never bleeds past
// the region-lock (T-044-01); a tweak that does not RAISE the form metric (IoU, T-043-01) is ROLLED
// BACK, not kept. Model variance would confound that proof, so the only tweak here is a deterministic
// SCOPED PROCEDURAL PASS (tweak.mjs) — E-11's relief/material bounded to the region.
//
// THE PIPELINE (per region, AC #1): pick region → (observe) → diagnose → apply a scoped procedural
// pass bounded to R → re-score with the form metric → accept-if-improved ELSE roll back → lock R →
// repeat under a bounded iteration / per-region budget. Returns the revised artifact + a per-iteration
// TRACE (region, defect, tweak, score before/after, accepted?).
//
// TERMINATION IS STRUCTURAL. The loop walks a FIXED, caller-supplied region list once, in order, doing
// at most `perRegion` attempts per region, under a global `maxIterations` cap. So it terminates in
// ≤ regions.length × perRegion attempts regardless of whether any tweak ever helps — convergence is a
// property of the cage, not a hope about the tweak.
//
// PURITY & SEAMS. The pure core imports ONLY region.mjs + tweak.mjs (no GL, no model). The loop never
// mutates the input; `current` is rebound to fresh artifacts from `applyRegionEdit`. THREE seams keep
// it deterministic-by-default yet live-capable:
//   - score(artifact, R)  — the FORM number; the live render seam. Default `liveFormScore` lazy-imports
//                           the render stack; pure tests inject a synthetic deterministic score (no GL).
//   - diagnose(artifact, R, observation?) — default `proceduralDiagnose` (model-FREE, AC #3). The E-11
//                           model critic is a drop-in here in T-046-01.
//   - observe(artifact, R) — optional live render feeding a model critic; default UNDEFINED → skipped,
//                           so the default deterministic path renders only for scoring (and pure tests,
//                           injecting score, load no GL at all).
// A static import scan (loop.test.mjs, group LE) enforces the no-top-level-GL boundary.

import { selectRegion, applyRegionEdit, subBoundsOf } from "./region.mjs";
import { scopedTweakFor, proceduralDiagnose, boxesIntersect, tweakLabel } from "./tweak.mjs";

/** Schema tag stamped on the loop result so downstream can version-check it. */
export const REVISE_SCHEMA = "revise-loop/v1";

/** Budget + gate defaults. `maxIterations` is the global backstop; `perRegion` the attempts per region. */
export const LOOP_DEFAULTS = Object.freeze({ maxIterations: 24, perRegion: 2, epsilon: 0 });

/**
 * THE DETERMINISTIC REVISION LOOP. Walk `regions` in order; per region: select R, skip if it overlaps a
 * locked region, diagnose, then try up to `perRegion` scoped procedural tweaks — accept the first that
 * strictly improves the form score (and lock R), else roll every attempt back (leaving `current`
 * untouched). PURE control flow over injectable seams; the input artifact is never mutated.
 *
 * @param {object} artifact  a schema-valid DesignArtifact (the "before")
 * @param {object} opts
 * @param {Array<string|object>} opts.regions  ordered selectRegion specs — the region picker (required)
 * @param {(artifact:object, R:object) => number|Promise<number>} [opts.score]  the FORM metric seam
 * @param {(artifact:object, R:object, observation?:any) => any} [opts.diagnose]  default proceduralDiagnose
 * @param {(artifact:object, R:object) => any} [opts.observe]  optional live render feeding the critic
 * @param {(route:string, attempt:number, intent:object) => (inRegion:object[], subBounds:object) => object[]} [opts.tweakFor]
 * @param {{maxIterations?:number, perRegion?:number}} [opts.budget]
 * @param {object} [opts.intent]  threaded to the procedural passes (relief/material tunables)
 * @param {number} [opts.fraction]  forwarded to selectRegion (named/where slab size)
 * @param {number} [opts.epsilon]  strict-improvement margin (default 0)
 * @returns {Promise<{schema:string, artifact:object, trace:object[], iterations:number, converged:boolean, locked:object[]}>}
 */
export async function reviseLoop(artifact, opts = {}) {
  const {
    regions,
    score = liveFormScore(),
    diagnose = proceduralDiagnose,
    observe,
    tweakFor = scopedTweakFor,
    budget = LOOP_DEFAULTS,
    intent = {},
    fraction,
    epsilon = LOOP_DEFAULTS.epsilon,
  } = opts;

  if (!Array.isArray(regions)) {
    throw new Error("reviseLoop: opts.regions must be an array of region specs");
  }
  const maxIterations = budget.maxIterations ?? LOOP_DEFAULTS.maxIterations;
  const perRegion = budget.perRegion ?? LOOP_DEFAULTS.perRegion;

  let current = artifact;
  const trace = [];
  const locked = []; // subBounds of accepted regions — never re-edited
  let iterations = 0;

  for (const spec of regions) {
    if (iterations >= maxIterations) break;

    const R = selectRegion(current, spec, { fraction });
    const sub = subBoundsOf(R);

    // The spatial lock: an accepted region is never re-entered.
    if (locked.some((L) => boxesIntersect(L, sub))) {
      trace.push({ iteration: iterations, region: spec, subBounds: sub, accepted: false, reason: "locked-overlap" });
      continue;
    }

    const observation = observe ? await observe(current, R) : null;
    const routed = await diagnose(current, R, observation);
    if (!routed || routed.length === 0) {
      trace.push({ iteration: iterations, region: spec, subBounds: sub, accepted: false, reason: "clean" });
      continue;
    }
    const { defect, where, route } = routed[0];

    // `before` is stable across the region's attempts: `current` only changes on accept, which breaks.
    const before = await score(current, R);
    let accepted = false;

    for (let attempt = 0; attempt < perRegion; attempt++) {
      if (iterations >= maxIterations) break;
      iterations++;

      const tweakFn = tweakFor(route, attempt, intent);
      const candidate = applyRegionEdit(current, R, (inRegion) => tweakFn(inRegion, sub)); // lock-checked
      const after = await score(candidate, R);

      const entry = {
        iteration: iterations,
        region: spec,
        subBounds: sub,
        defect,
        where,
        route,
        tweak: tweakLabel(route, attempt),
        scoreBefore: before,
        scoreAfter: after,
        accepted: after > before + epsilon,
      };

      if (entry.accepted) {
        current = candidate;
        locked.push(sub);
        entry.reason = "accepted";
        trace.push(entry);
        accepted = true;
        break;
      }
      entry.reason = "rolled-back";
      trace.push(entry);
    }
    void accepted; // (kept for readability; lock push already records acceptance)
  }

  // converged = terminated by exhausting the region list, NOT by hitting the global cap.
  const converged = iterations < maxIterations;
  return { schema: REVISE_SCHEMA, artifact: current, trace, iterations, converged, locked };
}

// --- the live FORM-score seam (GL, lazy) -----------------------------------

/**
 * THE DEFAULT LIVE FORM SCORE (the GL seam — NOT unit-tested, pulls headless render). Returns an async
 * `score(artifact, R) => number`: render the artifact via the region module's `observeRegion` (the
 * camera framed on R — the same crop the loop revises) to a temp PNG, then score its silhouette IoU
 * against a concept reference with the T-043-01 form metric. Whole-object IoU by default (a 3-D→2-D
 * projection for `regionIoU` is out of scope; a caller may pass an explicit 2-D `region`). LAZY-imports
 * the render + form stack so importing loop.mjs for the pure tests loads no GL. The loop's pure tests
 * inject a synthetic deterministic score instead of this.
 * @param {{conceptPath?:string, view?:object, region?:object, grid?:number, fit?:string, width?:number, height?:number}} [cfg]
 * @returns {(artifact:object, R:object) => Promise<number>}
 */
export function liveFormScore(cfg = {}) {
  return async (artifact, R) => {
    if (!cfg.conceptPath) {
      throw new Error("liveFormScore: cfg.conceptPath (the concept reference PNG) is required");
    }
    const { observeRegion } = await import("./region.mjs");
    const { formFidelityFromPair } = await import("../form/form-fidelity.mjs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const outPath = join(tmpdir(), `revise-loop-score-${R.subBounds.min.join("_")}.png`);
    await observeRegion(artifact, R, {
      outPath,
      view: cfg.view,
      width: cfg.width ?? 512,
      height: cfg.height ?? 512,
    });
    const opts = { grid: cfg.grid, fit: cfg.fit };
    if (cfg.region) opts.region = cfg.region;
    const result = await formFidelityFromPair(outPath, cfg.conceptPath, opts);
    return cfg.region ? result.regionIoU : result.iou;
  };
}
