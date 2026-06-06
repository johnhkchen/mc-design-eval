// The LLM MATERIAL-CORRECTION route — the recolor-only editor behind the E-15 accept-gate (T-073-01,
// story S-073, epic E-21). The material analogue of form-edit.mjs.
//
// E-21's PAYOFF. T-071 defined the material map; T-072 placed it by geometric feature — but feature
// heuristics mis-zone some regions (a buttress read as wall, a gable mis-materialed). This editor lets the
// model SEE the build render + the concept and propose BOUNDED, RECOLOR-ONLY corrections: a small list of
// swaps that re-block mis-zoned placements toward the concept's material zoning, plus — when it catches a
// concept material MISSING from the build — concept-justified palette ADDITIONS (AC#2). Adding it must
// require NO change to the S-045 loop control flow (loop.mjs) — it is JUST ANOTHER editor behind the same
// gate, exactly as the form editor is.
//
// THE CRUX (why a factory) — copied verbatim from makeFormEditor. The loop awaits `diagnose` but applies
// the tweak SYNCHRONOUSLY (`applyRegionEdit` calls `edit(R.placements)` and throws unless it gets an
// array). A model call is async. So the model work lives in the async `diagnose` seam, which STASHES the
// corrected placements; the sync `tweakFor` REPLAYS them. A fresh editor per loop run (a private stash),
// so nothing leaks across runs.
//
// RECOLOR-ONLY / NO GEOMETRY (AC#1). The op vocabulary is SWAP only — positions are byte-identical, so the
// form/silhouette is untouched by construction (no new geometry guard needed). `applyCorrection`
// (material-policy.mjs) enforces the palette policy: a swap to an in-palette block applies; a swap backed
// by a gated concept-justified addition applies and GROWS the allowed palette; an un-justified off-palette
// swap is dropped (recorded, never thrown). Out-of-policy / schema-invalid proposals stash nothing → the
// material tweak is an identity no-op the accept-gate rolls back.
//
// THE PURE HEART. The diagnose/tweakFor seams + the policy application are pure (reuse applyCorrection +
// applyRegionEdit + assertArtifact). The live model leaf `defaultProposeCorrection` is the ONLY boundary-
// crosser and is lazy/spawned (the form-edit defaultProposeEdit idiom), so importing this module for the
// pure tests loads no subprocess/SDK/GL.

import { applyRegionEdit, subBoundsOf } from "./region.mjs";
import { regionKey } from "./form-edit.mjs";
import { assertArtifact } from "../artifact.mjs";
import { allowedPalette, applyCorrection } from "../form/material-policy.mjs";

/** Schema tag stamped on editor provenance so downstream (the loop trace / record) can version-check it. */
export const MATERIAL_EDIT_SCHEMA = "material-edit/v1";

/** The route key the diagnose seam emits for a material defect — the editor's own route. */
export const MATERIAL_EDIT_ROUTE = "material-correct";

/**
 * Build the LLM material-editor as the loop's `diagnose` + `tweakFor` seams, sharing a private stash. A
 * FRESH editor per loop run (nothing leaks across runs / subjects). NO loop.mjs change: the loop awaits
 * `diagnose` (which does the model work, applies the policy, and stashes), then calls the sync `tweakFor`
 * (which replays the stash). The critic routes a region to `material-correct` (the only route this editor
 * handles); any other route → no-op (rolled back). Out-of-policy / schema-invalid proposals stash nothing.
 *
 * THE PALETTE GROWS ACROSS REGIONS. A concept-justified addition accepted in one region joins `allowed`
 * for every later region — so a second region may legitimately reuse a block the first one added. The
 * accepted additions accumulate in the shared `additions` log (AC#2 "logged with justification").
 *
 * @param {Object} opts
 * @param {(artifact:object, R:object, observation?:any) => any} opts.critic  routes a region (required —
 *        e.g. a per-region critic; the default proceduralDiagnose never emits material-correct)
 * @param {(artifact:object, R:object, observation:any, ctx:object) => Promise<{swaps:object[], additions:object[]}>} [opts.propose]
 *        default the live `defaultProposeCorrection` (lazy — keeps the pure core SDK-free)
 * @param {{mapPalette?:string[], secondary?:string[]}} [opts.policy]  the design-doc manifest + ≤2 secondary
 * @param {object} [opts.table]  injectable block→Lab table (membership), forwarded to the policy
 * @param {(candidate:object) => void} [opts.validate]  AJV gate; default assertArtifact (throws on invalid)
 * @param {(artifact:object, R:object, placements:object[]) => object} [opts.applyEdit]  default applyRegionEdit
 * @returns {{diagnose:Function, tweakFor:Function, stash:Map<string,object[]>, proposals:object[], additions:object[]}}
 */
export function makeMaterialEditor(opts = {}) {
  const {
    critic,
    propose = defaultProposeCorrection,
    policy = {},
    table,
    validate = assertArtifact,
    applyEdit = applyRegionEdit,
  } = opts;
  if (typeof critic !== "function") {
    throw new Error("makeMaterialEditor: opts.critic (a region router) is required");
  }
  const stash = new Map();
  const proposals = []; // one entry per material-correct region the editor proposed for (observability)
  const additions = []; // the accumulated accepted concept-justified additions (the AC#2 log)
  // The allowed palette grows as additions are accepted; seeded from the design-doc manifest + secondary.
  let allowed = allowedPalette({ mapPalette: policy.mapPalette, secondary: policy.secondary });

  async function diagnose(artifact, R, observation) {
    const routed = await critic(artifact, R, observation);
    if (!routed || routed.length === 0) return [];
    const top = routed[0];
    if (top.route !== MATERIAL_EDIT_ROUTE) return [top]; // not ours — pass through (e.g. a procedural route)

    const record = {
      region: regionKey(subBoundsOf(R)),
      proposedRemaps: 0,
      proposedSwaps: 0,
      proposedAdditions: 0,
      applied: 0,
      acceptedAdditions: 0,
      rejected: [],
      stashed: false,
    };
    try {
      const ctx = { allowed: [...allowed], currentPalette: [...allowed] };
      const { remaps = [], swaps = [], additions: proposed = [] } = await propose(artifact, R, observation, ctx);
      record.proposedRemaps = Array.isArray(remaps) ? remaps.length : 0;
      record.proposedSwaps = Array.isArray(swaps) ? swaps.length : 0;
      record.proposedAdditions = Array.isArray(proposed) ? proposed.length : 0;

      const res = applyCorrection(R.placements, R.subBounds, { remaps, swaps, additions: proposed }, { allowed, table });
      record.applied = res.applied.length;
      record.acceptedAdditions = res.acceptedAdditions.length;
      record.rejected = res.rejected.map((r) => r.reason);

      // Stash only a real, valid change: at least one swap applied and the candidate passes the AJV gate.
      if (res.applied.length > 0) {
        const candidate = applyEdit(artifact, R, res.placements); // the region-lock (region.mjs)
        validate(candidate); // AJV (artifact.mjs) — throws on a schema-invalid placement
        stash.set(regionKey(subBoundsOf(R)), res.placements);
        record.stashed = true;
        // Commit the accepted additions to the growing palette + the shared log ONLY when stashed.
        allowed = res.grownAllowed;
        for (const a of res.acceptedAdditions) additions.push({ region: record.region, ...a });
      }
    } catch (e) {
      record.error = String(e && e.message).slice(0, 200);
    }
    proposals.push(record);
    return [{ defect: top.defect, where: top.where, route: MATERIAL_EDIT_ROUTE }];
  }

  function tweakFor(route) {
    if (route === MATERIAL_EDIT_ROUTE) {
      return (inRegion, sub) => stash.get(regionKey(sub)) ?? inRegion;
    }
    return (inRegion) => inRegion; // identity — a non-material route is a no-op (rolled back)
  }

  return { diagnose, tweakFor, stash, proposals, additions };
}

// --- the live leaf: propose a correction via the CorrectRegion bridge (GL + metered) ---

/**
 * LIVE CORRECTION PROPOSAL (NOT unit-tested — metered claude -p + BAML render with TWO images). Spawn the
 * `baml-material-correct.mts` tsx bridge (the form-edit defaultProposeEdit idiom) with the R-framed build
 * render crop, the concept image, the current allowed palette, and the INDEXED in-region placements; parse
 * the reply to `{swaps, additions}`. The render crop must already be rendered to a file — pass an
 * `observation` carrying `path` (the observeRegion result); the concept path comes from `opts.conceptPath`.
 * Lazy-imports node:child_process/path so the pure core loads no subprocess machinery.
 * @param {object} artifact
 * @param {object} R  selectRegion result
 * @param {{path?:string}} observation  the observeRegion result (must carry a rendered crop `path`)
 * @param {{allowed?:string[], currentPalette?:string[]}} ctx  the current allowed palette (a prior, not a cap)
 * @param {{conceptPath?:string, subject?:string}} [opts]
 * @returns {Promise<{swaps:object[], additions:object[]}>}
 */
export async function defaultProposeCorrection(artifact, R, observation, ctx = {}, opts = {}) {
  const renderPath = observation && observation.path;
  if (!renderPath) {
    throw new Error("defaultProposeCorrection: observation.path (a rendered crop PNG) is required");
  }
  const conceptPath = opts.conceptPath;
  if (!conceptPath) {
    throw new Error("defaultProposeCorrection: opts.conceptPath (the concept reference PNG) is required");
  }
  const { spawn } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");
  const here = dirname(fileURLToPath(import.meta.url));
  const subject = opts.subject ?? artifact?.style?.name ?? artifact?.metadata?.trial_id ?? "the subject";
  const sub = subBoundsOf(R);
  const spec = typeof R.spec === "string" ? R.spec : JSON.stringify(R.spec);
  const region = `${spec} — bounds min [${sub.min.join(", ")}] max [${sub.max.join(", ")}] (recolor only; do NOT move/add/remove geometry)`;
  const currentPalette = JSON.stringify(ctx.currentPalette ?? ctx.allowed ?? []);
  // Index the in-region placements so the model can address each recolor swap by `target`.
  const placements = JSON.stringify(R.placements.map((p, i) => ({ index: i, block: p.block, op: p.op })));

  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", join(here, "baml-material-correct.mts")], {
      stdio: ["pipe", "pipe", "inherit"],
    });
    let out = "";
    child.stdout.on("data", (c) => (out += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`baml-material-correct exited ${code}`));
      try {
        const parsed = JSON.parse(out);
        resolve({ remaps: parsed.remaps ?? [], swaps: parsed.swaps ?? [], additions: parsed.additions ?? [] });
      } catch (e) {
        reject(new Error(`baml-material-correct: unparseable output (${e.message})\n${out.slice(0, 300)}`));
      }
    });
    child.stdin.end(JSON.stringify({ renderPath, conceptPath, subject, region, currentPalette, placements }));
  });
}
