// E-18 COMBINED REMEASURE assembler — the integration data spine (T-060-01, story S-060, epic E-18).
//
// E-18 closes E-17's two glb-voxel gaps: SPECKLE (T-058 segmentMaterials) and THIN FORM (T-059
// voxelizeGlbThin). T-060 combines them (thin voxelization → segmentMaterials) and re-measures the result
// against the E-17 R1 (glb-voxel) and R2 (material-clean) baselines on FIVE axes — form IoU, speckle,
// distinct-block, off-palette, value ΔE — so the consolidation (T-061) is a pure read.
//
// THIS MODULE IS THE PURE HALF: it takes ALREADY-COLLECTED per-subject metric rows and assembles the
// `{ md, json }` record — direction-aware deltas (E18 vs R1 and vs R2), per-build averages, and an HONEST
// list of cells where a fix did NOT help (zero/negative delta, AC #3). No GL, no I/O, no GLB — runs under
// `src/**/*.test.mjs`. The GL/host runner (benchmarks/sculpture/e18-remeasure.mjs) collects the rows and
// owns render + dwebp; this owns the arithmetic and formatting. Same pure/GL split as ablation.mjs.
//
// NOTE — the value-ΔE tautology (memory: ablation-value-ΔE-tautology): R2 and E18 both snap to the GLB's
// own texture palette, so their value ΔE against that palette is ~0 BY CONSTRUCTION. A 0 E18-vs-R2 value-ΔE
// delta is therefore "no change", not a defect; it is recorded but flagged as tautological so a reader does
// not over-read it. Speckle / distinct / off-palette carry the real discrimination.

/** Schema tag stamped on the json (downstream version-check). */
export const REMEASURE_SCHEMA = "e18-remeasure/v1";

/** The five measured axes, in display order, each with its improvement direction. */
export const METRICS = Object.freeze([
  Object.freeze({ key: "formIoU", label: "form IoU", better: "higher" }),
  Object.freeze({ key: "speckle", label: "speckle", better: "lower" }),
  Object.freeze({ key: "distinct", label: "distinct", better: "lower" }),
  Object.freeze({ key: "offPalette", label: "off-pal", better: "lower" }),
  Object.freeze({ key: "valueDeltaE", label: "value ΔE", better: "lower" }),
]);

/** Build columns in display order (R1 → R2 → E18). */
export const BUILDS = Object.freeze(["r1", "r2", "e18"]);

const round2 = (n) => Math.round(n * 100) / 100;
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const metricByKey = new Map(METRICS.map((m) => [m.key, m]));

/**
 * Direction-aware improvement test. True iff `value` is strictly better than `baseline` for the metric's
 * direction; false if equal-or-worse; null if either side is missing.
 * @param {string|{better:string}} metric  a METRICS entry or its key
 */
export function improved(metric, value, baseline) {
  const m = typeof metric === "string" ? metricByKey.get(metric) : metric;
  if (!m) throw new Error(`improved: unknown metric ${JSON.stringify(metric)}`);
  if (!isNum(value) || !isNum(baseline)) return null;
  return m.better === "higher" ? value > baseline : value < baseline;
}

/**
 * Signed delta `value − baseline` plus the direction-aware `improved` verdict. raw/improved are null when
 * either side is missing.
 * @returns {{ raw:number|null, improved:boolean|null }}
 */
export function delta(metric, value, baseline) {
  const raw = isNum(value) && isNum(baseline) ? round2(value - baseline) : null;
  return { raw, improved: improved(metric, value, baseline) };
}

/** Mean of a build's metric over the subjects where it is present (null if none). */
function average(rows, build, key) {
  let sum = 0;
  let n = 0;
  for (const r of rows) {
    const v = r[build] && r[build][key];
    if (isNum(v)) {
      sum += v;
      n += 1;
    }
  }
  return n === 0 ? null : round2(sum / n);
}

/** "a→b→c" with `—` for nulls. */
function triple(r, key) {
  const cell = (b) => {
    const v = r[b] && r[b][key];
    return isNum(v) ? String(round2(v)) : "—";
  };
  return `${cell("r1")}→${cell("r2")}→${cell("e18")}`;
}

/** "comp N, +M" thin diagnostic, or `—`. */
function thinCell(r) {
  const t = r.thin;
  if (!t) return "—";
  const comp = isNum(t.components) ? `comp ${t.components}` : "comp —";
  const added = isNum(t.surfaceOnlyCount) ? `, +${t.surfaceOnlyCount}` : "";
  return `${comp}${added}`;
}

/**
 * Assemble the E-18 combined remeasure record from collected per-subject rows. PURE.
 * @param {{ subject:string,
 *           r1?:object, r2?:object, e18?:object,   // each: {formIoU,speckle,distinct,offPalette,valueDeltaE}
 *           thin?:{components?:number, surfaceOnlyCount?:number, occBase?:number, occThin?:number},
 *           note?:string }[]} rows
 * @param {{ scale?:number, generatedFrom?:string }} [opts]
 * @returns {{ md:string, json:object }}
 */
export function assembleRemeasure(rows, opts = {}) {
  if (!Array.isArray(rows)) throw new Error("assembleRemeasure: rows must be an array");
  const scale = opts.scale ?? null;

  const subjects = rows.map((r) => {
    const deltas = { vsR1: {}, vsR2: {} };
    for (const m of METRICS) {
      const e = r.e18 ? r.e18[m.key] : null;
      deltas.vsR1[m.key] = delta(m, e, r.r1 ? r.r1[m.key] : null);
      deltas.vsR2[m.key] = delta(m, e, r.r2 ? r.r2[m.key] : null);
    }
    return {
      subject: r.subject,
      r1: r.r1 ?? null,
      r2: r.r2 ?? null,
      e18: r.e18 ?? null,
      thin: r.thin ?? null,
      deltas,
      ...(r.note ? { note: r.note } : {}),
    };
  });

  // Honest "didn't help": E18 cells that are not strictly better than a baseline (improved === false).
  // The value-ΔE no-change cells are the documented tautology — listed, but flagged so they aren't misread.
  const regressions = [];
  let valueTautology = false;
  for (const s of subjects) {
    for (const vs of ["vsR1", "vsR2"]) {
      for (const m of METRICS) {
        const d = s.deltas[vs][m.key];
        if (d.improved === false) {
          const kind = d.raw === 0 ? "no-change" : "worse";
          if (m.key === "valueDeltaE" && kind === "no-change") valueTautology = true;
          regressions.push({ subject: s.subject, metric: m.key, vs: vs === "vsR1" ? "r1" : "r2", raw: d.raw, kind });
        }
      }
    }
  }

  const averages = {};
  for (const b of BUILDS) {
    averages[b] = {};
    for (const m of METRICS) averages[b][m.key] = average(rows, b, m.key);
  }

  const notes = {
    valueDeltaETautology: valueTautology
      ? "R2 snaps to the GLB's own texture palette (the value-ΔE reference), so its value ΔE is ~0 by " +
        "construction — a 0 there carries no signal. E18 (T-058-02) snaps within the AUGMENTED DESIGN-DOC " +
        "palette (design-doc manifest ∪ ≤K=2 gated secondary), tighter than the texture reference, so its " +
        "value ΔE can be nonzero: a small, real cost of palette discipline, not a tautology. Speckle / " +
        "distinct / off-palette (now counted against that augmented design-doc palette) carry the primary " +
        "discrimination."
      : null,
  };

  const json = {
    schema: REMEASURE_SCHEMA,
    scale,
    metrics: METRICS.map((m) => ({ ...m })),
    builds: [...BUILDS],
    generatedFrom: opts.generatedFrom ?? "voxelizeGlbThin → segmentMaterials, vs glb-voxel (R1) + glb-voxel-clean (R2)",
    note:
      "E-18 combined build (thin-preserved voxelization + material-region segmentation) re-measured vs the " +
      "E-17 R1 (glb-voxel) and R2 (material-clean) baselines. Deltas are direction-aware (form IoU higher " +
      "is better; speckle/distinct/off-palette/value ΔE lower is better).",
    notes,
    averages,
    regressions,
    subjects,
  };

  return { md: renderMd(json), json };
}

/** Render the markdown record from the assembled json. PURE. */
function renderMd(json) {
  const lines = [
    "# E-18 combined remeasure — thin-preserved + material-segmented vs R1/R2 (T-060-01)",
    "",
    "Per subject the **combined** glb-voxel build (`voxelizeGlbThin` → `segmentMaterials`) is scored on five",
    "axes against the E-17 **R1** (glb-voxel) and **R2** (material-clean) baselines. Cells read **R1→R2→E18**.",
    "`thin` = the no-dropped-thin diagnostic (26-connected components, surface-only cells the thin pass added).",
    "Lower is better for speckle / distinct / off-pal / value ΔE; higher for form IoU.",
    "",
    `Scale ${json.scale ?? "—"}. Subjects: ${json.subjects.length}.`,
    "",
    "| subject | form IoU | speckle | distinct | off-pal | value ΔE | thin |",
    "| ------- | -------- | ------- | -------- | ------- | -------- | ---- |",
    ...json.subjects.map(
      (s) =>
        `| ${s.subject} | ${triple(s, "formIoU")} | ${triple(s, "speckle")} | ${triple(s, "distinct")} | ` +
        `${triple(s, "offPalette")} | ${triple(s, "valueDeltaE")} | ${thinCell(s)} |`,
    ),
  ];

  // AVERAGES row
  const avg = json.averages;
  const avgTriple = (key) =>
    `${fmtAvg(avg.r1[key])}→${fmtAvg(avg.r2[key])}→${fmtAvg(avg.e18[key])}`;
  lines.push(
    `| **AVERAGE** | ${avgTriple("formIoU")} | ${avgTriple("speckle")} | ${avgTriple("distinct")} | ` +
      `${avgTriple("offPalette")} | ${avgTriple("valueDeltaE")} | — |`,
    "",
  );

  // Honest "didn't help" section
  lines.push("## Regressions / no-change (E18 not strictly better than a baseline)", "");
  if (json.regressions.length === 0) {
    lines.push("None — E18 strictly improved every metric on every subject vs both baselines.", "");
  } else {
    for (const r of json.regressions) {
      lines.push(`- **${r.subject}** ${labelOf(r.metric)} vs ${r.vs.toUpperCase()}: Δ ${r.raw} (${r.kind}).`);
    }
    lines.push("");
  }
  if (json.notes.valueDeltaETautology) {
    lines.push(`> _Value-ΔE note:_ ${json.notes.valueDeltaETautology}`, "");
  }
  return lines.join("\n");
}

const fmtAvg = (v) => (isNum(v) ? String(v) : "—");
const labelOf = (key) => metricByKey.get(key)?.label ?? key;
