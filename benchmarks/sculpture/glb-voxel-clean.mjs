// GLB-voxel MATERIAL-CLEAN sweep — E-17 rung R2 (T-055-01, story S-055, epic E-17).
//
// R1 (glb-voxel-breadth.mjs) won on FORM but left a SPECKLED skin: each voxel snapped its own texel to the
// nearest of the full 305-block table, so adjacent cells diverged (koi 71 / heart 91 distinct blocks). This
// sweep applies the R2 material-clean pass to all 7 R1 builds: extract a small canonical palette FROM each
// GLB's own baseColor texture (E-10), snap every voxel to that palette, spatially denoise, recompile, render,
// and score. The roll-up is the R2 before/after table — distinct-block count and spatial speckle DOWN, form
// IoU STEADY (clean must not break the shape — guaranteed: R2 never touches occupancy).
//
// REUSE, NOT REIMPLEMENTATION: the pure core is `materialCleanVoxel` (src/form/material-clean.mjs). The
// SUBJECTS list is imported from glb-voxel-breadth.mjs (one source of truth). The impure glue (dwebp WebP
// decode, the silhouette IoU judge, TRELLIS regen) is the SAME shape as the R1 runner — kept local, the
// established split (reuse pure src/, each harness owns its render/host glue). GL + host-tool, NOT in npm test.
//
//   node benchmarks/sculpture/glb-voxel-clean.mjs [scale]                 # live R2 sweep, 7 subjects
//   node benchmarks/sculpture/glb-voxel-clean.mjs --offline               # rebuild r2.{md,json} from summaries
//   node benchmarks/sculpture/glb-voxel-clean.mjs --regen-missing [scale] # also TRELLIS-regen any absent GLB
//
// Writes glb-voxel-clean/<subject>/{artifact.json, render-3q.png, summary.json} and glb-voxel-clean/r2.{md,json}.

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import { materialCleanVoxel, extractTexturePalette, speckleScore } from "../../src/form/material-clean.mjs";
import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";
import { parseGlbColoredSurface } from "../../src/form/glb-mesh.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { DEFAULT_SCALE, SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
import { GLB_VOXEL_METHOD_ID } from "../../src/config.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { extractSilhouette, normalizeSilhouette, iou, RENDER_BG } from "../../src/form/form-fidelity.mjs";
import { SUBJECTS } from "./glb-voxel-breadth.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLB_DIR = join(HERE, "glb");
const R1_DIR = join(HERE, "glb-voxel"); // R1 (before) artifacts live here
const OUT_DIR = join(HERE, "glb-voxel-clean"); // R2 (after) outputs
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
/**
 * Decode a GLB baseColor image to RGBA. WebP → PNG via `dwebp` (host tool, never in CI), then pngjs via
 * decodeImage. PNG/JPEG pass straight through. The only impure edge; injected into the clean pass.
 */
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
  if (!existsSync(concept)) {
    throw new Error(`regen ${subj.key}: concept image not found at runs/${subj.run}/concept.png`);
  }
  await run("node", [join(HERE, "trellis-glb.mjs"), concept, glbPath]);
  return existsSync(glbPath);
}

/** Bare block keys (occupiedCells order) from a committed artifact's voxel placements. */
function keysFromArtifact(artifact) {
  return artifact.placements.map((p) => p.block.replace(/^minecraft:/, ""));
}

const round3 = (n) => Math.round(n * 1000) / 1000;

/**
 * PURE: rows[] → { md, json } for the R2 before/after table. The story in one table: distinct-block count
 * and spatial speckle DROP (the clean), form IoU holds (the form is not broken).
 */
function buildR2(rows, { scale = DEFAULT_SCALE } = {}) {
  const live = rows.filter((r) => !r.skipped);
  const md = [
    "# R2 — GLB-voxel material-clean across the 7-subject sweep (E-17 T-055-01)",
    "",
    "Each R1 GLB-voxel build re-materialed: a small canonical palette is EXTRACTED from the GLB's own baseColor",
    "texture (E-10 CIE-Lab), every voxel snapped to that value-true palette, then spatially denoised. Rendered at",
    "SCULPTURE_VIEW_3Q and scored vs the GLB silhouette. `manifest` = distinct blocks; `speckle` = fraction of",
    "face-adjacent cell pairs that differ (lower = cleaner). Form IoU is expected to hold (R2 never moves a voxel).",
    "",
    `Subjects: ${live.length} (sword excluded — TRELLIS 500'd on the thin blade; see glb/README.md).`,
    "",
    "| subject | occupancy | distinct R1→R2 | speckle R1→R2 | form IoU R1→R2 |",
    "| ------- | --------- | -------------- | ------------- | -------------- |",
    ...rows.map((r) =>
      r.skipped
        ? `| ${r.subject} | — | — | — | — | _(GLB absent — ${r.note ?? "skipped"})_`
        : `| ${r.subject} | ${r.occupancy} | ${r.manifestBefore} → ${r.manifestAfter} | ` +
          `${r.speckleBefore} → ${r.speckleAfter} | ${r.formIoUBefore} → ${r.formIoUAfter} |` +
          (r.regenerated ? " _(GLB regenerated)_" : ""),
    ),
    "",
  ].join("\n");

  const json = {
    schema: "glb-voxel-r2/v1",
    rung: "R2",
    method: GLB_VOXEL_METHOD_ID,
    view: SCULPTURE_VIEW_3Q,
    scale,
    metric:
      "noise drop = distinct-block count (manifest) + spatial speckle (fraction of face-adjacent differing pairs); " +
      "form IoU = silhouette vs the GLB's own mesh at SCULPTURE_VIEW_3Q (steady = clean did not break the shape)",
    generatedFrom: "benchmarks/sculpture/glb/<subject>.glb via materialCleanVoxel (src/form/material-clean.mjs)",
    note:
      "E-17 rung R2: the material-clean pass over the R1 GLB-voxel builds. Palette is texture-derived (E-10 " +
      "extractPaletteFromPixels → value-true blocks), NOT clustered from the noisy per-voxel samples. R2 only " +
      "re-decides each occupied cell's block (snap-to-canonical-palette + neighbourhood-majority denoise); it " +
      "NEVER touches occupancy, so form IoU is invariant by construction (GL rounding aside). Sword excluded.",
    subjects: rows,
  };
  return { md, json };
}

/** The live GL/host sweep: clean-build every subject, render, judge, record before/after vs R1. */
async function runClean({ scale = DEFAULT_SCALE, regenMissing = false } = {}) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const { renderSummary } = await import("../../src/render-tool.mjs");

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
    // Decoded build shared by the clean pass, the palette description, and the before/after speckle metric.
    const occupancy = voxelizeGlb(glbBytes, { scale });
    const surface = parseGlbColoredSurface(glbBytes);
    if (!surface.baseColor) throw new Error(`${subj.key}: GLB has no baseColor texture`);
    const texture = await decodeTexture(surface.baseColor);
    const { snapPalette, description } = extractTexturePalette(texture);

    const artifact = materialCleanVoxel(
      { occupancy, surface, texture },
      {
        metadata: { trial_id: `${subj.key}-glb-voxel-clean` },
        style: {
          name: "glb-voxel-clean",
          rationale: `Voxelized ${subj.key} GLB; cells snapped to a ${snapPalette.length}-block value-true palette from its own texture, then denoised.`,
        },
      },
    );
    assertArtifact(artifact); // fail loud if the gate rejects
    await writeFile(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");

    const renderPath = join(dir, "render-3q.png");
    const report = await renderArtifact(artifact, { outPath: renderPath, view: SCULPTURE_VIEW_3Q });
    const sum = renderSummary(report);
    const formIoUAfter = await judgeIoU(renderPath, glbBytes);
    const afterKeys = keysFromArtifact(artifact);
    const speckleAfter = round3(speckleScore(occupancy, afterKeys));

    // Before (R1): the committed glb-voxel/<subj> artifact + summary. Same GLB + scale ⇒ same occupancy order.
    const r1ArtPath = join(R1_DIR, subj.key, "artifact.json");
    const r1SumPath = join(R1_DIR, subj.key, "summary.json");
    let manifestBefore = null;
    let speckleBefore = null;
    let formIoUBefore = null;
    if (existsSync(r1ArtPath)) {
      const r1Art = JSON.parse(await readFile(r1ArtPath, "utf8"));
      manifestBefore = r1Art.palette.manifest.length;
      speckleBefore = round3(speckleScore(occupancy, keysFromArtifact(r1Art)));
    }
    if (existsSync(r1SumPath)) {
      formIoUBefore = JSON.parse(await readFile(r1SumPath, "utf8")).silhouetteIoU ?? null;
    }

    const secs = Number(((Date.now() - t0) / 1000).toFixed(1));
    const summary = {
      subject: subj.key,
      scale,
      occupancy: artifact.placements.length,
      blocks: sum.placed,
      unmapped: sum.unmapped,
      bounds: sum.bounds,
      paletteSize: snapPalette.length,
      paletteDescription: description,
      manifestBefore,
      manifestAfter: artifact.palette.manifest.length,
      speckleBefore,
      speckleAfter,
      formIoUBefore,
      formIoUAfter,
      view3q: SCULPTURE_VIEW_3Q,
      durationSec: secs,
      ...(regenerated ? { regenerated: true } : {}),
    };
    await writeFile(join(dir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
    rows.push(summary);
    console.error(
      `${subj.key}: occ ${summary.occupancy}, palette ${snapPalette.length}, distinct ${manifestBefore}→` +
        `${summary.manifestAfter}, speckle ${speckleBefore}→${speckleAfter}, form IoU ${formIoUBefore}→${formIoUAfter}` +
        `${regenerated ? " (regen)" : ""} (${secs}s)`,
    );
  }
  return rows;
}

/** Write r2.{md,json} from rows. */
async function emit(rows, opts) {
  await mkdir(OUT_DIR, { recursive: true });
  const { md, json } = buildR2(rows, opts);
  await writeFile(join(OUT_DIR, "r2.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "r2.md"), md);
  console.error(`wrote glb-voxel-clean/r2.{md,json} (${rows.filter((r) => !r.skipped).length}/${rows.length} subjects)`);
}

/** --offline: rebuild r2.{md,json} from the committed per-subject summaries (no GL, no network). */
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
  await emit(await runClean({ scale, regenMissing }), { scale });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("glb-voxel-clean failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { buildR2, runClean };
