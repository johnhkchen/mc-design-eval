// IMPURE RUNNER — E-24 value-true block selection on the cottage (S-086 / T-086-01). The E-21
// material map chose the plaster role's block by NAME (`white_terracotta` — "warm matte cream" said
// the rationale); the block RENDERS pink (table Lab a* +8.9 vs the concept cream's +1.2), and the
// whole E-14 chain passes a real block through at ΔE 0 by construction, so nothing ever checked the
// name against the concept's VALUE. Here each role's concept region is sampled (border-estimated
// background drop + validate-mode quantize: the named block locates its own region), and the
// value-true block is selected within the role's material family — the map's name stays the PRIOR,
// dethroned only with a real sample and a clear margin (src/color/value-select.mjs, unit-tested).
//
// THE SEAM INVARIANT: families, metric, sampler, and switch policy are the PURE src/color cores.
// This file is the impure wiring only: decode, the cottage record, the substitution proof on the
// spray-paint artifact, and best-effort GL re-renders. Mirrors spray-paint.mjs. NOT wired into the
// paint pipeline here — T-085 owns spray-paint.mjs; S-089 consumes this record as data.
//
//   node benchmarks/sculpture/value-select.mjs            # sample → select → substitute → render
//   node benchmarks/sculpture/value-select.mjs --offline  # re-assert the committed record; no GL/decode
//
// Writes value-select/cottage.json (the committed record: per-role rows + the value-true role map)
// + value-select/cottage/artifact.json (the spray-paint build with switched blocks substituted,
// AJV-valid) + front before/after PNGs (gitignored). The deterministic core ALWAYS runs and is
// recorded; renders are best-effort (a headless-GL failure degrades to a recorded gap, never a crash).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  VALUE_SELECT_SCHEMA, SAMPLE_GRID_N, CHROMA_WEIGHT, SWITCH_MARGIN, MIN_CELLS,
  estimateBorderColor, sampleRoleSwatches, selectValueTrueMap,
} from "../../src/color/value-select.mjs";
import { gridFromPixels, GRID_DEFAULTS } from "../../src/color/image-grid.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { bareList } from "../../src/view/reference-quantize.mjs";
import { assertArtifact } from "../../src/artifact.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const MAP_PATH = join(ROOT, "benchmarks/sculpture/material-map/cottage.json");
const CONCEPT_PATH = join(ROOT, "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png");
const ART_PATH = join(ROOT, "benchmarks/sculpture/spray-paint/cottage/artifact.json");
const OUT_DIR = join(ROOT, "benchmarks/sculpture/value-select");
const SUBJ_DIR = join(OUT_DIR, "cottage");

const PLASTER = "white_terracotta"; // the role the judge flagged (palette@upper)

const bare = (id) => String(id).replace(/^minecraft:/, "");

/** Final material per voxel (last-write-wins), for the before/after counts. */
async function materialCounts(artifact) {
  const { artifactOccupancy, bareBlock } = await import("../../src/view/occupancy.mjs");
  const counts = {};
  for (const blk of artifactOccupancy(artifact).cells.values()) {
    const b = bareBlock(blk);
    counts[b] = (counts[b] || 0) + 1;
  }
  return counts;
}

/** Best-effort GL render of the build's front (+z) face → recorded path, or a recorded error. */
async function tryRenderFront(artifact, label) {
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const [r] = await renderViews(artifact, ["front"], { outDir: SUBJ_DIR, label: () => label });
    return { path: r.path.replace(ROOT, "") };
  } catch (e) {
    return { error: e.message };
  }
}

/** The offline assert: the committed record must show the plaster flip. */
function assertRecord(rec) {
  const row = rec.rows.find((r) => r.named === PLASTER);
  if (!row) throw new Error(`record has no ${PLASTER} row`);
  const hueShrank = row.chosenTrue && row.namedTrue
    && Math.abs(row.chosenTrue.da) < Math.abs(row.namedTrue.da);
  const ok = row.switched && row.chosen !== PLASTER && hueShrank;
  console.error(`[offline] plaster ${row.named} → ${row.chosen} (${row.reason}); ` +
    `a* drift ${row.namedTrue?.da} → ${row.chosenTrue?.da}; ${ok ? "CONFIRMED" : "NOT confirmed"}`);
  return ok;
}

async function main() {
  const offline = process.argv.includes("--offline");
  await mkdir(SUBJ_DIR, { recursive: true });

  if (offline) {
    const recPath = join(OUT_DIR, "cottage.json");
    if (!existsSync(recPath)) throw new Error("value-select/cottage.json absent — run the live pass first");
    if (!assertRecord(JSON.parse(await readFile(recPath, "utf8")))) process.exitCode = 1;
    return;
  }

  const matMap = JSON.parse(await readFile(MAP_PATH, "utf8"));
  const manifest = bareList(matMap.palette);

  // --- 1. sample the concept per role (AC #1) ----------------------------------------------------
  // Border-estimated background drop (the cottage's bg is near-WHITE; the default near-black drop
  // removes nothing), then validate-mode quantize against the map's manifest: each role's named
  // block locates its region; cellMeans carries the TRUE concept color behind each assignment.
  const img = await decodeImage(CONCEPT_PATH);
  const borderColor = estimateBorderColor(img);
  const gridResult = gridFromPixels(img, {
    whitelist: manifest, n: SAMPLE_GRID_N, dropColor: borderColor, cellMeans: true,
  });
  const swatches = sampleRoleSwatches(gridResult, manifest);
  console.error(`concept ${img.width}×${img.height} → ${gridResult.n}×${gridResult.m} grid, ` +
    `bg≈rgb(${borderColor.map((c) => c.toFixed(0)).join(",")}), ` +
    `${gridResult.filledCells} filled cells, ${swatches.size}/${manifest.length} roles sampled`);

  // --- 2. select the value-true block per role (AC #1, #2) ---------------------------------------
  const rows = selectValueTrueMap(matMap.map, swatches);
  for (const r of rows) {
    console.error(`  ${r.named} → ${r.chosen} [${r.reason}] ` +
      (r.namedTrue ? `ΔE ${r.namedTrue.deltaE} → ${r.chosenTrue.deltaE} (a* ${r.namedTrue.da} → ${r.chosenTrue.da}); ` +
        `score ${r.namedScore} → ${r.chosenScore}; ` : "") +
      `sample ${r.sampleCells} cells`);
  }
  const plasterRow = rows.find((r) => r.named === PLASTER);
  if (!plasterRow) throw new Error(`material map has no ${PLASTER} role`);

  // --- 3. the cottage proof: substitute switched blocks on the spray-paint build (AC #3) ---------
  const substitution = Object.fromEntries(rows.filter((r) => r.switched).map((r) => [r.named, r.chosen]));
  const raw = JSON.parse(await readFile(ART_PATH, "utf8"));
  const swapped = {
    ...raw,
    palette: {
      ...raw.palette,
      manifest: [...new Set(raw.palette.manifest.map((b) => `minecraft:${substitution[bare(b)] ?? bare(b)}`))],
    },
    placements: raw.placements.map((p) =>
      substitution[bare(p.block)] ? { ...p, block: `minecraft:${substitution[bare(p.block)]}` } : p,
    ),
  };
  assertArtifact(swapped); // the substituted build is still AJV-valid
  const before = await materialCounts(raw);
  const after = await materialCounts(swapped);
  const swappedCount = raw.placements.length - raw.placements.filter((p, i) => p === swapped.placements[i]).length;
  console.error(`substitution ${JSON.stringify(substitution)} — ${swappedCount} placements recolored`);

  const renderBefore = await tryRenderFront(raw, "front-before");
  const renderAfter = await tryRenderFront(swapped, "front-after");
  await writeFile(join(SUBJ_DIR, "artifact.json"), JSON.stringify(swapped, null, 2) + "\n");

  // --- 4. the durable record ----------------------------------------------------------------------
  const record = {
    schema: VALUE_SELECT_SCHEMA,
    subject: "cottage",
    inputs: { map: MAP_PATH.replace(ROOT, ""), concept: CONCEPT_PATH.replace(ROOT, ""), build: ART_PATH.replace(ROOT, "") },
    params: {
      gridN: SAMPLE_GRID_N, chromaWeight: CHROMA_WEIGHT, switchMargin: SWITCH_MARGIN, minCells: MIN_CELLS,
      borderColor: borderColor.map((c) => Math.round(c)), dropTolerance: GRID_DEFAULTS.dropTolerance,
    },
    rows,
    map: rows.map((r) => ({ role: r.role, block: `minecraft:${r.chosen}`, placementRule: r.placementRule })),
    substitution,
    plaster: {
      named: plasterRow.named, chosen: plasterRow.chosen, switched: plasterRow.switched,
      before: plasterRow.namedTrue, after: plasterRow.chosenTrue,
      counts: { [plasterRow.named]: before[plasterRow.named] ?? 0, [plasterRow.chosen]: after[plasterRow.chosen] ?? 0 },
    },
    renders: { before: renderBefore, after: renderAfter },
    note: "Selection is chroma-weighted (w=2) + flat-penalized WITHIN the role's material family; the " +
      "map's name is the prior (floor + margin keep it absent clear evidence). Reported ΔE/components " +
      "are TRUE unweighted ΔE76 — the score column is the selection objective, kept separate so the " +
      "record can't launder the objective as the result. `map` is the value-true role map S-089 consumes.",
  };
  await writeFile(join(OUT_DIR, "cottage.json"), JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "cottage.md"), renderMd(record));
  console.error(`\n✓ wrote ${join(OUT_DIR, "cottage.json")} + cottage.md + cottage/artifact.json`);

  if (!plasterRow.switched) {
    console.error(`✗ plaster prior survived (${plasterRow.reason}) — the AC's pink→cream flip did not happen`);
    process.exitCode = 1;
  }
}

function renderMd(r) {
  const lab = (l) => (l ? `(${l.join(", ")})` : "—");
  const rowsMd = r.rows.map((x) =>
    `| ${x.role} | \`${x.named}\` | \`${x.chosen}\` | ${x.switched ? "**switched**" : x.reason} | ` +
    `${x.sampleCells} | ${x.namedTrue ? x.namedTrue.deltaE : "—"} | ${x.chosenTrue ? x.chosenTrue.deltaE : "—"} | ` +
    `${x.namedTrue ? x.namedTrue.da : "—"} → ${x.chosenTrue ? x.chosenTrue.da : "—"} |`,
  ).join("\n");
  return `# Value-true block selection — cottage (T-086-01)\n\n` +
    `Plaster (\`${r.plaster.named}\`) → **\`${r.plaster.chosen}\`** — ` +
    `a* drift ${r.plaster.before?.da} → ${r.plaster.after?.da} (the pink axis), ` +
    `true ΔE ${r.plaster.before?.deltaE} → ${r.plaster.after?.deltaE}.\n\n` +
    `Sampled at n=${r.params.gridN}, background ≈ rgb(${r.params.borderColor.join(",")}) dropped; ` +
    `selection = chroma-weighted (w=${r.params.chromaWeight}) + flat penalty, within the role's family; ` +
    `switch needs ≥${r.params.minCells} cells and a ≥${r.params.switchMargin * 100}% margin.\n\n` +
    `| role | named | chosen | verdict | cells | ΔE named | ΔE chosen | a* drift |\n` +
    `|---|---|---|---|---|---|---|---|\n${rowsMd}\n\n` +
    `Substitution applied to ${r.inputs.build}: ${JSON.stringify(r.substitution)}.\n` +
    `Renders: before ${r.renders.before.path ?? r.renders.before.error} · after ${r.renders.after.path ?? r.renders.after.error}\n\n> ${r.note}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
