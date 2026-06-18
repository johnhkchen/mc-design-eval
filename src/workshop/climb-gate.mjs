// PICTURE-DRIVEN CLIMB — the accept-gate, the stopping rule, and the run-derived eyes-vs-hands
// classifier (T-188-01, story S-188, epic E-48). PURE: no GL, no LLM, no I/O — so the climb's *decisions*
// are unit-tested in isolation while the metered runner (experiments/eval-alignment/picture-climb.mjs)
// stays thin and out of `npm test`.
//
// The climb wires the E-47 picture-anchored DiagnoseBuild critique as the gradient: render → critique →
// pick a tool → apply → re-critique. This module supplies the two pieces the E-38 autonomy loop lacked:
//   (1) an ACCEPT-GATE — keep a round only if it moved the build TOWARD the concept on the picture
//       critique (a noisy, cap-dominated score), never just because it changed; and
//   (2) a RESTRAINT / STOPPING rule — converge, don't oscillate (T-176's amplitude loop overshot).
// And it derives, from the recorded trajectory alone, the EYES-vs-HANDS inventory: which named critiques
// the loop could act on vs which it named but had no lever for (the discovered S-189 scope — no
// speculative fix list, only what the run surfaced).

export const CLIMB_GATE_SCHEMA = "climb-gate/v1";

const fail = (where, msg) => { throw new Error(`${where}: ${msg}`); };
const num = (v, d = 0) => (Number.isFinite(v) ? v : d);

// Tunables (design C/D). MARGIN ≈ one minor critique item; the runner reports the OBSERVED vote spread
// beside it so the gate is calibrated, not asserted. stallK rolled-back rounds ⇒ converged. ROUNDS gives
// the climb room while bounding metered spend; minRounds enforces the ticket's "≥3 rounds run".
export const CLIMB_DEFAULTS = Object.freeze({ margin: 4, stallK: 2, maxRounds: 5, minRounds: 3 });

// Factual reach of the EXISTING occ-tools over the five departments — a DESCRIPTION of what the hands
// touch, NOT a fix proposal. Used only to label "no tool targets this department". OPENING under
// construct_walls is incidental (the skin's dressOpenings), recorded as such. recolor_roof (T-189-01) is
// the roof-MATERIAL hand: it rebuilds the roof in the concept-true material read by recognition (the
// reconcile of program ↔ material-map — see src/recognition/roof-material.mjs), so it moves ROOF colour
// where apply_gable_roof (form only) cannot.
export const TOOL_DEPARTMENTS = Object.freeze({
  apply_gable_roof: Object.freeze(["ROOF"]),
  recolor_roof: Object.freeze(["ROOF"]),
  construct_walls: Object.freeze(["WALL", "OPENING"]),
  add_timber_framing: Object.freeze(["WALL"]),
  // T-192-01 (S-192) — the hands the resumed climb stalls on. frame_arch builds the framed arched passage
  // (OPENING); articulate_walls gives the pale dressed field + kept rubble quoins (WALL); band_eave the lighter eave/verge
  // band (ROOF, a MINOR — the override is major-gated, so band_eave relies on the scalar/tie, not the
  // override: a recorded S-191 input, see design.md Decision 5).
  frame_arch: Object.freeze(["OPENING"]),
  articulate_walls: Object.freeze(["WALL"]),
  // T-195-01 (S-195, E-51) — the wall-RELIEF hand: recolor the field pale AND build proud quoins/plinth
  // (construction, not recolor). A WALL lever like articulate_walls, but it can clear the field-vs-quoin
  // RELIEF major the flat recolor cannot — so the S-191 override keeps it on a whole-build scalar regression.
  relief_walls: Object.freeze(["WALL"]),
  band_eave: Object.freeze(["ROOF"]),
  // T-194-01 (S-194, E-51) — the carve+dress hand: CARVE the declared gate WIDER (the charter narrowing) then
  // frame + arch it. An OPENING lever, like frame_arch, but it can reach the WIDE arched gate frame_arch can
  // only frame. Self-reverts to frame_arch (recess-only) if the aperture-coherence gate rejects the carve.
  carve_arch: Object.freeze(["OPENING"]),
  // T-203-01 (S-203, E-52) — the wide-arch REBUILD hand: rebuild the declared gate to a WIDE arched opening
  // (coherent head/jambs/sill + voussoir), passing the ARCH-AWARE coherence gate carve_arch's full-height
  // check could not. THE OPENING lever (carve_arch is retired from the menu — it provably always refuted).
  rebuild_arch: Object.freeze(["OPENING"]),
  // T-197-01 (S-197, E-51) — the close-the-shell FORM hand: build a dense closed wall shell from the program
  // footprint (src/view/wall-generate.mjs closeShell). A WALL lever, but it is the form/massing stage, not a
  // skin — it is what the form-before-detail ordering requires BEFORE the detail hands can read.
  close_shell: Object.freeze(["WALL"]),
});

// ============================ FORM-BEFORE-DETAIL ORDERING (T-197-01, S-197, E-51) ============================
// The reviewer's task-ordering note made structural: coarse FORM (close the shell / massing / roof shape)
// before fine DETAIL (carve openings, relief, banding). "You can't carve a doorway into a wall that's already
// full of holes." Each tool is labelled form|detail; a DETAIL tool is eligible only once the build's wall band
// is form-ready (closure ≥ FORM_READY_CLOSURE). The decision is PURE and takes a CLOSURE SCALAR (the runner
// computes it via wall-generate.mjs eaveRingClosure) — climb-gate stays occ-free / GL-free like the rest of
// its decisions. Orthogonal to acceptsRound: this is an ELIGIBILITY filter that runs BEFORE keep/rollback.

// Calibrated against the measured gatehouse gap (T-197 research): seed band closure 0.615 (open) vs a closed
// dense shell 1.000 — a wide margin, so 0.9 is robust, not a knife-edge.
export const FORM_READY_CLOSURE = 0.9;

// The minimum closure RISE that counts as a form-readiness win (T-199-01, S-199, E-49 — the form-credit
// clause). Calibrated against the measured gatehouse gap (seed band 0.615 → closed dense shell 1.000 =
// +0.385); 0.1 sits well inside it, robust not a knife-edge. The runner reports the OBSERVED gain beside
// it, like CLIMB_DEFAULTS.margin.
export const CLOSURE_GAIN_MARGIN = 0.1;

// The COLD-START BATCH ESCAPE (T-208-01, S-208, E-53). On a genuinely-closed form the picture scalar can
// saturate at its 0 floor (T-207 live: a clean wide arch scored 0→0 and the per-move gate rolled it back as
// "tie (0): no shrink"). Every single detail move ties at 0, so the greedy gate can never let detail compound
// even though several hands together would read. The escape: stack `batchSize` provisional detail moves
// un-credited, then judge the COMPOUND once (the gradient several moves create together). scoreFloor = the
// saturated floor the per-move gate can't leave; batchMargin = the smallest off-floor read that counts (one
// point — escaping 0 is the signal). Frozen; the runner reads CLIMB_BATCH_SIZE / CLIMB_SCORE_FLOOR env knobs
// (default OFF) like CLIMB_MAX_ROUNDS, so every prior climb re-runs byte-identically unless the escape is on.
export const BATCH_DEFAULTS = Object.freeze({ batchSize: 4, scoreFloor: 0, batchMargin: 1 });

// Tool → climb stage. FORM = massing/envelope/roof shape & material (the coarse build, always eligible).
// DETAIL = carve/dress/band a finished form (gated on form-readiness). The ticket names carve_arch,
// relief_walls, band_eave; the other dressing hands are the same class (they decorate an envelope) so they
// gate identically. A tool absent here (or `done`) is treated as non-detail → never blocked.
export const TOOL_STAGE = Object.freeze({
  close_shell: "form", construct_walls: "form", apply_gable_roof: "form", recolor_roof: "form",
  carve_arch: "detail", relief_walls: "detail", band_eave: "detail",
  articulate_walls: "detail", add_timber_framing: "detail", frame_arch: "detail",
  rebuild_arch: "detail", // T-203-01: the OPENING rebuild gates on form-readiness like the other detail hands
});

// Tools whose KEEP decision is made on closureOf ALONE (T-200-01, S-200, E-49). The wall-shell FORM moves
// (close_shell, construct_walls) move the perimeter-occupancy ring, so closureOf — the deterministic
// eaveRingClosure — is the right, noise-free signal for them. The ROOF-form moves (apply_gable_roof,
// recolor_roof) do NOT change wall closure: closureOf is blind to the roof, so they are NOT closure-decided
// and keep the picture gradient (the recorded blind spot — a richer roof-form signal is named, not built).
// Derived from the registries above (no new hardcoded list). The runner passes `closureDecidedMove(tool)` as
// `acceptsRound`'s `isFormMove`; the gate's decision itself stays tool-string-free.
export const closureDecidedMove = (tool) =>
  TOOL_STAGE[tool] === "form" && (TOOL_DEPARTMENTS[tool] ?? []).includes("WALL");

/**
 * FORM-READINESS GATE. Is `tool` eligible given the build's wall-band `closure`? Form (and unknown / `done`)
 * tools are ALWAYS eligible — you must be able to close the shell, and a stop is always honest. A DETAIL tool
 * is eligible only when `closure ≥ threshold` (the form is closed enough to carve/dress). NaN closure → 0 →
 * blocks detail (fail safe). Pure; no occ, no mutation.
 * @param {{tool:string, closure:number, threshold?:number}} args
 * @returns {{allow:boolean, stage:string|null, reason:string}}
 */
export function formReadyGate({ tool, closure, threshold = FORM_READY_CLOSURE } = {}) {
  const stage = TOOL_STAGE[tool] ?? null;
  if (stage !== "detail") {
    return { allow: true, stage, reason: `${stage ?? "non-detail"} tool — always eligible` };
  }
  const c = num(closure);
  if (c >= threshold) return { allow: true, stage, reason: `form ready (closure ${c.toFixed(3)} ≥ ${threshold})` };
  return { allow: false, stage, reason: `form not ready (closure ${c.toFixed(3)} < ${threshold}) — close the shell before detail` };
}

/**
 * COLD-START FLOOR (T-208-01). Is the build stuck at the saturated picture floor on a CLOSED form — the trap
 * where every per-move detail gate ties at 0 (research §2)? True iff the form is closed (closure ≥ threshold)
 * AND the picture score sits at/under `scoreFloor`. The runner uses this to decide whether to enter the batch
 * escape; outside it the unchanged per-move `acceptsRound` governs (so a healthy climb never batches). Pure;
 * NaN closure → not cold-start (fail-safe: never batch on an unknown form).
 * @param {{score:number, closure:number, scoreFloor?:number, formReadyThreshold?:number}} args
 * @returns {boolean}
 */
export function coldStartFloor({ score, closure, scoreFloor = BATCH_DEFAULTS.scoreFloor,
  formReadyThreshold = FORM_READY_CLOSURE } = {}) {
  return num(score) <= scoreFloor && Number.isFinite(closure) && num(closure) >= formReadyThreshold;
}

/**
 * Per-department MAJOR counts, derived purely from a critique's `items`. `critiqueEvidence` exposes only the
 * WHOLE-BUILD `nMajor`; this is the finer signal the department-aware accept-gate needs (T-190-01). When a
 * tool clears the major in its OWN department, the judge often promotes a pre-existing major elsewhere, so
 * whole-build `nMajor` stays flat (T-189 §3, "attention-shift, not regression") — only the per-department
 * count moves. Skips items with no department. Pure (no mutation of `items`).
 * @param {Array<{department?:string, severity?:string}>} items
 * @returns {{[department:string]: number}}
 */
export function deptMajorCounts(items = []) {
  const out = {};
  for (const it of items) {
    if (!it?.department || it.severity !== "major") continue;
    out[it.department] = (out[it.department] ?? 0) + 1;
  }
  return out;
}

/**
 * Per-department {major, minor} item counts — the NET companion to deptMajorCounts (T-191-01). The
 * department-dominant override needs the TOTAL burden per targeted department (not just majors) so it can
 * REJECT a tool that clears a targeted major while adding new minors in its own target (net degradation),
 * while still KEEPING a major→fewer-or-equal-total improvement (incl. a major→minor swap). Skips items with
 * no department; counts only "major"/"minor" severities. Pure (no mutation of `items`).
 * @param {Array<{department?:string, severity?:string}>} items
 * @returns {{[department:string]: {major:number, minor:number}}}
 */
export function deptItemCounts(items = []) {
  const out = {};
  for (const it of items) {
    if (!it?.department) continue;
    if (it.severity !== "major" && it.severity !== "minor") continue;
    const e = out[it.department] ?? (out[it.department] = { major: 0, minor: 0 });
    e[it.severity] += 1;
  }
  return out;
}

/**
 * A stable, order-independent digest of a build's cells — equality is all the runner's no-op guard needs
 * (no crypto). INCLUDES the block id, so a roof rebuilt in a different material (recolor_roof vs
 * apply_gable_roof: same positions, different field block) hashes DIFFERENTLY — the guard suppresses true
 * no-ops, never a real material change (T-190-01). Pure.
 * @param {Array<{pos:number[], block:string}>} cells
 * @returns {string}
 */
export function buildDigest(cells = []) {
  return cells
    .map((c) => `${(c.pos ?? []).join(",")}|${c.block ?? ""}`)
    .sort()
    .join("\n");
}

/**
 * The DEPARTMENT-DOMINANT OVERRIDE (T-191-01). Returns the name of a department the applied tool TARGETS and
 * in which it cleared a major — but ONLY if the tool did not make any of its targeted departments worse —
 * else `null`. The override lets a tool that did its job in its own department be KEPT even on a whole-build
 * scalar regression (the judge promoted a pre-existing major in an UNtargeted department: attention-shift,
 * not regression — T-190-01 §ceiling). Three guards:
 *   (a) cleared — some targeted dept's major count fell (`beforeDeptMajors[d] > afterDeptMajors[d]`);
 *   (b) no new major — no targeted dept's major count rose;
 *   (c) net guard — no targeted dept's TOTAL item count (major+minor) rose. This is the net-minor tightening
 *       the falsification (S-191) demands: it REJECTS "cleared a major but added minors in its own target"
 *       (net degradation) while KEEPING a major→fewer-or-equal-total improvement. Active only when
 *       `beforeDeptItems`/`afterDeptItems` are supplied; with majors-only data the guard degrades to (a)+(b)
 *       (which LEAKS the added-minors case — see test CG15, the documented reason the net guard exists).
 * Pure. Inert (returns `null`) without `targetDepartments` + `*DeptMajors`.
 */
function departmentDominant({ targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems }) {
  if (!Array.isArray(targetDepartments) || !beforeDeptMajors || !afterDeptMajors) return null;
  const cleared = targetDepartments.find((d) => num(beforeDeptMajors[d]) > num(afterDeptMajors[d]));
  if (!cleared) return null;                                                        // (a)
  for (const d of targetDepartments) if (num(afterDeptMajors[d]) > num(beforeDeptMajors[d])) return null; // (b)
  if (beforeDeptItems && afterDeptItems) {                                          // (c) net guard
    const tot = (c) => num(c?.major) + num(c?.minor);
    for (const d of targetDepartments) if (tot(afterDeptItems[d]) > tot(beforeDeptItems[d])) return null;
  }
  return cleared;
}

/**
 * The FORM-CREDIT clause (T-199-01, S-199, E-49) — the FORM-ANALOG of departmentDominant. Returns
 * `{gain, closureAfter}` when a tool raised FORM-READINESS (wall-band `closure`, the SAME `eaveRingClosure`
 * the runner / closeShell report — never a second metric) by a margin TOWARD the form-ready threshold, and
 * otherwise `null`. It lets the form/massing hand (close_shell) be KEPT even at a picture-score TIE or
 * REGRESSION — the deadlock the T-198 metered climb hit: close_shell closes the gatehouse shell
 * (closureOf 0.615 → 1.000) but the noisy picture critique scores it a 16→16 tie, the gate rolled it back,
 * and the form-before-detail gate then locked every DETAIL hand forever (closure never reaches 0.9).
 *
 * Where departmentDominant's guard (a) is "cleared a major", this clause's positive signal is "closure rose
 * by `closureMargin` while a form gap remained". The E-50 guards are KEPT, with one deliberate tightening:
 *   (1) closure evidence present (finite before/after) — else `null` (inert, backward compatible);
 *   (b′) NO NEW department major ANYWHERE (whole-build) — STRICTER than departmentDominant's targeted-only
 *        (b): form credit is justified by a STRUCTURAL scalar (perimeter occupancy), not by clearing a
 *        department, so it must not introduce a major in ANY department. This is the no-rubber-stamp guard
 *        that rejects a "closing" move that floods the interior / regresses the roof / adds a major. Needs
 *        the major maps; absent → `null` (fail-safe);
 *   (2) form gap remains — `closureBefore < formReadyThreshold`; once ready, the detail-gate governs and
 *        crediting further closure would be closure-maximizing noise;
 *   (3) real gain — `closureAfter - closureBefore >= closureMargin` (a trivial wobble does not qualify);
 *   (c′) net guard — no TARGETED dept's TOTAL (major+minor) burden rose (the E-50 net-minor tightening,
 *        targeted-only as in E-50; active only when `targetDepartments` + `*DeptItems` supplied).
 * Pure. Inert (`null`) without closure or major-count data.
 */
function formCredit({
  closureBefore, closureAfter, closureMargin = CLOSURE_GAIN_MARGIN, formReadyThreshold = FORM_READY_CLOSURE,
  targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems,
}) {
  if (!Number.isFinite(closureBefore) || !Number.isFinite(closureAfter)) return null; // (1) inert w/o closure
  if (!beforeDeptMajors || !afterDeptMajors) return null;            // (b′) needs major data → fail-safe
  if (closureBefore >= formReadyThreshold) return null;              // (2) only while a form gap remains
  const gain = closureAfter - closureBefore;
  if (gain < closureMargin) return null;                             // (3) real rise toward the threshold
  const depts = new Set([...Object.keys(beforeDeptMajors), ...Object.keys(afterDeptMajors)]);
  for (const d of depts) if (num(afterDeptMajors[d]) > num(beforeDeptMajors[d])) return null; // (b′) whole-build
  if (Array.isArray(targetDepartments) && beforeDeptItems && afterDeptItems) {                 // (c′) net guard
    const tot = (c) => num(c?.major) + num(c?.minor);
    for (const d of targetDepartments) if (tot(afterDeptItems[d]) > tot(beforeDeptItems[d])) return null;
  }
  return { gain, closureAfter };
}

/**
 * Accept-gate (design C3 + T-190-01 department-aware signal + T-191-01 department-dominant override). Keep
 * `after` over `before` iff the median picture score improves past MARGIN; otherwise consult the
 * DEPARTMENT-DOMINANT OVERRIDE — a tool that cleared a major in a department it TARGETS, added no new major
 * in any targeted dept, and grew no targeted dept's total burden, is KEPT even on a whole-build scalar
 * REGRESSION (the regression is then provably attention-shift to an UNtargeted department). Failing both, a
 * within-margin tie is broken by whole-build coverage shrink (fewer wrong-style departments OR fewer majors),
 * else the round is rolled back. The override supersedes T-190's tie-zone department leg (it is a superset:
 * it fires on regressions too, and is net-guarded). The FORM-CREDIT clause (T-199-01) runs right after the
 * department override and before the regression reject: a form/massing hand that raised wall-band `closure`
 * by a margin toward form-ready, added no new major in ANY department, and grew no targeted dept's total is
 * KEPT even on a tie or regression (see `formCredit`).
 *
 * FORM-MOVE ROUTING (T-200-01): when `isFormMove` is set (the runner passes `closureDecidedMove(tool)` — a
 * wall-shell form move: close_shell / construct_walls) AND a form gap remains (`closureBefore <
 * formReadyThreshold`), the decision is made ENTIRELY on closureOf — `formCredit` fires → KEEP, else ROLL
 * BACK — and the picture vote is removed from that decision (it has a documented 0–76 same-seed swing). This
 * makes the form decision STABLE across re-runs. Roof-form moves are NOT closure-decided (closureOf is blind
 * to the roof) and form-ready moves fall through, so both keep the picture gradient — detail-path-unchanged.
 * Backward compatible: with no department context the override is inert, with no `closureBefore`/
 * `closureAfter` the form clause is inert, and with `isFormMove` omitted (default false) the form branch is
 * skipped entirely. `before`/`after` are `critiqueEvidence` bundles.
 * @param {{score:number, nMajor?:number, wrongStyleBreadth?:number}} before
 * @param {{score:number, nMajor?:number, wrongStyleBreadth?:number}} after
 * @param {{margin?:number, targetDepartments?:string[], beforeDeptMajors?:object, afterDeptMajors?:object, beforeDeptItems?:object, afterDeptItems?:object, closureBefore?:number, closureAfter?:number, closureMargin?:number, formReadyThreshold?:number, isFormMove?:boolean}} [opts]
 * @returns {{accept:boolean, delta:number, reason:string}}
 */
export function acceptsRound(before, after, {
  margin = CLIMB_DEFAULTS.margin, targetDepartments = null,
  beforeDeptMajors = null, afterDeptMajors = null, beforeDeptItems = null, afterDeptItems = null,
  closureBefore = null, closureAfter = null,
  closureMargin = CLOSURE_GAIN_MARGIN, formReadyThreshold = FORM_READY_CLOSURE,
  isFormMove = false,
} = {}) {
  if (!before || !after) fail("acceptsRound", "before and after evidence are required");
  const delta = num(after.score) - num(before.score);
  // form-credit (T-199-01) — computed once (pure) and reused by both the form-move branch and the picture
  // path below: a form hand that raised closure toward form-ready without adding a major anywhere or growing
  // a targeted dept's burden.
  const form = formCredit({ closureBefore, closureAfter, closureMargin, formReadyThreshold,
    targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems });
  // FORM-MOVE DECISION (T-200-01, S-200): a wall-shell form move (isFormMove, via closureDecidedMove) with a
  // form gap still open is judged ENTIRELY on closureOf (deterministic) — never the noisy picture vote (a
  // documented 0–76 swing on the same seed). closure rose by a margin → KEEP; else ROLL BACK; the picture
  // delta is RECORDED but NOT consulted, so the same form move yields the same decision across any vote draw.
  // Detail / roof-form / already-form-ready moves fall through to the unchanged picture path below.
  if (isFormMove && Number.isFinite(closureBefore) && num(closureBefore) < formReadyThreshold) {
    if (form) return { accept: true, delta,
      reason: `closure +${form.gain.toFixed(3)} (${num(closureBefore).toFixed(3)}→${num(closureAfter).toFixed(3)}) form-credit` };
    const gain = num(closureAfter) - num(closureBefore);
    return { accept: false, delta, reason: gain < closureMargin
      ? `form: no closure gain (${num(closureBefore).toFixed(3)}→${num(closureAfter).toFixed(3)})`
      : `form: closure rose but blocked (new major / net-grow)` };
  }
  if (delta >= margin) return { accept: true, delta, reason: `improved +${Math.round(delta)}` };
  // department-dominant override (T-191-01): runs BEFORE the regression reject so a tool that did its job in
  // its own department survives a whole-build scalar regression caused by attention-shift elsewhere.
  const dom = departmentDominant({ targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems });
  if (dom) return { accept: true, delta, reason: `${dom} cleared a major (department-dominant override)` };
  // form-credit clause (T-199-01): the form-analog — a form hand that raised closure toward form-ready
  // without adding a major anywhere or growing a targeted dept's burden is KEPT even at a tie/regression.
  // Retained for non-form-move callers (and the T-199 CG-FC suite, which omits isFormMove).
  if (form) return { accept: true, delta,
    reason: `closure +${form.gain.toFixed(3)} (${num(closureBefore).toFixed(3)}→${num(closureAfter).toFixed(3)}) form-credit` };
  if (delta <= -margin) return { accept: false, delta, reason: `regressed ${Math.round(delta)}` };
  // tie zone: let whole-build coverage break the tie
  const breadthShrank = num(after.wrongStyleBreadth) < num(before.wrongStyleBreadth);
  const majorsShrank = num(after.nMajor) < num(before.nMajor);
  if (breadthShrank || majorsShrank) {
    return { accept: true, delta, reason: `tie (${Math.round(delta)}): coverage shrank` };
  }
  return { accept: false, delta, reason: `tie (${Math.round(delta)}): no shrink` };
}

/**
 * ACCEPT-A-COMPOUND (T-208-01, S-208, E-53) — the score-0 cold-start escape. Keep N provisionally-stacked
 * DETAIL moves vs the pre-batch build, judged by the picture score over the COMPOUND (`after`) — the gradient
 * several moves create together, which the per-move gate's saturated 0-floor could not see (research §2;
 * T-207 live: a clean wide arch scored 0→0 and rolled back). Reuses `departmentDominant` over the UNION of the
 * batch's targeted departments. Guards, in order (the rubber-stamp / deliberately-bad-compound reject is the
 * AC falsification — the escape must reject a worse batch, never rubber-stamp):
 *   (3) `delta < 0`                → REJECT "regressed" (a compound that worsened the scalar; moot at floor 0
 *                                    where `after.score ≥ 0`, kept as a guard for `scoreFloor > 0` callers);
 *   (2) new whole-build major (`after.nMajor > before.nMajor`) → REJECT "added a major" (a bad batch that
 *                                    paints wrong / floods openings raises a major → rejected — the rubber-stamp guard);
 *   (1a) `delta >= batchMargin`    → ACCEPT "compound +delta" (the build LEFT the floor — what several reads did);
 *   (1b) `departmentDominant` fires → ACCEPT "<dept> cleared a major" (a targeted major cleared though the
 *                                    whole-build scalar is still saturated; net-guarded inside departmentDominant);
 *   else                           → REJECT "compound tie at floor — no read": the honest residual — even the
 *                                    compound can't move the judge off 0 → the ticket's failure-mode-3 (de-noise
 *                                    the judge); do NOT rubber-stamp a tie through. Pure; same evidence bundles
 *                                    (`critiqueEvidence`) as `acceptsRound`. Inert outside the cold start (the
 *                                    runner only calls it there; the healthy per-move path is unchanged).
 * @param {{score:number, nMajor?:number}} before
 * @param {{score:number, nMajor?:number}} after
 * @param {{batchMargin?:number, targetDepartments?:string[], beforeDeptMajors?:object, afterDeptMajors?:object, beforeDeptItems?:object, afterDeptItems?:object}} [opts]
 * @returns {{accept:boolean, delta:number, reason:string}}
 */
export function acceptsBatch(before, after, {
  batchMargin = BATCH_DEFAULTS.batchMargin, targetDepartments = null,
  beforeDeptMajors = null, afterDeptMajors = null, beforeDeptItems = null, afterDeptItems = null,
} = {}) {
  if (!before || !after) fail("acceptsBatch", "before and after evidence are required");
  const delta = num(after.score) - num(before.score);
  if (delta < 0) return { accept: false, delta, reason: `regressed ${Math.round(delta)}` };
  if (num(after.nMajor) > num(before.nMajor)) {
    return { accept: false, delta, reason: `added a major (${num(before.nMajor)}→${num(after.nMajor)})` };
  }
  if (delta >= batchMargin) return { accept: true, delta, reason: `compound +${Math.round(delta)} (off the floor)` };
  const dom = departmentDominant({ targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems });
  if (dom) return { accept: true, delta, reason: `${dom} cleared a major (department-dominant, batch)` };
  return { accept: false, delta, reason: `compound tie at floor — no read (→ de-noise the judge)` };
}

/**
 * Restraint / stopping rule (design D2). Stop on agent `done`, OR stallK consecutive rolled-back rounds,
 * OR the round cap — but NEVER before minRounds (guarantees the ≥3-rounds AC even if the agent quits or
 * the build converges early). `round` is the count of tool-rounds completed.
 * @returns {{stop:boolean, reason:string|null}}
 */
export function stoppingDecision({
  round, agentDone = false, noAcceptStreak = 0,
  stallK = CLIMB_DEFAULTS.stallK, maxRounds = CLIMB_DEFAULTS.maxRounds, minRounds = CLIMB_DEFAULTS.minRounds,
} = {}) {
  if (!Number.isFinite(round)) fail("stoppingDecision", "round is required");
  if (round < minRounds) return { stop: false, reason: null };
  if (agentDone) return { stop: true, reason: "agent-done" };
  if (noAcceptStreak >= stallK) return { stop: true, reason: `stalled (${noAcceptStreak} rolled back)` };
  if (round >= maxRounds) return { stop: true, reason: "round cap" };
  return { stop: false, reason: null };
}

const departmentsOfTool = (tool) => TOOL_DEPARTMENTS[tool] ?? [];

/**
 * The eyes-vs-hands inventory, derived PURELY from the recorded trajectory (no speculation). A department
 * is ACTED-ON iff some round that APPLIED a tool and was ACCEPTED used a tool whose TOOL_DEPARTMENTS
 * includes it; every department named in any round's critique items that is not acted-on is EYES-ONLY.
 *
 * Each trajectory round: { round, score, items:[{department, kind, severity, missing}], pick:{tool},
 *   applied:boolean, accepted:boolean, scoreAfter?:{score} }. The terminal/done round may carry the final
 *   build score as `score` (so scoreLast reads the kept build).
 * @returns {{actedOn:Array, eyesOnly:Array, verdict:object}}
 */
export function classifyInventory(trajectory, { margin = CLIMB_DEFAULTS.margin } = {}) {
  if (!Array.isArray(trajectory) || trajectory.length === 0) {
    fail("classifyInventory", "trajectory must be a non-empty array");
  }

  // Acted-on: group accepted tool-applications by the departments they reach.
  const actedMap = new Map(); // department -> {department, byTool:Set, rounds:[], deltas:[]}
  const toolOutcomes = new Map(); // tool -> {accepted:bool, rejected:bool}
  for (const r of trajectory) {
    if (!r.applied || !r.pick?.tool) continue;
    const o = toolOutcomes.get(r.pick.tool) ?? { accepted: false, rejected: false };
    if (r.accepted) o.accepted = true; else o.rejected = true;
    toolOutcomes.set(r.pick.tool, o);
    if (!r.accepted) continue;
    const delta = num(r.scoreAfter?.score) - num(r.score);
    for (const dept of departmentsOfTool(r.pick.tool)) {
      const e = actedMap.get(dept) ?? { department: dept, byTool: new Set(), rounds: [], deltas: [] };
      e.byTool.add(r.pick.tool); e.rounds.push(r.round); e.deltas.push(Math.round(delta));
      actedMap.set(dept, e);
    }
  }
  const actedOn = [...actedMap.values()].map((e) => ({
    department: e.department, byTool: [...e.byTool], rounds: e.rounds, deltas: e.deltas,
  }));
  const actedDepts = new Set(actedMap.keys());

  // Eyes-only: every department NAMED in a critique that no accepted tool reached.
  const namedMap = new Map(); // department -> [{round, kind, severity, missing}]
  for (const r of trajectory) {
    for (const it of r.items ?? []) {
      if (!it?.department || actedDepts.has(it.department)) continue;
      const list = namedMap.get(it.department) ?? [];
      list.push({ round: r.round, kind: it.kind ?? null, severity: it.severity ?? null, missing: it.missing ?? "" });
      namedMap.set(it.department, list);
    }
  }
  const eyesOnly = [...namedMap.entries()].map(([department, namedItems]) => ({ department, namedItems }));

  // Verdict (run-derived, honest).
  const scoreFirst = num(trajectory[0].score);
  const scoreLast = num(trajectory[trajectory.length - 1].score);
  const delta = scoreLast - scoreFirst;
  const oscillated = [...toolOutcomes.values()].some((o) => o.accepted && o.rejected);
  const climbed = delta > margin;
  const stalled = !climbed && !oscillated; // converged without a clear up-move
  const applies = trajectory.filter((r) => r.applied).length;
  const accepts = trajectory.filter((r) => r.applied && r.accepted).length;
  const actionableFrac = applies ? +(accepts / applies).toFixed(3) : 0;

  return {
    actedOn, eyesOnly,
    verdict: { climbed, stalled, oscillated, actionableFrac, scoreFirst, scoreLast, delta: Math.round(delta) },
  };
}
