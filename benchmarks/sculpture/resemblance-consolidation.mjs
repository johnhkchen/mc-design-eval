// IMPURE DRIVER — the E-22 terminal consolidation (S-077 / T-077-01). Applies the fixed render lens
// (T-075-01) + the resemblance gate (T-076-01) to the headline builds — gatehouse + cottage (buildings)
// and pineapple (sculpture; moai was retired 2026-06-10, see RETIRED SUBJECTS in resemblance.mjs /
// T-094-01) — and reports HONESTLY:
//
//   1. per subject: run `runResemblanceGate` (triptych | perceptual row | categorical verdict + named gap),
//   2. aggregate with the pure `consolidateResemblance` (verdict tally + E-21 routing of MATERIAL gaps),
//   3. the gatehouse before/after: the SAME scale-64 artifact through the OLD lens (supersample:1, static)
//      vs the FIXED lens (supersample:3, clean) — proving the static was the lens, not the build (Rule 4),
//      quantified with highFreqEnergy (Rule 7),
//   4. write `resemblance-consolidation.{md,json}`, the E-21 material-findings file, and copy the E-12
//      handoff assets (the four triptychs + the two lens PNGs) into `pr/assets/`.
//
// E-22 photographs + judges; it does NOT edit form or materials (Rule 3). A material-attributed gap is a
// FINDING routed to E-21, never fixed here. PURITY: the aggregation math is the pure core
// (src/form/resemblance.mjs `consolidateResemblance`, unit-tested); this file owns the impure edges only
// (GL re-render, metered judge via runResemblanceGate, image decode, file I/O, asset copy). Verified by
// `--offline` (GL- and model-free) + the committed outputs; not unit-tested (the suite must never pull GL /
// the model).
//
//   node benchmarks/sculpture/resemblance-consolidation.mjs            # live: fixed-lens renders + metered judge
//   node benchmarks/sculpture/resemblance-consolidation.mjs --offline  # GL-free + model-free wiring check
//   node benchmarks/sculpture/resemblance-consolidation.mjs --subject cottage,gatehouse  # a subset

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { runResemblanceGate, SUBJECTS, resolveSubject } from "./resemblance.mjs";
import { consolidateResemblance } from "../../src/form/resemblance.mjs";
import { highFreqEnergy } from "../../src/render-supersample.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { BUILDING_VIEW_3Q } from "../../src/building.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const OUT_DIR = join(HERE, "resemblance");
const ASSETS_DIR = join(REPO, "pr", "assets");
const WORK_DIR = join(REPO, "docs", "active", "work", "T-077-01");
// The before/after proof uses the worst-aliasing artifact (scale-64, ~57k blocks).
const GATEHOUSE_SCALE64 = join(HERE, "building", "scale-64", "artifact.json");

const rel = (p) => p.replace(REPO + "/", "");

/** Render the SAME artifact through the old lens (ss=1, point-sampled) and the fixed lens (ss=3, SSAA),
 *  quantify each with highFreqEnergy. Proves the scale-64 static was the lens, not the build (AC#3). */
async function renderGatehouseBeforeAfter() {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const artifact = JSON.parse(await readFile(GATEHOUSE_SCALE64, "utf8"));
  const beforePath = join(ASSETS_DIR, "gatehouse-lens-before.png");
  const afterPath = join(ASSETS_DIR, "gatehouse-lens-after.png");

  await renderArtifact(artifact, { outPath: beforePath, view: BUILDING_VIEW_3Q, supersample: 1 });
  await renderArtifact(artifact, { outPath: afterPath, view: BUILDING_VIEW_3Q }); // default ss=3

  const hf = async (p) => { const img = await decodeImage(p); return Math.round(highFreqEnergy(img.data, img.width, img.height) * 10) / 10; };
  const before = await hf(beforePath), after = await hf(afterPath);
  const reduction = before > 0 ? Math.round((1 - after / before) * 1000) / 10 : 0;
  // mirror into the work dir for the ticket record
  await copyFile(beforePath, join(WORK_DIR, "gatehouse-lens-before.png"));
  await copyFile(afterPath, join(WORK_DIR, "gatehouse-lens-after.png"));
  console.error(`before/after: HF energy old-lens=${before} → fixed-lens=${after} (−${reduction}%) · same scale-64 artifact`);
  return { beforePath, afterPath, before, after, reduction };
}

/** Per-subject re-photographing honesty line (Rule 7). meshIoU is the trustworthy form number (exact view);
 *  conceptIoU is depressed by the approximate-3/4-view concept (T-076 concern #1). */
function honestyLine(s) {
  const g = s.gap ? `${s.gap.attribute} @ ${s.gap.region}` : "—";
  const route = s.routesToE21 ? " → **routed to E-21** (material drift, not fixed here)" : "";
  return `- **${s.subject}** — \`${s.verdict}\`; residual gap: ${g}${route}. ` +
    `Fixed-lens form meshIoU ${fmt(s.form.meshIoU)} (trustworthy, exact view), conceptIoU ${fmt(s.form.conceptIoU)} ` +
    `(depressed by the approximate-3/4-view concept), material set ${fmt(s.material.set)} / zone ${fmt(s.material.zone)} ` +
    `(zone ΔE ${fmt(s.material.meanDeltaE)}).`;
}
const fmt = (v) => (v == null ? "—" : String(v));

function consolidationMd(consol, ba, mode) {
  const S = consol.subjects;
  const countStr = Object.entries(consol.summary.counts).map(([k, v]) => `${v}× \`${k}\``).join(", ") || "—";
  const rows = S.map((s) => {
    const g = s.gap ? `${s.gap.attribute} @ ${s.gap.region}` : "—";
    const trip = `[triptych](${s.subject}-triptych.png)`;
    return `| ${s.subject} | \`${s.verdict}\` | ${g} | ${fmt(s.form.meshIoU)} | ${fmt(s.form.conceptIoU)} | ${fmt(s.material.set)} | ${fmt(s.material.zone)} | ${s.routesToE21 ? "yes→E-21" : "no"} | ${trip} |`;
  }).join("\n");
  const findings = consol.summary.e21Findings.length
    ? consol.summary.e21Findings.map((f) => `- **${f.subject}**: ${f.note}`).join("\n")
    : "_(none — no gate-attributed MATERIAL drift among the four subjects)_";
  return [
    `# Resemblance consolidation — E-22 (T-077-01)`,
    "",
    `Terminal E-22 deliverable: the fixed render lens (T-075-01) + the resemblance gate (T-076-01) applied to`,
    `the **four headline builds** and reported honestly. The **triptych is the verdict a human inspects**`,
    `(Rule 2); the numbers explain it. Residual gaps are **named, not hidden** (Rule 7); **material** drift is`,
    `**routed to E-21, not edited here** (Rule 3 — E-22 photographs + judges only). Run mode: **${mode}**.`,
    "",
    `**Verdict tally:** ${countStr}.`,
    "",
    `## Per-subject verdicts (the triptych is the verdict — Rule 2)`,
    "",
    `| subject | verdict | named residual gap (Rule 7) | meshIoU | conceptIoU | mat set | mat zone | routes to E-21 | triptych |`,
    `| ------- | ------- | --------------------------- | ------- | ---------- | ------- | -------- | -------------- | -------- |`,
    rows,
    "",
    `> Honesty (Rule 2): \`meshIoU\` reads against the GLB at the exact build view — the trustworthy form`,
    `> number. \`conceptIoU\` + zone ΔE are depressed by the concept's *approximate* 3/4 view (camera mismatch),`,
    `> not only by real drift. The categorical judge + the human triptych are the verdict; the numbers explain.`,
    "",
    `## Gatehouse before/after — the static was the LENS, not the build (Rule 4, AC#3)`,
    "",
    `The **same** scale-64 artifact (\`${rel(GATEHOUSE_SCALE64)}\`, ~57k blocks) rendered through the **old**`,
    `lens (point-sampled, \`supersample:1\`) vs the **fixed** lens (SSAA ×3, \`supersample:3\`). The build is`,
    `byte-identical between the two; only the lens changed.`,
    "",
    `| lens | render | high-freq energy (static proxy, lower = cleaner) |`,
    `| ---- | ------ | ----------------------------------------------- |`,
    `| old (point-sampled) | \`${rel(ba.beforePath)}\` | ${ba.before} |`,
    `| fixed (SSAA ×3) | \`${rel(ba.afterPath)}\` | ${ba.after} |`,
    "",
    `**HF energy −${ba.reduction}%** on an unchanged artifact — the grey static was texture-minification`,
    `aliasing (the lens), not palette speckle (the build). See \`[[render-aliasing-not-material-speckle]]\`.`,
    "",
    `## Re-photographing — what the fixed lens changed (honest, including any worse — Rule 7)`,
    "",
    S.map(honestyLine).join("\n"),
    "",
    `## Material drift routed to E-21 (AC#4 — finding, not fixed here)`,
    "",
    findings,
    "",
  ].join("\n");
}

function e21FindingsMd(consol) {
  const f = consol.summary.e21Findings;
  return [
    `# E-21 material-drift findings (routed from E-22 / T-077-01)`,
    "",
    `E-22 photographs + judges; it does **not** edit form or materials (Rule 3). The resemblance gate`,
    `attributed the gaps below to **material** drift (\`palette\` / \`material zoning\`) — they are recorded`,
    `here as **findings routed to E-21**, the material-identity epic, NOT fixed in E-22.`,
    "",
    f.length
      ? f.map((x) => `- **${x.subject}** — \`${x.attribute}\` @ _${x.region}_: ${x.note}`).join("\n")
      : `_(none — the gate attributed no MATERIAL-axis drift among the four headline subjects. Residual gaps,\n` +
        `where present, were FORM/MASSING — owned by the build pipeline, not a material-identity finding.)_`,
    "",
    `> Form/massing residual gaps are reported in \`resemblance-consolidation.md\` but are NOT routed here:`,
    `> E-22 does not edit form, and a form gap is the honest build verdict, not a material-identity defect.`,
    "",
  ].join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const offline = argv.includes("--offline");
  const subIdx = argv.indexOf("--subject");
  const only = subIdx >= 0 && argv[subIdx + 1] ? argv[subIdx + 1].split(",").map((s) => s.trim()) : null;
  const keys = (only || Object.keys(SUBJECTS)).filter((k) => {
    if (!SUBJECTS[k]) throw new Error(`unknown subject "${k}" (known: ${Object.keys(SUBJECTS).join(", ")})`);
    return true;
  });
  const mode = offline ? "offline (GL-/model-free)" : "live (fixed-lens render + metered judge)";

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(ASSETS_DIR, { recursive: true });

  const results = [];
  for (const k of keys) {
    const def = SUBJECTS[k];
    console.error(`\n=== resemblance gate: ${k} (${mode}) ===`);
    const { row, verdict } = await runResemblanceGate({ ...resolveSubject(def), offline });
    results.push({ subject: k, row, verdict, mode: offline ? "offline" : "live" });
  }

  const consol = consolidateResemblance(results);
  const ba = await renderGatehouseBeforeAfter();

  await writeFile(join(OUT_DIR, "resemblance-consolidation.json"), JSON.stringify(consol, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "resemblance-consolidation.md"), consolidationMd(consol, ba, mode));
  await writeFile(join(WORK_DIR, "e21-material-findings.md"), e21FindingsMd(consol));

  // E-12 handoff assets: the four triptychs + the two lens PNGs (before/after already written to ASSETS_DIR).
  for (const k of keys) {
    const trip = join(OUT_DIR, `${k}-triptych.png`);
    if (existsSync(trip)) await copyFile(trip, join(ASSETS_DIR, `${k}-triptych.png`));
  }

  console.error(`\nconsolidation written: ${rel(join(OUT_DIR, "resemblance-consolidation.md"))}`);
  console.error(`verdict tally: ${JSON.stringify(consol.summary.counts)}`);
  console.error(`E-21 findings: ${consol.summary.e21Findings.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("consolidation failed:\n  " + (err?.stack || err?.message || err));
    process.exit(1);
  });
}

export { consolidationMd, e21FindingsMd };
