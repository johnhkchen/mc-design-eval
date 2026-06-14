// E-19 voxel-cleanup CONSOLIDATION report — the terminal before/after (T-066-01, story S-066, epic E-19).
//
// The three E-19 fixes — stray-voxel pruning (T-063), variance-aware clean materials (T-064), per-subject
// thin routing (T-065) — landed independently. This assembler composes their measured results into ONE honest
// before/after: the BUSY E-18 seg build (`glb-voxel-seg/`, re-scored on the fixed T-062 metrics) → an
// INTERMEDIATE build (universal thin + prune + clean, the committed `e18-build`) → the final E-19 build
// (routed + prune + clean). Per axis it reports the delta the whole cleanup bought and which fix bought it.
//
// PURE — no GL, no I/O, no Date/random — so it runs under the `src/**/*.test.mjs` glob. The impure runner
// (`benchmarks/sculpture/_archive/e19-build.mjs`) does the GL render + WebP decode + file I/O and feeds this the cells.
// Mirrors `form-routing.mjs`'s shape (schema const + `assemble*` + private `render*Md`); tolerant of a missing
// subject cell (emits null/`—`, never throws on a gap).

/** Schema tag stamped on the report json (downstream version-check). */
export const E19_CLEANUP_SCHEMA = "e19-cleanup/v1";

/** The metric axes carried per build cell, with the direction that counts as an IMPROVEMENT.
 *  formIoU / largestFraction: higher is better. Everything else: lower is better. */
export const AXES = Object.freeze({
  formIoU: "up",
  speckle: "down",
  largestFraction: "up",
  strayCount: "down",
  distinct: "down",
  offPalette: "down",
  valueDeltaE: "down",
});

const AXIS_KEYS = Object.keys(AXES);
const EPS = { formIoU: 1e-3, speckle: 1e-3, largestFraction: 1e-3, strayCount: 0.5, distinct: 0.5, offPalette: 0.5, valueDeltaE: 0.05 };

const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const sub = (a, b) => (isNum(a) && isNum(b) ? round3(a - b) : null);

/**
 * Resolve one subject's three measured columns into a row + the per-axis delta (E-19 − busy = the full
 * cleanup journey). PURE. Any cell/axis may be absent → null (rendered "—"); a null operand → null delta.
 * @param {{subject:string, busy?:object, intermediate?:object, e19?:object}} input
 */
export function cleanupRow({ subject, busy = {}, intermediate = {}, e19 = {} } = {}) {
  const delta = {};
  for (const ax of AXIS_KEYS) {
    delta[ax] = sub(e19?.[ax], busy?.[ax]);
  }
  return { subject, busy: busy || null, intermediate: intermediate || null, e19: e19 || null, delta };
}

/** Average a selector over rows, ignoring nulls. null if no numeric value. */
function avg(rows, sel) {
  let s = 0, n = 0;
  for (const r of rows) { const v = sel(r); if (isNum(v)) { s += v; n += 1; } }
  return n ? round3(s / n) : null;
}

/**
 * Classify one axis across the rows by the delta sign (direction-aware): improved / held / regressed subject
 * lists + the average delta. An axis where "up" is better counts a positive delta as improved. PURE.
 */
function classifyAxis(rows, ax) {
  const better = AXES[ax];
  const eps = EPS[ax] ?? 1e-3;
  const improved = [], held = [], regressed = [];
  for (const r of rows) {
    const d = r.delta[ax];
    if (!isNum(d) || Math.abs(d) <= eps) { if (r.delta[ax] != null) held.push(r.subject); continue; }
    const isBetter = better === "up" ? d > 0 : d < 0;
    (isBetter ? improved : regressed).push(r.subject);
  }
  return { better, avgDelta: avg(rows, (r) => r.delta[ax]), improved, held, regressed };
}

/**
 * Assemble the E-19 cleanup report. PURE.
 * @param {{rows:Array<Parameters<typeof cleanupRow>[0]>, marginals?:object, scale?:number,
 *          generatedFrom?:string}} input
 * @returns {{md:string, json:object}}
 */
export function assembleCleanup({ rows = [], marginals = null, scale = null, generatedFrom } = {}) {
  if (!Array.isArray(rows)) throw new Error("assembleCleanup: rows must be an array");
  const subjects = rows.map(cleanupRow);

  const averages = { busy: {}, intermediate: {}, e19: {}, delta: {} };
  for (const ax of AXIS_KEYS) {
    averages.busy[ax] = avg(subjects, (r) => r.busy?.[ax]);
    averages.intermediate[ax] = avg(subjects, (r) => r.intermediate?.[ax]);
    averages.e19[ax] = avg(subjects, (r) => r.e19?.[ax]);
    averages.delta[ax] = avg(subjects, (r) => r.delta[ax]);
  }

  const axes = {};
  for (const ax of AXIS_KEYS) axes[ax] = classifyAxis(subjects, ax);

  // Headline: is GLB-voxel colour now as clean as text→JSON? text→JSON builds are essentially speckle-free,
  // single-design-doc-palette, zero off-palette. Judge the E-19 build by those same colour-cleanliness signals.
  const offPaletteMax = subjects.reduce((m, r) => (isNum(r.e19?.offPalette) ? Math.max(m, r.e19.offPalette) : m), 0);
  const speckleAvg = averages.e19.speckle;
  const distinctAvg = averages.e19.distinct;
  const cleanAsTextJson = offPaletteMax === 0 && isNum(speckleAvg) && speckleAvg <= 0.05;
  const headline = {
    question: "Is GLB-voxel colour now as clean as text→JSON?",
    cleanAsTextJson,
    offPaletteMax,
    speckleAvg,
    distinctAvg,
    speckleAvgBusy: averages.busy.speckle,
    note:
      "text→JSON builds are speckle-free, single design-doc palette, 0 off-palette. cleanAsTextJson = " +
      "(every E-19 build has 0 off-palette) AND (avg E-19 speckle ≤ 0.05). value ΔE is a separate axis " +
      "(the design-doc-palette discipline cost), reported but NOT part of the colour-cleanliness verdict.",
  };

  const json = {
    schema: E19_CLEANUP_SCHEMA,
    scale,
    generatedFrom: generatedFrom ?? "e19-build live sweep (routed+prune+clean) vs glb-voxel-seg busy baseline (fixed metrics)",
    note:
      "Per subject three columns: BUSY = E-18 seg build (glb-voxel-seg), re-scored on the fixed T-062 metrics; " +
      "INTERMEDIATE = universal-thin + prune + clean (committed e18-build); E-19 = routed + prune + clean. " +
      "delta = E-19 − BUSY (the full cleanup). Higher better for form IoU / largest-fraction; lower better for " +
      "speckle / stray / distinct / off-palette / value ΔE. moai's form IoU is scored vs its OWN hallucinated " +
      "GLB (3 statues + bridge bars) so it is reference-corrupt — stray/component is moai's honest signal (T-063).",
    headline,
    averages,
    axes,
    marginals: marginals ?? null,
    subjects,
  };
  return { md: renderCleanupMd(json), json };
}

// --- markdown -------------------------------------------------------------------------------------------

const fmtNum = (v, d = 3) => (isNum(v) ? String(Math.round(v * 10 ** d) / 10 ** d) : "—");
const fmtInt = (v) => (isNum(v) ? String(Math.round(v)) : "—");
const fmtSigned = (v, d = 3) => (isNum(v) ? (v > 0 ? `+${fmtNum(v, d)}` : fmtNum(v, d)) : "—");
const fmtSignedInt = (v) => (isNum(v) ? (v > 0 ? `+${Math.round(v)}` : String(Math.round(v))) : "—");

/** A busy→inter→E19 triple cell for one axis. */
function triple(r, ax, fmt = fmtNum) {
  return `${fmt(r.busy?.[ax])}→${fmt(r.intermediate?.[ax])}→${fmt(r.e19?.[ax])}`;
}

/** Render the report markdown from the assembled json. PURE. */
function renderCleanupMd(json) {
  const S = json.subjects;
  const lines = [
    "# E-19 voxel cleanup — busy E-18 → routed + pruned + clean (T-066-01)",
    "",
    "The terminal E-19 before/after. Each subject's GLB-voxel build across three states: **busy** (the E-18",
    "seg build, `glb-voxel-seg/`, re-scored on the fixed T-062 metrics) → **intermediate** (universal thin +",
    "prune + clean, committed `e18-build`) → **E-19** (routed + prune + clean). Cells read **busy→inter→E-19**.",
    "Higher better for form IoU / largest-frac; lower better for speckle / stray / distinct / off-pal / value ΔE.",
    "",
    `Scale ${json.scale ?? "—"}. Subjects: ${S.length}. Schema \`${json.schema}\`.`,
    "",
    "| subject | form IoU | speckle | largest-frac | stray | distinct | off-pal | value ΔE |",
    "| ------- | -------- | ------- | ------------ | ----- | -------- | ------- | -------- |",
    ...S.map(
      (r) =>
        `| ${r.subject} | ${triple(r, "formIoU")} | ${triple(r, "speckle")} | ${triple(r, "largestFraction")} | ` +
        `${triple(r, "strayCount", fmtInt)} | ${triple(r, "distinct", fmtInt)} | ${triple(r, "offPalette", fmtInt)} | ` +
        `${triple(r, "valueDeltaE", fmtNum)} |`,
    ),
    `| **AVERAGE** | ${fmtNum(json.averages.busy.formIoU)}→${fmtNum(json.averages.intermediate.formIoU)}→${fmtNum(json.averages.e19.formIoU)} | ` +
      `${fmtNum(json.averages.busy.speckle)}→${fmtNum(json.averages.intermediate.speckle)}→${fmtNum(json.averages.e19.speckle)} | ` +
      `${fmtNum(json.averages.busy.largestFraction)}→${fmtNum(json.averages.intermediate.largestFraction)}→${fmtNum(json.averages.e19.largestFraction)} | ` +
      `${fmtInt(json.averages.busy.strayCount)}→${fmtInt(json.averages.intermediate.strayCount)}→${fmtInt(json.averages.e19.strayCount)} | ` +
      `${fmtNum(json.averages.busy.distinct, 2)}→${fmtNum(json.averages.intermediate.distinct, 2)}→${fmtNum(json.averages.e19.distinct, 2)} | ` +
      `${fmtInt(json.averages.busy.offPalette)}→${fmtInt(json.averages.intermediate.offPalette)}→${fmtInt(json.averages.e19.offPalette)} | ` +
      `${fmtNum(json.averages.busy.valueDeltaE, 2)}→${fmtNum(json.averages.intermediate.valueDeltaE, 2)}→${fmtNum(json.averages.e19.valueDeltaE, 2)} |`,
    "",
    "## Δ the whole cleanup bought (E-19 − busy)",
    "",
    "| axis | avg Δ | improved | held | regressed |",
    "| ---- | ----- | -------- | ---- | --------- |",
    ...AXIS_KEYS.map((ax) => {
      const a = json.axes[ax];
      const d = ax === "strayCount" || ax === "offPalette" ? fmtSignedInt(a.avgDelta) : fmtSigned(a.avgDelta, ax === "distinct" || ax === "valueDeltaE" ? 2 : 3);
      return `| ${ax} (${a.better}) | ${d} | ${a.improved.length} | ${a.held.length} | ${a.regressed.length}` +
        `${a.regressed.length ? " (" + a.regressed.join(", ") + ")" : ""} |`;
    }),
    "",
    "## Marginal Δ — which fix bought what",
    "",
    json.marginals ? renderMarginals(json.marginals) : "_(marginals not supplied)_",
    "",
    "## Headline",
    "",
    `**${json.headline.question}** → **${json.headline.cleanAsTextJson ? "Yes (on colour cleanliness)" : "Not fully"}.**`,
    `E-19 off-palette max **${json.headline.offPaletteMax}**, avg speckle **${fmtNum(json.headline.speckleAvg)}** ` +
      `(busy **${fmtNum(json.headline.speckleAvgBusy)}**), avg distinct **${fmtNum(json.headline.distinctAvg, 2)}**.`,
    `> _${json.headline.note}_`,
    "",
    `> _Note:_ ${json.note}`,
    "",
  ];
  return lines.join("\n");
}

/** Render the marginal-attribution block (passed through verbatim; tolerant of partial shape). PURE. */
function renderMarginals(m) {
  const out = [];
  if (m.prune) out.push(`- **Stray pruning (T-063):** ${m.prune}`);
  if (m.materials) out.push(`- **Clean materials (T-064):** ${m.materials}`);
  if (m.routing) out.push(`- **Thin routing (T-065):** ${m.routing}`);
  for (const [k, v] of Object.entries(m)) {
    if (k === "prune" || k === "materials" || k === "routing") continue;
    out.push(`- **${k}:** ${typeof v === "string" ? v : JSON.stringify(v)}`);
  }
  return out.length ? out.join("\n") : "_(no marginal entries)_";
}
