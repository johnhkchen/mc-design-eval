// GATED SECONDARY PALETTE sweep — E-18 (T-058-03, story S-058, epic E-18).
//
// The E-18 palette fix locked the GLB-voxel picker to the DESIGN-DOC manifest (the few blocks the model
// chose), killing speckle/bloat. But a tight primary palette can OVER-CONSTRAIN: a TRELLIS texture
// sometimes carries a genuine colour the design doc never anticipated, and forcing it onto the nearest of
// the 5 design-doc blocks creates large SNAP DRIFT. This sweep applies the GATED secondary palette
// (src/form/palette-augment.mjs) across the 7 subjects: per subject it reports WHICH secondary blocks were
// added (block, gain, coverage), the mean texture-snap ΔE BEFORE→AFTER (the drift removed), and confirms
// off-(augmented-palette) = 0 and form IoU unharmed. Most subjects add 0 — the record says so honestly.
//
// REUSE, NOT REIMPLEMENTATION: the pure core is `augmentReport`/`augmentPalette`; the design-doc palette is
// `paletteFromManifest`; the build is `segmentMaterials(..., {augment})`; the SUBJECTS list and the impure
// glue (dwebp WebP decode, silhouette-IoU judge, TRELLIS regen) are the SAME as the R1/R2/R-seg runners —
// kept local, the established host/GL split. GL + host-tool, NOT in npm test.
//
//   node benchmarks/sculpture/secondary-palette.mjs [scale]                 # live sweep, 7 subjects
//   node benchmarks/sculpture/secondary-palette.mjs --offline               # rebuild record from summaries
//   node benchmarks/sculpture/secondary-palette.mjs --regen-missing [scale] # also TRELLIS-regen absent GLBs
//
// Writes secondary-palette/<subject>/{artifact.json, render-3q.png, summary.json} and the top-level
// secondary-palette.{md,json} record.

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import { segmentMaterials, offPaletteCount } from "../../src/form/material-segment.mjs";
import { paletteFromManifest, sampleSurfaceColors } from "../../src/form/glb-voxel-build.mjs";
import { augmentReport, AUGMENT_DEFAULTS } from "../../src/form/palette-augment.mjs";
import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";
import { parseGlbColoredSurface } from "../../src/form/glb-mesh.mjs";
import { srgbToLab, nearestLab } from "../../src/color/cielab.mjs";
import { loadBlockTable } from "../../src/color/block-table.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { DEFAULT_SCALE, SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
import { GLB_VOXEL_METHOD_ID } from "../../src/config.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { extractSilhouette, normalizeSilhouette, iou, RENDER_BG } from "../../src/form/form-fidelity.mjs";
import { SUBJECTS } from "./glb-voxel-breadth.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLB_DIR = join(HERE, "glb");
const OUT_DIR = join(HERE, "secondary-palette");
const RUNS_DIR = join(HERE, "runs");

/** Run a child process to completion; reject on non-zero exit. */
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (c) => (err += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${err.slice(0, 200)}`))));
  });
}

let tmpSeq = 0;
/** Decode a GLB baseColor image to RGBA. WebP → PNG via `dwebp` (host tool, never in CI); PNG/JPEG pass through. */
async function decodeTexture({ data, mimeType }) {
  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const ext = mimeType === "image/png" ? "png" : "jpg";
    const p = join(tmpdir(), `glbtex-${process.pid}-${tmpSeq++}.${ext}`);
    await writeFile(p, data);
    try {
      return await decodeImage(p);
    } finally {
      await rm(p, { force: true });
    }
  }
  const inP = join(tmpdir(), `glbtex-${process.pid}-${tmpSeq}.webp`);
  const outP = join(tmpdir(), `glbtex-${process.pid}-${tmpSeq++}.png`);
  await writeFile(inP, data);
  try {
    await run("dwebp", [inP, "-o", outP]);
    return await decodeImage(outP);
  } finally {
    await rm(inP, { force: true });
    await rm(outP, { force: true });
  }
}

/** Silhouette IoU of a render PNG vs the GLB's own silhouette at SCULPTURE_VIEW_3Q (T-048-01). */
async function judgeIoU(renderPath, glbBytes) {
  const renderImg = await decodeImage(renderPath);
  const rSil = extractSilhouette(renderImg, RENDER_BG);
  const mesh = loadMeshFromGlb(glbBytes);
  const gSil = rasterizeSilhouette(mesh, { view: SCULPTURE_VIEW_3Q });
  return Math.round(iou(normalizeSilhouette(rSil), normalizeSilhouette(gSil)) * 1000) / 1000;
}

/** AC safety branch (--regen-missing only): regenerate an absent GLB via TRELLIS; never prints the endpoint. */
async function regenMissingGlb(subj, glbPath) {
  const concept = join(RUNS_DIR, subj.run, "concept.png");
  if (!existsSync(concept)) throw new Error(`regen ${subj.key}: concept image not found at runs/${subj.run}/concept.png`);
  await run("node", [join(HERE, "trellis-glb.mjs"), concept, glbPath]);
  return existsSync(glbPath);
}

/** Bare block keys (occupiedCells order) from a committed artifact's voxel placements. */
function keysFromArtifact(artifact) {
  return artifact.placements.map((p) => p.block.replace(/^minecraft:/, ""));
}

const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;

/** Per-voxel mean snap ΔE of the sampled surface colours against a palette (the truest "drift"). */
function meanSnapDeltaE(colors, palette) {
  const count = colors.length / 3;
  if (count === 0) return 0;
  let sum = 0;
  for (let n = 0; n < count; n++) {
    sum += nearestLab(srgbToLab([colors[n * 3], colors[n * 3 + 1], colors[n * 3 + 2]]), palette).deltaE;
  }
  return sum / count;
}

/**
 * PURE: rows[] → { md, json } for the secondary-palette record. The honest story: which blocks (if any)
 * each subject added, the drift they removed, and that off-palette stays 0 + form IoU holds.
 */
function buildSecondary(rows, { scale = DEFAULT_SCALE } = {}) {
  const live = rows.filter((r) => !r.skipped);
  const added = live.reduce((s, r) => s + (r.secondaryCount || 0), 0);
  const fmtAdded = (r) =>
    !r.added || r.added.length === 0
      ? "—"
      : r.added.map((a) => `${a.block} (gain ${round2(a.gain)}, cov ${Math.round(a.coverage * 100)}%)`).join("; ");
  const md = [
    "# Gated secondary palette across the 7-subject sweep (E-18 T-058-03)",
    "",
    "The design-doc palette (the model's deliberate few blocks) is AUGMENTED with at most K table blocks —",
    "and only when a block is a SUPER-GREAT fit for an underserved, meaningful texture colour (all gates:",
    "underserved `primaryΔE > driftThreshold`, real `coverage ≥ minCoverage`, fit `tableΔE ≤ fitThreshold`,",
    "big-win `gain ≥ gainThreshold`). Most subjects should add 0. `snap ΔE` is the mean per-voxel texture-snap",
    "distance BEFORE (design-doc only) → AFTER (augmented) — the drift the secondary removed. `off-pal` counts",
    "blocks placed outside the augmented palette (0 by construction). Form IoU is invariant (recolouring never",
    "moves a voxel) — rendered + judged to confirm.",
    "",
    `Subjects: ${live.length} (sword excluded — TRELLIS 500'd on the thin blade). Total secondary blocks added across the sweep: ${added}.`,
    `Gates: ${JSON.stringify(AUGMENT_DEFAULTS)}.`,
    "",
    "| subject | design-doc | +secondary (block, gain, coverage) | total | snap ΔE before→after | off-pal | form IoU |",
    "| ------- | ---------- | ---------------------------------- | ----- | -------------------- | ------- | -------- |",
    ...rows.map((r) =>
      r.skipped
        ? `| ${r.subject} | — | — | — | — | — | — | _(GLB absent — ${r.note ?? "skipped"})_`
        : `| ${r.subject} | ${r.designDocSize} | ${fmtAdded(r)} | ${r.totalPalette} | ` +
          `${round2(r.snapBefore)} → ${round2(r.snapAfter)} | ${r.offPalette} | ${r.formIoU} |` +
          (r.regenerated ? " _(GLB regenerated)_" : ""),
    ),
    "",
  ].join("\n");

  const json = {
    schema: "secondary-palette/v1",
    method: GLB_VOXEL_METHOD_ID,
    view: SCULPTURE_VIEW_3Q,
    scale,
    defaults: AUGMENT_DEFAULTS,
    metric:
      "augmentation = design-doc palette ∪ ≤K table blocks passing ALL gates (underserved/real/fit/big-win); " +
      "snap ΔE = mean per-voxel CIE76 distance from the sampled surface colour to its nearest palette block, " +
      "design-doc-only (before) vs augmented (after); off-palette = blocks outside the augmented palette " +
      "(0 by construction); form IoU = silhouette vs the GLB mesh at SCULPTURE_VIEW_3Q (invariant — recolour).",
    generatedFrom:
      "benchmarks/sculpture/glb/<subject>.glb via segmentMaterials({palette: paletteFromManifest(manifest), " +
      "augment:{table}}) (src/form/palette-augment.mjs)",
    note:
      "Gated secondary palette: the primary stays the design-doc manifest; the secondary is ≤K blocks from " +
      "the full value-true table added ONLY when they greatly cut snap drift for a genuine, meaningful texture " +
      "colour. Honest: subjects that need none add none. Total palette per subject ≤ design-doc size + K.",
    subjects: rows,
  };
  return { md, json };
}

/** The live GL/host sweep: augment every subject, build, render, judge, record the added blocks + drift. */
async function runSweep({ scale = DEFAULT_SCALE, regenMissing = false } = {}) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const table = loadBlockTable();

  await mkdir(OUT_DIR, { recursive: true });
  const rows = [];

  for (const subj of SUBJECTS) {
    const glbPath = join(GLB_DIR, subj.glb);
    let regenerated = false;
    if (!existsSync(glbPath)) {
      if (regenMissing) {
        console.error(`${subj.key}: GLB absent — regenerating via TRELLIS …`);
        regenerated = await regenMissingGlb(subj, glbPath);
      }
      if (!existsSync(glbPath)) {
        console.error(`${subj.key}: skipped (glb/${subj.glb} absent — gitignored; pass --regen-missing to rebuild)`);
        rows.push({ subject: subj.key, skipped: true, note: regenMissing ? "regen failed" : "not present" });
        continue;
      }
    }

    const dir = join(OUT_DIR, subj.key);
    await mkdir(dir, { recursive: true });
    const glbBytes = await readFile(glbPath);

    const t0 = Date.now();
    const occupancy = voxelizeGlb(glbBytes, { scale });
    const surface = parseGlbColoredSurface(glbBytes);
    if (!surface.baseColor) throw new Error(`${subj.key}: GLB has no baseColor texture`);
    const texture = await decodeTexture(surface.baseColor);

    // Primary = the design-doc palette; report the gated augmentation against the full value-true table.
    const designManifest = JSON.parse(await readFile(join(RUNS_DIR, subj.run, "artifact.json"), "utf8")).palette.manifest;
    const primary = paletteFromManifest(designManifest, table);
    const rep = augmentReport(primary, texture, table);
    const augmented = rep.palette;

    // Build under the design-doc palette WITH augmentation (off-palette must be 0 vs the augmented palette).
    const artifact = segmentMaterials(
      { occupancy, surface, texture },
      {
        palette: primary,
        augment: { table },
        metadata: { trial_id: `${subj.key}-secondary-palette` },
        style: {
          name: "glb-voxel-seg",
          rationale: `Region-segmented ${subj.key} GLB under the design-doc palette (${primary.length}) + ${rep.secondary.length} gated secondary block(s).`,
        },
      },
    );
    assertArtifact(artifact);
    await writeFile(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");

    const renderPath = join(dir, "render-3q.png");
    await renderArtifact(artifact, { outPath: renderPath, view: SCULPTURE_VIEW_3Q });
    const formIoU = await judgeIoU(renderPath, glbBytes);

    // Per-voxel drift before (design-doc only) → after (augmented).
    const colors = sampleSurfaceColors({ occupancy, surface, texture });
    const snapBefore = meanSnapDeltaE(colors, primary);
    const snapAfter = meanSnapDeltaE(colors, augmented);
    const offPalette = offPaletteCount(keysFromArtifact(artifact), augmented);

    const secs = Number(((Date.now() - t0) / 1000).toFixed(1));
    const summary = {
      subject: subj.key,
      scale,
      occupancy: artifact.placements.length,
      designDocSize: primary.length,
      added: rep.added.map((a) => ({ block: a.key, gain: round3(a.gain), coverage: round3(a.coverage), primaryDeltaE: round3(a.primaryDeltaE), tableDeltaE: round3(a.tableDeltaE) })),
      secondaryCount: rep.secondary.length,
      totalPalette: augmented.length,
      snapBefore: round3(snapBefore),
      snapAfter: round3(snapAfter),
      offPalette,
      formIoU,
      foregroundPx: rep.foregroundPx,
      view3q: SCULPTURE_VIEW_3Q,
      durationSec: secs,
      ...(regenerated ? { regenerated: true } : {}),
    };
    await writeFile(join(dir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
    rows.push(summary);
    console.error(
      `${subj.key}: design-doc ${primary.length}, +secondary ${rep.secondary.length} ` +
        `[${summary.added.map((a) => a.block).join(", ") || "none"}], snap ΔE ${round2(snapBefore)}→${round2(snapAfter)}, ` +
        `off-pal ${offPalette}, form IoU ${formIoU}${regenerated ? " (regen)" : ""} (${secs}s)`,
    );
  }
  return rows;
}

/** Write secondary-palette.{md,json} from rows (top-level, like e18-remeasure). */
async function emit(rows, opts) {
  const { md, json } = buildSecondary(rows, opts);
  await writeFile(join(HERE, "secondary-palette.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(HERE, "secondary-palette.md"), md);
  console.error(`wrote secondary-palette.{md,json} (${rows.filter((r) => !r.skipped).length}/${rows.length} subjects)`);
}

/** --offline: rebuild the record from the committed per-subject summaries (no GL, no network). */
async function regenerateOffline({ scale = DEFAULT_SCALE } = {}) {
  const rows = [];
  for (const subj of SUBJECTS) {
    const p = join(OUT_DIR, subj.key, "summary.json");
    if (existsSync(p)) rows.push(JSON.parse(await readFile(p, "utf8")));
    else rows.push({ subject: subj.key, skipped: true, note: "no summary.json" });
  }
  await emit(rows, { scale });
}

async function main() {
  const argv = process.argv.slice(2);
  const offline = argv.includes("--offline");
  const regenMissing = argv.includes("--regen-missing");
  const scaleArg = argv.find((a) => /^\d+$/.test(a));
  const scale = scaleArg ? Number(scaleArg) : DEFAULT_SCALE;

  if (offline) {
    await regenerateOffline({ scale });
    return;
  }
  await emit(await runSweep({ scale, regenMissing }), { scale });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("secondary-palette failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { buildSecondary, runSweep };
