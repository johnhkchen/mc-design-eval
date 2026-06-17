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
});

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
 * Accept-gate (design C3 + T-190-01 department-aware signal + T-191-01 department-dominant override). Keep
 * `after` over `before` iff the median picture score improves past MARGIN; otherwise consult the
 * DEPARTMENT-DOMINANT OVERRIDE — a tool that cleared a major in a department it TARGETS, added no new major
 * in any targeted dept, and grew no targeted dept's total burden, is KEPT even on a whole-build scalar
 * REGRESSION (the regression is then provably attention-shift to an UNtargeted department). Failing both, a
 * within-margin tie is broken by whole-build coverage shrink (fewer wrong-style departments OR fewer majors),
 * else the round is rolled back. The override supersedes T-190's tie-zone department leg (it is a superset:
 * it fires on regressions too, and is net-guarded). Backward compatible: with no department context the
 * override is inert. `before`/`after` are `critiqueEvidence` bundles.
 * @param {{score:number, nMajor?:number, wrongStyleBreadth?:number}} before
 * @param {{score:number, nMajor?:number, wrongStyleBreadth?:number}} after
 * @param {{margin?:number, targetDepartments?:string[], beforeDeptMajors?:object, afterDeptMajors?:object, beforeDeptItems?:object, afterDeptItems?:object}} [opts]
 * @returns {{accept:boolean, delta:number, reason:string}}
 */
export function acceptsRound(before, after, {
  margin = CLIMB_DEFAULTS.margin, targetDepartments = null,
  beforeDeptMajors = null, afterDeptMajors = null, beforeDeptItems = null, afterDeptItems = null,
} = {}) {
  if (!before || !after) fail("acceptsRound", "before and after evidence are required");
  const delta = num(after.score) - num(before.score);
  if (delta >= margin) return { accept: true, delta, reason: `improved +${Math.round(delta)}` };
  // department-dominant override (T-191-01): runs BEFORE the regression reject so a tool that did its job in
  // its own department survives a whole-build scalar regression caused by attention-shift elsewhere.
  const dom = departmentDominant({ targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems });
  if (dom) return { accept: true, delta, reason: `${dom} cleared a major (department-dominant override)` };
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
