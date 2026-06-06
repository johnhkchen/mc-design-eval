// E-18 COMBINED REMEASURE sweep — the integration measurement (T-060-01, story S-060, epic E-18).
//
// Combines E-18's two fixes and re-measures across the 7 subjects vs the E-17 baselines, so the
// consolidation (T-061) is a pure read. Per subject the COMBINED build is:
//   voxelizeGlbThin (thin members survive, T-059) → segmentMaterials (value-true colour + clean materials,
//   T-058) → DesignArtifact → render.
// Scored on FIVE axes — form IoU vs the GLB, speckle, distinct-block, off-palette, value ΔE — against the
// committed R1 (glb-voxel) and R2 (glb-voxel-clean) builds. The pure roll-up (deltas + honest
// regressions) is assembleRemeasure (src/form/remeasure.mjs); this runner owns the GL render + dwebp decode.
//
// OCCUPANCY MATCHING (load-bearing): speckle indexes keys by occupiedCells order, so each build is scored
// against ITS OWN voxelization — E18 over voxelizeGlbThin, R1/R2 over voxelizeGlb (they were built non-thin).
// form IoU for R1/R2 is READ from their committed summaries (silhouetteIoU / formIoUAfter); only the E18
// build is rendered + judged here. An absent asset → null cells + a note (never a hard error, AC #3).
//
//   node benchmarks/sculpture/e18-remeasure.mjs [scale]                 # live combined sweep, 7 subjects
//   node benchmarks/sculpture/e18-remeasure.mjs --offline               # rebuild e18-remeasure.{md,json}
//   node benchmarks/sculpture/e18-remeasure.mjs --regen-missing [scale] # also TRELLIS-regen any absent GLB
//
// Writes e18-build/<subject>/{artifact.json, render-3q.png, summary.json} and e18-remeasure.{md,json}.

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";
import { voxelizeGlbThin } from "../../src/form/glb-thin.mjs";
import { parseGlbColoredSurface } from "../../src/form/glb-mesh.mjs";
import { segmentMaterials, speckleScore, offPaletteCount, SEG_DEFAULTS } from "../../src/form/material-segment.mjs";
import { extractTexturePalette } from "../../src/form/material-clean.mjs";
import { valueGate, realizedPaletteFromArtifact } from "../../src/color/value-gate.mjs";
import { assembleRemeasure } from "../../src/form/remeasure.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { DEFAULT_SCALE, SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { extractSilhouette, normalizeSilhouette, iou, RENDER_BG } from "../../src/form/form-fidelity.mjs";
import { SUBJECTS } from "./glb-voxel-breadth.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLB_DIR = join(HERE, "glb");
const RUNS_DIR = join(HERE, "runs");
const R1_DIR = join(HERE, "glb-voxel"); // E-17 R1 (glb-voxel) baseline
const R2_DIR = join(HERE, "glb-voxel-clean"); // E-17 R2 (material-clean) baseline
const OUT_DIR = join(HERE, "e18-build"); // combined build outputs

const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;

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
/** Decode a GLB baseColor image to RGBA (WebP→PNG via dwebp; PNG/JPEG straight through). The impure edge. */
async function decodeTexture({ data, mimeType }) {
  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const ext = mimeType === "image/png" ? "png" : "jpg";
    const p = join(tmpdir(), `e18-tex-${process.pid}-${tmpSeq++}.${ext}`);
    await writeFile(p, data);
    try {
      return await decodeImage(p);
    } finally {
      await rm(p, { force: true });
    }
  }
  const inP = join(tmpdir(), `e18-tex-${process.pid}-${tmpSeq}.webp`);
  const outP = join(tmpdir(), `e18-tex-${process.pid}-${tmpSeq++}.png`);
  await writeFile(inP, data);
  try {
    await run("dwebp", [inP, "-o", outP]);
    return await decodeImage(outP);
  } finally {
    await rm(inP, { force: true });
    await rm(outP, { force: true });
  }
}

/** Silhouette IoU of a render PNG vs the GLB's own silhouette at SCULPTURE_VIEW_3Q. */
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
  if (!existsSync(concept)) {
    throw new Error(`regen ${subj.key}: concept image not found at runs/${subj.run}/concept.png`);
  }
  await run("node", [join(HERE, "trellis-glb.mjs"), concept, glbPath]);
  return existsSync(glbPath);
}

/** Bare block keys (occupiedCells order) from an artifact's voxel placements. */
function keysFromArtifact(artifact) {
  return artifact.placements.map((p) => p.block.replace(/^minecraft:/, ""));
}

/** Read a committed JSON file, or null if absent/unparseable. */
async function readJson(p) {
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(await readFile(p, "utf8"));
  } catch {
    return null;
  }
}

/** Value ΔE: realized palette of `artifact` vs the GLB canonical texture palette. null on any failure. */
function valueDeltaEOf(artifact, refClusters) {
  if (!refClusters) return null;
  try {
    return round2(valueGate(realizedPaletteFromArtifact(artifact), refClusters).meanDeltaE);
  } catch {
    return null;
  }
}

/** A committed baseline's five-metric cell (speckle recomputed over the NON-thin occupancy). */
async function baselineCell(dir, key, { occBase, segPalette, refClusters, iouKey }) {
  const artifact = await readJson(join(dir, key, "artifact.json"));
  const summary = await readJson(join(dir, key, "summary.json"));
  if (!artifact) return null;
  const keys = keysFromArtifact(artifact);
  return {
    formIoU: summary && typeof summary[iouKey] === "number" ? summary[iouKey] : null,
    speckle: round3(speckleScore(occBase, keys)),
    distinct: artifact.palette.manifest.length,
    offPalette: offPaletteCount(keys, segPalette),
    valueDeltaE: valueDeltaEOf(artifact, refClusters),
  };
}

/** Build the combined E18 artifact for a subject + collect the E18/R1/R2 cells + thin diagnostics. */
async function buildSubject(subj, { scale, renderArtifact, regenMissing }) {
  const glbPath = join(GLB_DIR, subj.glb);
  let regenerated = false;
  if (!existsSync(glbPath)) {
    if (regenMissing) {
      console.error(`${subj.key}: GLB absent — regenerating via TRELLIS …`);
      regenerated = await regenMissingGlb(subj, glbPath);
    }
    if (!existsSync(glbPath)) {
      console.error(`${subj.key}: skipped (glb/${subj.glb} absent — gitignored; pass --regen-missing)`);
      return { subject: subj.key, note: regenMissing ? "GLB regen failed" : "GLB not present" };
    }
  }

  const dir = join(OUT_DIR, subj.key);
  await mkdir(dir, { recursive: true });
  const glbBytes = await readFile(glbPath);

  const t0 = Date.now();
  const occBase = voxelizeGlb(glbBytes, { scale });
  const occThin = voxelizeGlbThin(glbBytes, { scale });
  const surface = parseGlbColoredSurface(glbBytes);
  if (!surface.baseColor) throw new Error(`${subj.key}: GLB has no baseColor texture`);
  const texture = await decodeTexture(surface.baseColor);
  const refClusters = extractTexturePalette(texture).snapPalette; // value-ΔE reference (E-17 parity)
  const segPalette = extractTexturePalette(texture, { k: SEG_DEFAULTS.k }).snapPalette; // off-palette reference

  // The combined build: thin occupancy → segment (value-true colour + clean materials).
  const artifact = segmentMaterials(
    { occupancy: occThin, surface, texture },
    {
      metadata: { trial_id: `${subj.key}-e18-combined` },
      style: {
        name: "glb-voxel-e18",
        rationale: `Thin-preserved voxelization (${occBase.count}→${occThin.count} cells) then region-segmented under a ${segPalette.length}-block fixed palette.`,
      },
    },
  );
  assertArtifact(artifact);
  await writeFile(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");

  const renderPath = join(dir, "render-3q.png");
  await renderArtifact(artifact, { outPath: renderPath, view: SCULPTURE_VIEW_3Q });
  const eKeys = keysFromArtifact(artifact);
  const e18 = {
    formIoU: await judgeIoU(renderPath, glbBytes),
    speckle: round3(speckleScore(occThin, eKeys)),
    distinct: artifact.palette.manifest.length,
    offPalette: offPaletteCount(eKeys, segPalette),
    valueDeltaE: valueDeltaEOf(artifact, refClusters),
  };

  const r1 = await baselineCell(R1_DIR, subj.key, { occBase, segPalette, refClusters, iouKey: "silhouetteIoU" });
  const r2 = await baselineCell(R2_DIR, subj.key, { occBase, segPalette, refClusters, iouKey: "formIoUAfter" });

  const thin = {
    components: occThin.thin?.components ?? null,
    surfaceOnlyCount: occThin.thin?.surfaceOnlyCount ?? null,
    occBase: occBase.count,
    occThin: occThin.count,
  };

  const secs = Number(((Date.now() - t0) / 1000).toFixed(1));
  const row = { subject: subj.key, r1, r2, e18, thin, scale, ...(regenerated ? { regenerated: true } : {}) };
  await writeFile(join(dir, "summary.json"), JSON.stringify(row, null, 2) + "\n");
  console.error(
    `${subj.key}: IoU ${r1?.formIoU}/${r2?.formIoU}/${e18.formIoU} · speckle ${r1?.speckle}/${r2?.speckle}/${e18.speckle} · ` +
      `distinct ${r1?.distinct}/${r2?.distinct}/${e18.distinct} · off-pal ${r1?.offPalette}/${r2?.offPalette}/${e18.offPalette} · ` +
      `ΔE ${r1?.valueDeltaE}/${r2?.valueDeltaE}/${e18.valueDeltaE} · thin ${thin.occBase}→${thin.occThin} comp ${thin.components} (${secs}s)`,
  );
  return row;
}

/** Write e18-remeasure.{md,json} from rows. */
async function emit(rows, { scale }) {
  const { md, json } = assembleRemeasure(rows, { scale });
  await writeFile(join(HERE, "e18-remeasure.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(HERE, "e18-remeasure.md"), md);
  console.error(`wrote e18-remeasure.{md,json} (${rows.length} subjects)`);
}

/** The live GL/host sweep. */
async function runLive({ scale, regenMissing }) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  await mkdir(OUT_DIR, { recursive: true });
  const rows = [];
  for (const subj of SUBJECTS) {
    rows.push(await buildSubject(subj, { scale, renderArtifact, regenMissing }));
  }
  return rows;
}

/** --offline: rebuild the roll-up from committed per-subject summary.json (no GL, no host tool). */
async function regenerateOffline({ scale }) {
  const rows = [];
  for (const subj of SUBJECTS) {
    const j = await readJson(join(OUT_DIR, subj.key, "summary.json"));
    rows.push(j || { subject: subj.key, note: "no summary.json" });
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
  await emit(await runLive({ scale, regenMissing }), { scale });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("e18-remeasure failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { buildSubject, runLive };
