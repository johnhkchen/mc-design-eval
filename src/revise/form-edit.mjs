// The LLM form-edit route — the freeform block-editor behind the cage's accept-gate (T-046-01, story
// S-046, epic E-15).
//
// E-15's PAYOFF. The measured FORM gap (E-13): text→JSON keeps palette + parts but loses LINE — a koi's
// swimming S-curve flattens, a heart's aortic arch never loops. No procedural pass encodes SHAPE (E-11's
// relief/material do depth/skin, not form). So the loop needs a freeform LLM block-edit primitive — and
// adding it must require NO change to the S-045 loop control flow (loop.mjs), or the cage abstraction was
// wrong. This module is that editor, expressed as JUST ANOTHER editor behind the same gate.
//
// THE CRUX (why a factory). The loop awaits `observe` and `diagnose` but applies the tweak SYNCHRONOUSLY
// (`applyRegionEdit` calls `edit(R.placements)` and throws unless it gets an array). A model call is
// async. So the model work lives in the async `diagnose` seam, which STASHES the proposed edit; the sync
// `tweakFor` REPLAYS it. `makeFormEditor()` returns the two seams sharing a private stash Map — a fresh
// editor per loop run, so nothing leaks across runs. The loop wires observe/diagnose/tweakFor to it and
// is otherwise untouched.
//
// THE ROUTER (AC #2). One critic, two interchangeable editors: a defect routed to `relief`/`material`
// goes to the deterministic procedural pass (scopedTweakFor); any OTHER (form) route — curve/detail/
// massing, the defects the procedural passes leave unhandled — goes to the LLM editor. Both sit behind
// the same accept-if-improved gate; the loop cannot tell them apart.
//
// THE PURE HEART (AC #5). `applyFormEdit` applies a bounded edit-op list (add/remove/move/swap) to an
// in-region placement set, clamped to R: an add/move whose voxels escape R is REJECTED (recorded, never
// thrown — the model may over-reach; we drop the bad op, not the whole edit). remove/swap cannot escape.
// PURE, RNG-FREE, GL-FREE, SDK-FREE — a hill-climb cannot tolerate jitter. The live model leaf
// `defaultProposeEdit` is the ONLY boundary-crosser and is lazy/spawned (the E-11 defaultDiagnose idiom),
// so importing this module for the pure tests loads no subprocess/SDK/GL.

import { expandPlacement } from "../expand.mjs";
import { applyRegionEdit, coordInBounds, subBoundsOf } from "./region.mjs";
import { scopedTweakFor, proceduralDiagnose } from "./tweak.mjs";
import { assertArtifact } from "../artifact.mjs";

/** Schema tag stamped on editor provenance so downstream (the loop trace / A/B) can version-check it. */
export const FORM_EDIT_SCHEMA = "form-edit/v1";

/** The route key the diagnose seam emits for a form defect — OUTSIDE the procedural set {relief,material}. */
export const LLM_EDIT_ROUTE = "llm-edit";

/** The bounded edit-op vocabulary the model emits (AC #1). */
export const EDIT_KINDS = Object.freeze(["add", "remove", "move", "swap"]);

// --- bounds + keys (pure) --------------------------------------------------

/**
 * Whether every expanded voxel of `placement` lies inside `subBounds` (inclusive). Reuses the SAME
 * per-voxel test the region-lock uses (`coordInBounds`), so the editor's guard and the lock agree. PURE.
 * @param {object} placement a schema-valid placement
 * @param {{min:number[],max:number[]}} subBounds
 * @returns {boolean}
 */
export function placementInBounds(placement, subBounds) {
  for (const v of expandPlacement(placement)) {
    if (!coordInBounds(v.pos, subBounds)) return false;
  }
  return true;
}

/** A stable, collision-free string key for a region's subBounds (the stash key). PURE. */
export function regionKey(subBounds) {
  return `${subBounds.min.join(",")}|${subBounds.max.join(",")}`;
}

// --- the pure edit-op application core (AC #5) -----------------------------

/** A placement translated by `delta` ([dx,dy,dz]). voxel moves `pos`; line/box/fill move `from`+`to`. PURE. */
function translatePlacement(p, delta) {
  const [dx, dy, dz] = delta;
  if (p.op === "voxel") {
    return { ...p, pos: [p.pos[0] + dx, p.pos[1] + dy, p.pos[2] + dz] };
  }
  return {
    ...p,
    from: [p.from[0] + dx, p.from[1] + dy, p.from[2] + dz],
    to: [p.to[0] + dx, p.to[1] + dy, p.to[2] + dz],
  };
}

/** Whether `delta` is a 3-int array. PURE. */
function isDelta(delta) {
  return Array.isArray(delta) && delta.length === 3 && delta.every((n) => Number.isInteger(n));
}

/**
 * Normalize a model-emitted `add` placement so it conforms to the artifact schema: the BAML optional
 * `state` map renders as `null` (or `{}`) when the model omits it, but the schema requires `state` to be
 * a non-empty object WHEN PRESENT — so a null/empty/non-object `state` is dropped rather than passed
 * through to fail AJV. PURE — a fresh placement; the input is untouched.
 */
function normalizeAdded(p) {
  if (p.state && typeof p.state === "object" && !Array.isArray(p.state) && Object.keys(p.state).length > 0) {
    return p;
  }
  const { state, ...rest } = p;
  void state;
  return rest;
}

/**
 * APPLY A BOUNDED EDIT-OP LIST to an in-region placement set, clamped to `subBounds`. The pure heart of
 * the LLM editor (AC #5): ops are applied in order; remove/move/swap address placements by their ORIGINAL
 * index (a tombstone array keeps indices stable as removes happen). `add`/`move` are bounds-checked with
 * `placementInBounds`; an op whose every-voxel is NOT in R is REJECTED (recorded in `rejected`, never
 * thrown — a model may over-reach; we drop the bad op, not the whole edit). `remove`/`swap` never move
 * geometry, so they cannot escape R. NEVER returns an empty set when the input was non-empty (the
 * artifact schema requires ≥1 placement; a remove that would empty a non-empty input is rejected).
 *
 * @param {object[]} inRegion  R.placements (the in-region set)
 * @param {{min:number[],max:number[]}} subBounds  R.subBounds
 * @param {Array<{kind:string, placement?:object, target?:number, delta?:number[], block?:string}>} ops
 * @returns {{placements:object[], applied:object[], rejected:Array<{op:object, reason:string}>}}  PURE; inputs unmutated
 */
export function applyFormEdit(inRegion, subBounds, ops) {
  // Tombstone-indexed working copy: slot i mirrors inRegion[i]; `null` = removed. Added placements
  // append (their index is beyond the original range and is never re-addressed by a model index).
  const slots = inRegion.map((p) => p);
  const applied = [];
  const rejected = [];
  const reject = (op, reason) => rejected.push({ op, reason });
  const liveCount = () => slots.reduce((n, s) => n + (s ? 1 : 0), 0);

  for (const op of Array.isArray(ops) ? ops : []) {
    const kind = op && op.kind;
    if (kind === "add") {
      if (!op.placement || typeof op.placement.op !== "string") {
        reject(op, "add: missing placement");
        continue;
      }
      const added = normalizeAdded(op.placement);
      if (!placementInBounds(added, subBounds)) {
        reject(op, "add: placement escapes region");
        continue;
      }
      slots.push(added);
      applied.push(op);
    } else if (kind === "remove") {
      if (!inRange(op.target, inRegion.length) || slots[op.target] == null) {
        reject(op, "remove: target out of range or already removed");
        continue;
      }
      if (liveCount() <= 1) {
        reject(op, "remove: would empty the region (schema requires ≥1 placement)");
        continue;
      }
      slots[op.target] = null;
      applied.push(op);
    } else if (kind === "move") {
      if (!inRange(op.target, inRegion.length) || slots[op.target] == null) {
        reject(op, "move: target out of range or already removed");
        continue;
      }
      if (!isDelta(op.delta)) {
        reject(op, "move: delta must be [dx,dy,dz] integers");
        continue;
      }
      const moved = translatePlacement(slots[op.target], op.delta);
      if (!placementInBounds(moved, subBounds)) {
        reject(op, "move: result escapes region");
        continue;
      }
      slots[op.target] = moved;
      applied.push(op);
    } else if (kind === "swap") {
      if (!inRange(op.target, inRegion.length) || slots[op.target] == null) {
        reject(op, "swap: target out of range or already removed");
        continue;
      }
      if (typeof op.block !== "string" || !op.block) {
        reject(op, "swap: block must be a non-empty string");
        continue;
      }
      slots[op.target] = { ...slots[op.target], block: op.block };
      applied.push(op);
    } else {
      reject(op, `unknown edit kind "${kind}"`);
    }
  }

  const placements = slots.filter((s) => s != null);
  return { placements, applied, rejected };
}

/** Whether `i` is an integer index into a length-`len` array. PURE. */
function inRange(i, len) {
  return Number.isInteger(i) && i >= 0 && i < len;
}

// --- the editor factory: the two loop seams sharing a stash (D1/D4) --------

/**
 * Build the LLM form-editor as the loop's `diagnose` + `tweakFor` seams, sharing a private stash. A FRESH
 * editor per loop run (so nothing leaks across runs / A/B subjects). NO loop.mjs change: the loop awaits
 * `diagnose` (which does the model work and stashes), then calls the sync `tweakFor` (which replays the
 * stash). One router, two editors behind the same gate (AC #2): relief/material → scopedTweakFor; any
 * other (form) route → the stashed LLM edit. Out-of-R / schema-invalid proposals stash nothing → the
 * llm-edit tweak is an identity no-op the accept-gate rolls back (AC #1: AJV-revalidated, lock-checked).
 *
 * @param {Object} [opts]
 * @param {(artifact:object, R:object, observation?:any) => any} [opts.critic]  default proceduralDiagnose
 * @param {(artifact:object, R:object, observation:any, defect:string) => Promise<{ops:object[]}>} [opts.propose]
 *        default the live `defaultProposeEdit` (lazy — keeps the pure core SDK-free)
 * @param {(candidate:object) => void} [opts.validate]  AJV gate; default assertArtifact (throws on invalid)
 * @param {(artifact:object, R:object, placements:object[]) => object} [opts.applyEdit]  default applyRegionEdit (the lock)
 * @returns {{diagnose:Function, tweakFor:Function, stash:Map<string,object[]>}}
 */
export function makeFormEditor(opts = {}) {
  const {
    critic = proceduralDiagnose,
    propose = defaultProposeEdit,
    validate = assertArtifact,
    applyEdit = applyRegionEdit,
  } = opts;
  const stash = new Map();
  const proposals = []; // observability: one entry per form-defect region the LLM editor proposed for

  async function diagnose(artifact, R, observation) {
    const routed = await critic(artifact, R, observation);
    if (!routed || routed.length === 0) return [];
    const top = routed[0];
    // The router: known procedural defects go to the procedural editor untouched.
    if (top.route === "relief" || top.route === "material") return [top];

    // A FORM defect → the LLM editor. Propose → apply (bounds) → lock → AJV; stash only a valid edit.
    const record = { region: regionKey(subBoundsOf(R)), proposed: 0, applied: 0, rejected: [], stashed: false };
    try {
      const { ops } = await propose(artifact, R, observation, top.defect);
      const res = applyFormEdit(R.placements, R.subBounds, ops);
      record.proposed = Array.isArray(ops) ? ops.length : 0;
      record.applied = res.applied.length;
      record.rejected = res.rejected.map((r) => r.reason);
      if (res.placements.length) {
        const candidate = applyEdit(artifact, R, res.placements); // the region-lock (region.mjs)
        validate(candidate); // AJV (artifact.mjs) — throws on a schema-invalid placement
        stash.set(regionKey(subBoundsOf(R)), res.placements);
        record.stashed = true;
      }
    } catch (e) {
      // Out-of-bounds / schema-invalid / model error → leave unstashed → identity no-op, rolled back.
      record.error = String(e && e.message).slice(0, 200);
    }
    proposals.push(record);
    return [{ defect: top.defect, where: top.where, route: LLM_EDIT_ROUTE }];
  }

  function tweakFor(route, attempt, intent) {
    if (route === LLM_EDIT_ROUTE) {
      return (inRegion, sub) => stash.get(regionKey(sub)) ?? inRegion;
    }
    return scopedTweakFor(route, attempt, intent);
  }

  return { diagnose, tweakFor, stash, proposals };
}

// --- the live leaf: propose an edit via the BAML ReviseRegion bridge (GL + metered) ---

/**
 * LIVE EDIT PROPOSAL (NOT unit-tested — metered claude -p + BAML render). Spawn the `baml-revise.mts`
 * tsx bridge (the E-11 `defaultDiagnose` idiom) with the region CROP image (from `observeRegion`) plus
 * the INDEXED in-region placements, and return the parsed bounded edit `{ops}`. The crop must already be
 * rendered to a file — pass an `observation` carrying `path` (the `observeRegion` result). Lazy-imports
 * node:child_process/path so the pure core loads no subprocess machinery.
 * @param {object} artifact
 * @param {object} R  selectRegion result
 * @param {{path?:string}} observation  the observeRegion result (must carry a rendered crop `path`)
 * @param {string} defect  the routed form defect (guidance for the model)
 * @param {{subject?:string}} [opts]
 * @returns {Promise<{ops:object[]}>}
 */
export async function defaultProposeEdit(artifact, R, observation, defect, opts = {}) {
  const imagePath = observation && observation.path;
  if (!imagePath) {
    throw new Error("defaultProposeEdit: observation.path (a rendered crop PNG) is required");
  }
  const { spawn } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");
  const here = dirname(fileURLToPath(import.meta.url));
  const subject = opts.subject ?? artifact?.style?.name ?? artifact?.metadata?.trial_id ?? "the subject";
  // The region text MUST carry the numeric bounds — without them the model cannot keep an add/move
  // inside R, and every op is rejected by the bounds guard (the bug the first A/B surfaced).
  const sub = subBoundsOf(R);
  const spec = typeof R.spec === "string" ? R.spec : JSON.stringify(R.spec);
  const region =
    `${spec} — every voxel of every edit MUST satisfy min [${sub.min.join(", ")}] ≤ [x,y,z] ≤ ` +
    `max [${sub.max.join(", ")}] (inclusive); ops outside this box are rejected`;
  // Index the in-region placements so the model can address remove/move/swap by `target`.
  const placements = JSON.stringify(R.placements.map((p, i) => ({ index: i, ...p })));

  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", join(here, "baml-revise.mts")], {
      stdio: ["pipe", "pipe", "inherit"],
    });
    let out = "";
    child.stdout.on("data", (c) => (out += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`baml-revise exited ${code}`));
      try {
        const parsed = JSON.parse(out);
        resolve({ ops: parsed.ops ?? [] });
      } catch (e) {
        reject(new Error(`baml-revise: unparseable output (${e.message})\n${out.slice(0, 300)}`));
      }
    });
    child.stdin.end(JSON.stringify({ imagePath, subject, defect, region, placements }));
  });
}
