// E-17 scorecard — the per-technique attribution layer over the R0–R3 data spine (T-057-01, story
// S-057, epic E-17).
//
// T-056-01 collected the spine (sweep-ablation.json): all 7 subjects up one ladder, every rung scored
// the same way. This module is the PURE presentation step that answers, in one place, "what did each
// TECHNIQUE buy on average?" — by averaging each rung's MARGINAL column across subjects:
//
//   voxel          = R1 − R0   (grounding geometry in the GLB voxelization)
//   material-clean = R2 − R1   (snap palette to the GLB's own canonical values)
//   surgical       = R3 − R2   (per-region single-view revise loop)
//
// It consumes the already-assembled spine JSON verbatim (no re-derivation from renders → cannot drift
// from the record) and emits the scorecard markdown + a `scorecard/v1` JSON. No I/O, no GL, no imports
// outside src/. The runner (benchmarks/sculpture/_archive/sweep-scorecard.mjs) reads/writes files and stitches
// the march PNGs; this is the testable core (src/**/*.test.mjs).

import { RUNGS, VERDICT_GLOSS } from "./ablation.mjs";

const RUNG_IDS = RUNGS.map((r) => r.id);
const EPS_IOU = 1e-3; // strict-improvement margin on mean ΔformIoU (matches rungVerdict eps)
const EPS_DE = 0.05; // ΔE noise floor for "did the palette move on average?"

/** The three techniques = the marginal column each non-baseline rung adds (frozen, ordered). */
export const TECHNIQUES = Object.freeze([
  Object.freeze({ key: "voxel", rung: "R1", from: "R0", label: "glb-voxel (form grounding)" }),
  Object.freeze({ key: "material-clean", rung: "R2", from: "R1", label: "material-clean (palette)" }),
  Object.freeze({ key: "surgical", rung: "R3", from: "R2", label: "surgical (per-region)" }),
]);

const round3 = (n) => Math.round(n * 1000) / 1000;
const round2 = (n) => Math.round(n * 100) / 100;

/** Mean over the numeric (non-null) entries, plus how many were averaged. PURE. */
export function meanPresent(values) {
  const nums = (values || []).filter((v) => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return { mean: null, n: 0 };
  return { mean: nums.reduce((s, v) => s + v, 0) / nums.length, n: nums.length };
}

/** A technique's headline verdict from its averaged marginals. PURE. */
function techVerdict(meanDFormIoU, meanDValueDeltaE) {
  if (typeof meanDFormIoU === "number" && meanDFormIoU > EPS_IOU) return "won-form";
  if (typeof meanDFormIoU === "number" && meanDFormIoU < -EPS_IOU) return "regressed-form";
  if (typeof meanDValueDeltaE === "number" && meanDValueDeltaE < -EPS_DE) return "won-value";
  return "wash";
}

const TECH_VERDICT_GLOSS = Object.freeze({
  "won-form": "raised form IoU on average — a form lever",
  "won-value": "cleaned the palette on average without moving form — a value lever",
  "regressed-form": "lowered form IoU on average — a net cost on shape",
  wash: "moved neither form nor palette on average — no net gain",
});

/**
 * Per-technique aggregate across all subjects in the spine: mean marginal ΔformIoU / ΔvalueΔE, the
 * count averaged, the rung-verdict tally, and the headline verdict. PURE; tolerant of missing cells.
 *
 * @param {{subjects:{subject:string, rungs:Object}[]}} spine  sweep-ablation/v1 JSON
 * @returns {{key,label,rung,from,meanDFormIoU,meanDValueDeltaE,n,improved,held,regressed,verdict}[]}
 */
export function attributeTechniques(spine) {
  const subjects = (spine && Array.isArray(spine.subjects) ? spine.subjects : []);
  return TECHNIQUES.map((t) => {
    const dForm = [];
    const dDE = [];
    const tally = { improved: 0, held: 0, regressed: 0 };
    for (const s of subjects) {
      const cell = s && s.rungs ? s.rungs[t.rung] : null;
      if (!cell) continue;
      if (typeof cell.dFormIoU === "number") dForm.push(cell.dFormIoU);
      if (typeof cell.dValueDeltaE === "number") dDE.push(cell.dValueDeltaE);
      if (cell.verdict in tally) tally[cell.verdict] += 1;
    }
    const mForm = meanPresent(dForm);
    const mDE = meanPresent(dDE);
    const meanDFormIoU = mForm.mean == null ? null : round3(mForm.mean);
    const meanDValueDeltaE = mDE.mean == null ? null : round2(mDE.mean);
    return {
      key: t.key,
      label: t.label,
      rung: t.rung,
      from: t.from,
      meanDFormIoU,
      meanDValueDeltaE,
      n: Math.max(mForm.n, mDE.n),
      ...tally,
      verdict: techVerdict(meanDFormIoU, meanDValueDeltaE),
    };
  });
}

const fmt = (n) => (typeof n === "number" ? n.toFixed(3) : "—");
const fmtDE = (n) => (typeof n === "number" ? n.toFixed(2) : "—");
const sign = (n) => (typeof n === "number" ? (n >= 0 ? `+${n.toFixed(3)}` : n.toFixed(3)) : "—");
const signDE = (n) => (typeof n === "number" ? (n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2)) : "—");

/**
 * spine (sweep-ablation/v1 JSON) → { md, json } scorecard. PURE; tolerant of missing subjects/cells.
 * The md carries: the Levels table, the per-subject Marginal Δ table, and the AVG / Δ technique
 * attribution table + verdict lines + honesty notes. json is `scorecard/v1`.
 *
 * @param {object} spine
 * @param {{scale?:number}} [opts]
 */
export function assembleScorecard(spine, opts = {}) {
  const subjects = spine && Array.isArray(spine.subjects) ? spine.subjects : [];
  const techniques = attributeTechniques(spine);
  const scale = opts.scale ?? spine?.scale;

  const json = {
    schema: "scorecard/v1",
    epic: "E-17",
    ...(scale ? { scale } : {}),
    rungs: RUNGS.map((r) => ({ ...r })),
    techniques,
    subjects,
    note:
      "E-17 scorecard (T-057-01): the per-technique attribution over the T-056-01 data spine. Each " +
      "technique's row is the MEAN of its marginal column across the present subjects (n reported). " +
      "material-clean's valueΔE drops to the GLB's OWN canonical palette, so the R2/R3 residual is 0 " +
      "by construction — the win is the R1→R2 cleanup, and it is partly tautological (a snap to the " +
      "reference). surgical's mean form Δ is ~0 (one regression): a single-view per-region accept-gate " +
      "rarely lifts the whole-object silhouette on an already-grounded build. Zero/negative shown.",
  };

  return { md: renderMd(json), json };
}

/** PURE: scorecard json → markdown (Levels + Marginal Δ + AVG/Δ attribution + notes). */
function renderMd(json) {
  const lvlHead = "| subject | metric | " + RUNGS.map((r) => `${r.id} ${r.label}`).join(" | ") + " |";
  const lvlSep = "| " + Array(RUNGS.length + 2).fill("---").join(" | ") + " |";
  const lvlRows = [];
  for (const s of json.subjects) {
    lvlRows.push(`| **${s.subject}** | form IoU | ` + RUNG_IDS.map((id) => fmt(s.rungs[id]?.formIoU)).join(" | ") + " |");
    lvlRows.push(`| | value ΔE | ` + RUNG_IDS.map((id) => fmtDE(s.rungs[id]?.valueDeltaE)).join(" | ") + " |");
    lvlRows.push(`| | verdict | ` + RUNG_IDS.map((id) => s.rungs[id]?.verdict ?? "—").join(" | ") + " |");
  }

  const mgHead = "| subject | Δ | R1−R0 voxel | R2−R1 material-clean | R3−R2 surgical |";
  const mgSep = "| --- | --- | --- | --- | --- |";
  const mgRows = [];
  for (const s of json.subjects) {
    mgRows.push(`| **${s.subject}** | ΔformIoU | ${sign(s.rungs.R1?.dFormIoU)} | ${sign(s.rungs.R2?.dFormIoU)} | ${sign(s.rungs.R3?.dFormIoU)} |`);
    mgRows.push(`| | ΔvalueΔE | ${signDE(s.rungs.R1?.dValueDeltaE)} | ${signDE(s.rungs.R2?.dValueDeltaE)} | ${signDE(s.rungs.R3?.dValueDeltaE)} |`);
  }

  const avgHead = "| technique | rung | n | avg ΔformIoU | avg ΔvalueΔE | improved/held/regressed | verdict |";
  const avgSep = "| --- | --- | ---: | ---: | ---: | :---: | --- |";
  const avgRows = json.techniques.map(
    (t) =>
      `| **${t.label}** | ${t.from}→${t.rung} | ${t.n} | ${sign(t.meanDFormIoU)} | ${signDE(t.meanDValueDeltaE)} | ` +
      `${t.improved}/${t.held}/${t.regressed} | ${t.verdict} |`,
  );

  const verdictLines = json.techniques.map(
    (t) => `- **${t.label}** — ${TECH_VERDICT_GLOSS[t.verdict]} (avg Δform ${sign(t.meanDFormIoU)}, avg Δvalue ${signDE(t.meanDValueDeltaE)}, n=${t.n}).`,
  );

  return [
    "# E-17 consolidation scorecard — what did each improvement buy? (T-057-01)",
    "",
    "One legible answer to *\"it's hard to tell what improvements got made.\"* All 7 sculptural subjects",
    "climb one canonical ladder (`R0 text→JSON → R1 glb-voxel → R2 +material-clean → R3 +surgical`); every",
    "rung is scored the same way against the subject's own image→3D GLB. Source spine:",
    "`benchmarks/sculpture/_archive/sweep-ablation.json` (T-056-01) — this scorecard is a pure transform of it.",
    "",
    "- **form IoU** — whole-build 3/4-view silhouette IoU vs the GLB mesh (normalized; higher = truer shape).",
    "- **value ΔE** — coverage-weighted CIE76 of the realized palette vs the GLB's own texture palette (lower = cleaner).",
    "- **verdict** — form IoU rung-over-rung (baseline / improved / held / regressed).",
    "",
    "## Levels — every rung, every subject",
    "",
    lvlHead,
    lvlSep,
    ...lvlRows,
    "",
    "## Marginal Δ — what each rung added (per subject)",
    "",
    "Signed change vs the previous present rung. `ΔformIoU > 0` = truer shape; `ΔvalueΔE < 0` = cleaner palette.",
    "",
    mgHead,
    mgSep,
    ...mgRows,
    "",
    "## AVG / Δ — what each TECHNIQUE bought on average",
    "",
    "The headline: each technique's row is the **mean of its marginal column** across the 7 subjects.",
    "",
    avgHead,
    avgSep,
    ...avgRows,
    "",
    ...verdictLines,
    "",
    "## Honesty notes",
    "",
    "- **Form is bought once, by voxelization.** Grounding the geometry in the image→3D GLB (R1) is the",
    "  decisive form lever; material-clean and surgical add ~0 form on average.",
    "- **material-clean is a value lever, and its residual is tautological.** It snaps the palette to the",
    "  GLB's *own* canonical texture values, so the R2/R3 `value ΔE` is 0 by construction. The real win is",
    "  the R1→R2 cleanup (`avg ΔvalueΔE`), not the zero.",
    "- **surgical is a net wash on an already-grounded build.** Mean form Δ ≈ 0 with one regression",
    "  (bow-and-arrow −0.004); 0 subjects improved. A single-view per-region accept-gate rarely lifts the",
    "  whole-object silhouette — the E-15/E-16 ceiling persists. The cage still holds (non-improving tweaks",
    "  roll back); it simply has little headroom here. Recorded, not dropped.",
    "- **R0 is a normalized cross-target floor**, not a like-for-like comparison (the text→JSON build coords",
    "  differ from the mesh; translation + uniform scale are normalized out).",
    "",
    "## Verdict legend (rung-over-rung)",
    "",
    ...Object.entries(VERDICT_GLOSS).map(([k, v]) => `- **${k}** — ${v}`),
    "",
  ].join("\n");
}

export { TECH_VERDICT_GLOSS };
export const _internal = { round2, round3, techVerdict, EPS_IOU, EPS_DE };
