// SURGICAL-REFINE-TO-STANDARD — the PURE analyzer for the E-20 quality bar (T-069-01, story S-069, epic E-20).
//
// E-20 placed + cleaned the high-res building (T-068-01). TRELLIS+voxelization nails the BULK while fine
// architectural detail (window reveals, cornices, roof edges) stair-steps or reads soft. T-069 re-runs the
// E-15 surgical loop with the building's GLB as the FORM TARGET (region → diagnose → bounded tweak →
// accept-if-improved, P14-safe), bounded rounds, toward the categorical judge's STRONG+ verdict. The
// project's purpose is to find WHERE quality tops out — so if it tops out below Strong, this module MEASURES
// and EXPLAINS where/why (a result, not a failure to hide).
//
// THIS FILE IS THE PURE CORE (the only new reviewable logic): given the per-round judge cells + the merged
// loop trace, it computes the judge-verdict trajectory (AC#2), the form-IoU trajectory (AC#2), the
// per-region edit trace rows (procedural vs LLM, kept/rolled-back — AC#2), the P14-SAFETY verdict (no
// accepted region later altered; non-improving tweaks rolled back — AC#2), and the HONEST outcome
// (Strong+ @round OR the topping-out point: best verdict + the specific unfixed detail — AC#3). PURE — no
// GL, no I/O, no Date/random — so it runs under `src/**/*.test.mjs` (`npm test`). The impure runner
// (benchmarks/sculpture/surgical-standard.mjs) owns the GL render + claude -p judge + the loop and feeds this
// the cells/trace. Mirrors building-build.mjs (schema const + pure functions + private render*Md);
// null-tolerant (a missing judge sample → "unknown"; a null IoU → ranks last; never throws on a gap).

/** Schema tag stamped on the report json (downstream version-check). */
export const SURGICAL_STANDARD_SCHEMA = "surgical-standard/v1";

/** "A high standard of passing round" = the categorical judge reaches Strong or better (ticket Context). */
export const STANDARD_BAR = "strong";

/** The judge categories, ranked low→high (baml_src/judge.baml `Category`; benchmarks/.../judge.mjs order). */
export const CATEGORIES = Object.freeze(["weak", "competent", "strong", "exceptional"]);

const RANK = Object.freeze(Object.fromEntries(CATEGORIES.map((c, i) => [c, i])));

/** The procedural route set (tweak.mjs scopedTweakFor) — everything else is the LLM form-edit route. */
const PROCEDURAL_ROUTES = Object.freeze(new Set(["relief", "material"]));

const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const round3 = (n) => Math.round(n * 1000) / 1000;
const fmt = (v) => (isNum(v) ? String(round3(v)) : "—");

/** Inlined 5-line AABB overlap (the tweak.mjs kernel) — inlined to keep this pure core import-free. PURE. */
export function boxesIntersect(a, b) {
  if (!a || !b || !a.min || !a.max || !b.min || !b.max) return false;
  for (let ax = 0; ax < 3; ax++) {
    if (a.max[ax] < b.min[ax] || b.max[ax] < a.min[ax]) return false;
  }
  return true;
}

/**
 * Rank a judge category. weak=0 < competent=1 < strong=2 < exceptional=3; an unknown/null/missing verdict →
 * -1 (ranks BELOW weak, so it never spuriously meets the bar). PURE.
 * @param {string|null|undefined} cat
 * @returns {number}
 */
export function categoryRank(cat) {
  if (cat == null) return -1;
  const r = RANK[String(cat).toLowerCase()];
  return r === undefined ? -1 : r;
}

/** Does `verdict` meet the standard bar (default Strong)? PURE. */
export function meetsStandard(verdict, bar = STANDARD_BAR) {
  return categoryRank(verdict) >= categoryRank(bar);
}

/**
 * Normalize one round's judge cell → a row. Pass-through with guards; missing numeric/string fields stay
 * null (rendered "—"). `round` 0 is the pre-edit baseline. PURE.
 * @param {{round?:number, overall?:string, proportion?:string, color?:string, detail?:string,
 *          fidelity?:string, perSample?:string[], wholeIoU?:number, accepted?:number, note?:string}} cell
 */
export function roundCell(cell = {}) {
  const cat = (v) => (v == null ? null : String(v).toLowerCase());
  return {
    round: isNum(cell.round) ? Math.round(cell.round) : null,
    overall: cat(cell.overall),
    proportion: cat(cell.proportion),
    color: cat(cell.color),
    detail: cat(cell.detail),
    fidelity: cat(cell.fidelity),
    perSample: Array.isArray(cell.perSample) ? cell.perSample.map((s) => String(s).toLowerCase()) : null,
    wholeIoU: isNum(cell.wholeIoU) ? round3(cell.wholeIoU) : null,
    accepted: isNum(cell.accepted) ? Math.round(cell.accepted) : null,
    note: cell.note ?? null,
  };
}

/**
 * The AC#2 JUDGE-VERDICT TRAJECTORY: ordered {round, overall, wholeIoU} from the round cells (round 0 =
 * baseline). Sorted by round ascending; null rounds keep their input order at the end. PURE.
 * @param {Array<ReturnType<typeof roundCell>>} cells
 * @returns {Array<{round:number|null, overall:string|null, wholeIoU:number|null}>}
 */
export function verdictTrajectory(cells = []) {
  const rows = (cells || []).map(roundCell);
  const ordered = [...rows].sort((a, b) => {
    if (a.round == null) return 1;
    if (b.round == null) return -1;
    return a.round - b.round;
  });
  return ordered.map((r) => ({ round: r.round, overall: r.overall, wholeIoU: r.wholeIoU }));
}

/**
 * The AC#2 FORM-IoU TRAJECTORY from the merged loop trace: per accepted/attempted region its before→after
 * per-region IoU + delta + whether it was kept, plus the net Δ over accepted regions. Only entries that
 * actually scored (have scoreBefore/scoreAfter) contribute; clean/locked-overlap rows are skipped. PURE.
 * @param {Array<object>} trace  reviseLoop trace entries
 * @returns {{perRegion:Array<{region:any, before:number|null, after:number|null, delta:number|null,
 *           accepted:boolean}>, net:number}}
 */
export function formIoUTrajectory(trace = []) {
  const scored = (trace || []).filter((e) => e && (isNum(e.scoreBefore) || isNum(e.scoreAfter)));
  const perRegion = scored.map((e) => {
    const before = isNum(e.scoreBefore) ? round3(e.scoreBefore) : null;
    const after = isNum(e.scoreAfter) ? round3(e.scoreAfter) : null;
    const delta = isNum(before) && isNum(after) ? round3(after - before) : null;
    return { region: e.region ?? null, before, after, delta, accepted: !!e.accepted };
  });
  const net = round3(perRegion.filter((r) => r.accepted && isNum(r.delta)).reduce((s, r) => s + r.delta, 0));
  return { perRegion, net };
}

/**
 * The AC#2 PER-REGION EDIT TRACE: one row per scored attempt — region, route, whether it was PROCEDURAL
 * (relief/material) or LLM (any other route), the tweak label, before/after, kept/rolled-back, reason.
 * clean / locked-overlap rows (no tweak applied) are reported with kind "none". PURE.
 * @param {Array<object>} trace
 */
export function editTraceRows(trace = []) {
  return (trace || []).map((e) => {
    const route = e?.route ?? null;
    const scored = isNum(e?.scoreBefore) || isNum(e?.scoreAfter);
    const kind = !scored ? "none" : PROCEDURAL_ROUTES.has(route) ? "procedural" : "llm";
    return {
      region: e?.region ?? null,
      route,
      kind,
      tweak: e?.tweak ?? null,
      before: isNum(e?.scoreBefore) ? round3(e.scoreBefore) : null,
      after: isNum(e?.scoreAfter) ? round3(e.scoreAfter) : null,
      accepted: !!e?.accepted,
      reason: e?.reason ?? null,
    };
  });
}

/**
 * THE P14-SAFETY CHECK (AC#2): verify, over the merged loop trace, that the cage held — no accepted region
 * was later altered, and no non-improving tweak was kept. Returns `{ safe, violations }`:
 *   - "kept-non-improving": an accepted entry whose scoreAfter ≤ scoreBefore + eps (the gate must reject it).
 *   - "accepted-overlap": two ACCEPTED regions whose subBounds intersect (a locked region was re-accepted).
 *   - "altered-after-lock": an accepted edit on a region intersecting an EARLIER accepted region (the lock
 *     should have skipped it — `loop.mjs` does, so this is an alarm if it ever appears).
 * PURE. (The loop guarantees safety structurally; this MEASURES it, as the AC requires.)
 * @param {Array<object>} trace
 * @param {{eps?:number}} [opts]
 * @returns {{safe:boolean, violations:Array<object>, acceptedCount:number}}
 */
export function checkP14(trace = [], { eps = 0 } = {}) {
  const violations = [];
  const acceptedSubs = [];
  for (const e of trace || []) {
    if (!e || !e.accepted) continue;
    if (isNum(e.scoreBefore) && isNum(e.scoreAfter) && e.scoreAfter <= e.scoreBefore + eps) {
      violations.push({ type: "kept-non-improving", region: e.region ?? null, before: e.scoreBefore, after: e.scoreAfter });
    }
    const sub = e.subBounds ?? null;
    if (sub) {
      for (const prior of acceptedSubs) {
        if (boxesIntersect(prior, sub)) {
          violations.push({ type: "accepted-overlap", region: e.region ?? null, prior });
          violations.push({ type: "altered-after-lock", region: e.region ?? null, prior });
        }
      }
      acceptedSubs.push(sub);
    }
  }
  return { safe: violations.length === 0, violations, acceptedCount: acceptedSubs.length };
}

/**
 * THE TOPPING-OUT DETAIL (AC#3): the specific detail the loop could NOT fix — the ROLLED-BACK region with the
 * lowest final per-region IoU (the after-score it failed to beat its before from). null if every scored
 * region was accepted (nothing topped out). When a region has multiple rolled-back attempts, the lowest
 * after-score across them is used. PURE.
 * @param {Array<object>} trace
 * @returns {{region:any, finalIoU:number|null, kept:boolean, attempts:number}|null}
 */
export function toppingOutDetail(trace = []) {
  const byRegion = new Map();
  for (const e of trace || []) {
    if (!e || !(isNum(e.scoreBefore) || isNum(e.scoreAfter))) continue;
    const key = JSON.stringify(e.region ?? null);
    const cur = byRegion.get(key) ?? { region: e.region ?? null, anyAccepted: false, lowAfter: Infinity, attempts: 0 };
    cur.attempts += 1;
    if (e.accepted) cur.anyAccepted = true;
    if (isNum(e.scoreAfter)) cur.lowAfter = Math.min(cur.lowAfter, e.scoreAfter);
    byRegion.set(key, cur);
  }
  let worst = null;
  for (const v of byRegion.values()) {
    if (v.anyAccepted) continue; // a region the loop fixed is not a topping-out point
    const finalIoU = Number.isFinite(v.lowAfter) ? round3(v.lowAfter) : null;
    if (worst === null || (isNum(finalIoU) && (worst.finalIoU == null || finalIoU < worst.finalIoU))) {
      worst = { region: v.region, finalIoU, kept: false, attempts: v.attempts };
    }
  }
  return worst;
}

/**
 * THE HONEST OUTCOME (AC#3). From the verdict trajectory + the trace, decide: did the loop REACH the standard
 * (Strong+) and at which round, or did it TOP OUT — and if so, the best verdict it reached + the specific
 * detail it couldn't fix. PURE.
 * @param {{trajectory:Array<{round:number|null, overall:string|null, wholeIoU:number|null}>,
 *          trace?:Array<object>, bar?:string}} input
 * @returns {{reachedStandard:boolean, atRound:number|null, bestVerdict:string|null, bestAtRound:number|null,
 *           toppingOut:{verdict:string|null, detail:object|null}|null, bar:string}}
 */
export function assessOutcome({ trajectory = [], trace = [], bar = STANDARD_BAR } = {}) {
  let best = null; // {verdict, round, rank}
  let reachedAt = null;
  for (const t of trajectory) {
    const rank = categoryRank(t.overall);
    if (best === null || rank > best.rank) best = { verdict: t.overall, round: t.round, rank };
    if (reachedAt === null && meetsStandard(t.overall, bar)) reachedAt = t.round;
  }
  const reachedStandard = reachedAt !== null;
  return {
    reachedStandard,
    atRound: reachedAt,
    bestVerdict: best ? best.verdict : null,
    bestAtRound: best ? best.round : null,
    toppingOut: reachedStandard ? null : { verdict: best ? best.verdict : null, detail: toppingOutDetail(trace) },
    bar,
  };
}

/**
 * Assemble the surgical-standard report. PURE.
 * @param {{rounds:Array, trace?:Array, baseline?:object, locked?:Array, generatedFrom?:string, brief?:string,
 *          bar?:string, eps?:number, subject?:string}} input
 * @returns {{md:string, json:object}}
 */
export function assembleSurgicalStandard({
  rounds = [],
  trace = [],
  generatedFrom,
  brief,
  bar = STANDARD_BAR,
  eps = 0,
  subject = "building",
} = {}) {
  if (!Array.isArray(rounds)) throw new Error("assembleSurgicalStandard: rounds must be an array");
  if (!Array.isArray(trace)) throw new Error("assembleSurgicalStandard: trace must be an array");

  const cells = rounds.map(roundCell);
  const trajectory = verdictTrajectory(cells);
  const formIoU = formIoUTrajectory(trace);
  const editTrace = editTraceRows(trace);
  const p14 = checkP14(trace, { eps });
  const outcome = assessOutcome({ trajectory, trace, bar });

  const json = {
    schema: SURGICAL_STANDARD_SCHEMA,
    subject,
    bar,
    brief: brief ?? null,
    generatedFrom:
      generatedFrom ??
      "surgical-standard live run: reviseLoop(building best) with glbFormTarget(stone-gatehouse.glb), " +
        "bounded rounds, GLB per-region IoU accept-gate; categorical JudgeFacade per round (median samples)",
    trajectory,
    formIoU,
    editTrace,
    p14,
    outcome,
    rounds: cells,
    note:
      "The accept-gate is the DETERMINISTIC GLB per-region form-IoU compare (a hill-climb cannot tolerate a " +
      "non-deterministic gate — the E-15/T-073 lesson); the categorical judge is the OUTER measurement of " +
      "where quality tops out, not the inner gate. P14-safety (no accepted region later altered; " +
      "non-improving tweaks rolled back) is the loop's structural guarantee — checkP14 MEASURES it. Absolute " +
      "IoU is bounded by the TRELLIS GLB reconstruction (T-067); the relative trajectory is the signal. " +
      "Judge caveat: the JudgeFacade prompt frames a temple facade head-on; the subject is a gatehouse at " +
      "3/4 view (enum + dims transfer; the framing is a recorded residual).",
  };
  return { md: renderStandardMd(json), json };
}

// --- markdown -------------------------------------------------------------------------------------------

function renderStandardMd(json) {
  const o = json.outcome;
  const traj = json.trajectory;
  const lines = [
    "# Surgical refine-to-standard — the E-15 loop + GLB form target on the high-res building (T-069-01)",
    "",
    "The E-20 quality bar. The placed + clean high-res building (T-068-01) re-run through the E-15 surgical",
    "revision loop with the building's **GLB as the form target** (region → diagnose → bounded tweak →",
    "**accept-if-improved**, P14-safe), bounded rounds, toward the categorical judge's **Strong+** verdict.",
    "The purpose is to find WHERE quality tops out — so a sub-Strong ceiling is measured + explained, not hidden.",
    "",
    `Subject: ${json.subject}. Standard bar: **${json.bar}+**. Schema \`${json.schema}\`.`,
    "",
    "## Outcome (AC#3 — stated honestly)",
    "",
    o.reachedStandard
      ? `**Reached ${json.bar}+** at round **${o.atRound}** (best verdict \`${o.bestVerdict}\` @ round ${o.bestAtRound}).`
      : `**Topped out at \`${o.bestVerdict ?? "—"}\`** (best @ round ${o.bestAtRound ?? "—"}) — did NOT reach ${json.bar}+. ` +
        (o.toppingOut && o.toppingOut.detail
          ? `The specific detail the loop could not fix: region \`${JSON.stringify(o.toppingOut.detail.region)}\` ` +
            `(final per-region IoU ${fmt(o.toppingOut.detail.finalIoU)}, ${o.toppingOut.detail.attempts} attempt(s), 0 kept).`
          : "No rolled-back scored region isolated as the topping-out detail (the cage held the build unchanged)."),
    "",
    "## Judge-verdict trajectory (AC#2)",
    "",
    "| round | overall | whole-object IoU |",
    "| ----- | ------- | ---------------- |",
    ...(traj.length
      ? traj.map((t) => `| ${t.round == null ? "—" : t.round}${t.round === 0 ? " (baseline)" : ""} | ${t.overall ?? "—"} | ${fmt(t.wholeIoU)} |`)
      : ["| — | _(no rounds ran — assets/model absent)_ | — |"]),
    "",
    "## Per-region edit trace (AC#2 — procedural vs LLM, kept/rolled-back)",
    "",
    "| region | route | kind | tweak | IoU before→after | kept? | reason |",
    "| ------ | ----- | ---- | ----- | ---------------- | ----- | ------ |",
    ...(json.editTrace.length
      ? json.editTrace.map(
          (r) =>
            `| \`${JSON.stringify(r.region)}\` | ${r.route ?? "—"} | ${r.kind} | ${r.tweak ?? "—"} | ` +
            `${fmt(r.before)}→${fmt(r.after)} | ${r.accepted ? "✓" : "✗"} | ${r.reason ?? "—"} |`,
        )
      : ["| — | — | — | — | — | — | _(no edits)_ |"]),
    "",
    `Net form-IoU gain over accepted regions: **${fmt(json.formIoU.net)}**.`,
    "",
    "## P14-safety (AC#2 — no accepted region later altered; non-improving tweaks rolled back)",
    "",
    json.p14.safe
      ? `**SAFE** ✓ — ${json.p14.acceptedCount} accepted region(s), all disjoint, every kept edit strictly improved.`
      : `**VIOLATIONS** ✗ (${json.p14.violations.length}): ${json.p14.violations.map((v) => v.type).join(", ")}.`,
    "",
    `> _Note:_ ${json.note}`,
    "",
  ];
  return lines.join("\n");
}
