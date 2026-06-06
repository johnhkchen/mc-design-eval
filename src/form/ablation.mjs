// Ablation-sweep core — E-17 rung R3 region picker + the R0–R3 data-spine assembly (T-056-01, story
// S-056, epic E-17).
//
// E-17 takes all 7 sculptural subjects up ONE canonical ladder and scores every rung the same way:
//   R0 text→JSON · R1 glb-voxel · R2 +material-clean · R3 +surgical.
// This module is the PURE, GL-/network-FREE half: (a) `autoRegions` derives the R3 surgical loop's region
// list from a build's bounds (generic, mass-bearing horizontal slabs — no curated per-subject defects);
// (b) `rungVerdict` is the categorical "what did this rung buy?" (mirrors the sibling `formVerdictOf` with
// accepted=true, redefined HERE so src/ never imports a benchmark file); (c) `assembleAblation` is the
// metric-collection logic — flat per-(subject,rung) rows → the `subject × rung` structured record with the
// marginal Δ each rung added, plus the markdown table. Tolerant of null/missing cells (a rung's asset may
// be absent) so the sweep never drops a subject or rung silently (AC #3).
//
// The two live runners (glb-voxel-surgical-sweep.mjs, sweep-ablation.mjs) own all GL/host glue and call
// into here. Unit-tested offline under the src/**/*.test.mjs glob (AC #4).

/** The canonical ladder. `id` is the column key; `label` the human gloss. Order is the ablation order. */
export const RUNGS = Object.freeze([
  Object.freeze({ id: "R0", label: "text→JSON" }),
  Object.freeze({ id: "R1", label: "glb-voxel" }),
  Object.freeze({ id: "R2", label: "+material-clean" }),
  Object.freeze({ id: "R3", label: "+surgical" }),
]);

const RUNG_IDS = RUNGS.map((r) => r.id);
const round3 = (n) => Math.round(n * 1000) / 1000;
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Derive a generic region list for the R3 surgical loop from a build's voxel AABB: split the Y span into
 * `slabs` contiguous horizontal slabs, each spanning the FULL X,Z cross-section (so every region carries
 * mass — no curated per-subject defect picking). The slabs tile [minY, maxY] exactly; the last slab
 * absorbs any remainder. PURE; integer voxel coords. Returns `selectRegion`-ready `{ bbox }` specs.
 *
 * @param {{min:number[], max:number[]}} bounds  artifactBounds() output ([x,y,z] min/max)
 * @param {{slabs?:number}} [opts]
 * @returns {{bbox:{min:number[], max:number[]}}[]}
 */
export function autoRegions(bounds, { slabs = 3 } = {}) {
  if (!bounds || !Array.isArray(bounds.min) || !Array.isArray(bounds.max)) {
    throw new Error("autoRegions: bounds must be { min:[x,y,z], max:[x,y,z] }");
  }
  const n = Math.max(1, Math.floor(slabs));
  const [minX, minY, minZ] = bounds.min;
  const [maxX, maxY, maxZ] = bounds.max;
  const span = maxY - minY; // inclusive voxel span is (span+1) rows
  const out = [];
  for (let s = 0; s < n; s++) {
    // Partition the inclusive [minY, maxY] range into n contiguous bands; the last band ends at maxY.
    const y0 = minY + Math.round((span * s) / n);
    const y1 = s === n - 1 ? maxY : minY + Math.round((span * (s + 1)) / n) - 1;
    out.push({ bbox: { min: [minX, Math.min(y0, maxY), minZ], max: [maxX, Math.max(y1, y0), maxZ] } });
  }
  return out;
}

/**
 * The categorical rung verdict on form IoU, rung-over-rung. `prevIoU == null` (the first present rung,
 * normally R0) → "baseline". A non-number on either side → "unknown". Otherwise improved / regressed /
 * held under a strict-improvement margin. Mirrors `formVerdictOf(prev, cur, accepted=true)`; defined here
 * so src/ stays free of benchmark imports. PURE.
 *
 * @param {number|null|undefined} prevIoU
 * @param {number|null|undefined} curIoU
 * @param {number} [eps]
 * @returns {"baseline"|"improved"|"held"|"regressed"|"unknown"}
 */
export function rungVerdict(prevIoU, curIoU, eps = 1e-3) {
  if (prevIoU == null) return "baseline";
  if (typeof prevIoU !== "number" || typeof curIoU !== "number") return "unknown";
  if (curIoU > prevIoU + eps) return "improved";
  if (curIoU < prevIoU - eps) return "regressed";
  return "held";
}

const VERDICT_GLOSS = {
  baseline: "the first rung — nothing to compare against (the floor every later rung is measured from)",
  improved: "this rung raised form IoU vs the previous rung",
  held: "this rung left form IoU essentially unchanged (|Δ| ≤ eps) — it bought no form",
  regressed: "this rung lowered form IoU vs the previous rung",
  unknown: "a missing IoU on one side — this rung's asset was absent or unscored",
};

const numOrNull = (v) => (typeof v === "number" ? v : null);
const delta = (cur, prev) => (typeof cur === "number" && typeof prev === "number" ? round3(cur - prev) : null);

/**
 * Assemble the R0–R3 data spine. Group flat rows by subject, order by RUNGS, and for each present cell
 * compute the rung verdict + the marginal Δ vs the previous PRESENT rung (form IoU and value ΔE). PURE;
 * never throws on a null/missing cell. `dValueDeltaE < 0` means the palette got cleaner.
 *
 * @param {{subject:string, rung:string, formIoU?:number|null, valueDeltaE?:number|null,
 *          skipped?:boolean, note?:string}[]} rows
 * @param {{scale?:number}} [opts]
 * @returns {{md:string, json:object}}
 */
export function assembleAblation(rows, opts = {}) {
  const bySubject = new Map();
  for (const r of rows || []) {
    if (!r || typeof r.subject !== "string") continue;
    if (!bySubject.has(r.subject)) bySubject.set(r.subject, new Map());
    bySubject.get(r.subject).set(r.rung, r);
  }

  const subjects = [...bySubject.entries()].map(([subject, cellByRung]) => {
    const rungs = {};
    let prevIoU = null;
    let prevDE = null;
    for (const id of RUNG_IDS) {
      const cell = cellByRung.get(id);
      const formIoU = cell ? numOrNull(cell.formIoU) : null;
      const valueDeltaE = cell ? numOrNull(cell.valueDeltaE) : null;
      const verdict = rungVerdict(prevIoU, formIoU);
      rungs[id] = {
        formIoU,
        valueDeltaE,
        verdict,
        dFormIoU: delta(formIoU, prevIoU),
        dValueDeltaE: delta(valueDeltaE, prevDE),
        ...(cell && cell.note ? { note: cell.note } : {}),
      };
      // Advance the "previous present rung" cursors only when this rung actually has a number.
      if (formIoU != null) prevIoU = formIoU;
      if (valueDeltaE != null) prevDE = valueDeltaE;
    }
    return { subject, rungs };
  });

  const json = {
    schema: "sweep-ablation/v1",
    epic: "E-17",
    ...(opts.scale ? { scale: opts.scale } : {}),
    rungs: RUNGS.map((r) => ({ ...r })),
    metric:
      "formIoU = whole-build 3/4-view silhouette IoU vs the subject's GLB mesh (SCULPTURE_VIEW_3Q, " +
      "normalized — translation + uniform scale removed). valueDeltaE = coverage-weighted mean CIE76 of " +
      "the realized palette vs the GLB's own canonical texture palette (value-gate.mjs; lower = cleaner). " +
      "verdict = form IoU rung-over-rung (baseline|improved|held|regressed). dFormIoU / dValueDeltaE = the " +
      "marginal change each rung added vs the previous present rung (dValueDeltaE < 0 = cleaner).",
    note:
      "E-17 data spine (T-056-01): all 7 subjects up one ladder, every rung scored the same way. R3's " +
      "verdict is expected to be 'held' on the already-close GLB-voxel builds (a single-view per-region " +
      "accept-gate rarely lifts the whole-object silhouette) — recorded honestly, not dropped. R0's IoU is " +
      "measured against the GLB after silhouette normalization; the build coords differ from the mesh, so " +
      "it is the honest cross-target floor, not a like-for-like comparison.",
    subjects,
  };

  return { md: renderMd(json), json };
}

const fmt = (n) => (typeof n === "number" ? n.toFixed(3) : "—");
const fmtDE = (n) => (typeof n === "number" ? n.toFixed(2) : "—");
const sign = (n) => (typeof n === "number" ? (n >= 0 ? `+${n.toFixed(3)}` : n.toFixed(3)) : "—");
const signDE = (n) => (typeof n === "number" ? (n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2)) : "—");

/** PURE: the structured json → the human markdown record (two tables + the verdict gloss). */
function renderMd(json) {
  const head = "| subject | metric | " + RUNGS.map((r) => `${r.id} ${r.label}`).join(" | ") + " |";
  const sep = "| " + Array(RUNGS.length + 2).fill("---").join(" | ") + " |";

  const metricRows = [];
  for (const s of json.subjects) {
    metricRows.push(
      `| **${s.subject}** | form IoU | ` + RUNG_IDS.map((id) => fmt(s.rungs[id].formIoU)).join(" | ") + " |",
    );
    metricRows.push(
      `| | value ΔE | ` + RUNG_IDS.map((id) => fmtDE(s.rungs[id].valueDeltaE)).join(" | ") + " |",
    );
    metricRows.push(
      `| | verdict | ` + RUNG_IDS.map((id) => s.rungs[id].verdict).join(" | ") + " |",
    );
  }

  const marginHead = "| subject | Δ | R1−R0 | R2−R1 | R3−R2 |";
  const marginSep = "| --- | --- | --- | --- | --- |";
  const marginRows = [];
  for (const s of json.subjects) {
    marginRows.push(
      `| **${s.subject}** | ΔformIoU | ${sign(s.rungs.R1.dFormIoU)} | ${sign(s.rungs.R2.dFormIoU)} | ${sign(s.rungs.R3.dFormIoU)} |`,
    );
    marginRows.push(
      `| | ΔvalueΔE | ${signDE(s.rungs.R1.dValueDeltaE)} | ${signDE(s.rungs.R2.dValueDeltaE)} | ${signDE(s.rungs.R3.dValueDeltaE)} |`,
    );
  }

  return [
    "# E-17 ablation sweep — what did each improvement buy? (T-056-01)",
    "",
    "All 7 sculptural subjects up one canonical ladder, every rung scored the same way. `form IoU` =",
    "silhouette IoU vs the subject's GLB at SCULPTURE_VIEW_3Q (normalized). `value ΔE` = realized-palette",
    "distance to the GLB's own canonical texture palette (lower = cleaner). `verdict` = form rung-over-rung.",
    "",
    "## Levels",
    "",
    head,
    sep,
    ...metricRows,
    "",
    "## Marginal Δ each rung added",
    "",
    "Signed change vs the previous present rung. `ΔformIoU > 0` = more faithful shape; `ΔvalueΔE < 0` =",
    "cleaner palette. R3 is expected to be ~0 on form (the cage holds the already-close build) — recorded,",
    "not dropped.",
    "",
    marginHead,
    marginSep,
    ...marginRows,
    "",
    "## Verdicts",
    "",
    ...Object.entries(VERDICT_GLOSS).map(([k, v]) => `- **${k}** — ${v}`),
    "",
  ].join("\n");
}

export { VERDICT_GLOSS };
export const _internal = { round2, round3 };
