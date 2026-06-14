// GLB-voxel MATERIAL-REGION SEGMENTATION sweep — E-18 rung R-seg (T-058-01, story S-058, epic E-18).
//
// R2 (glb-voxel-clean.mjs) NARROWED the speckle but left two symptoms: PALETTE LEAKAGE (the build draws
// more blocks than the subject has colours — per-voxel snap over a loose palette + E-11 same-hue creep)
// and GRADIENT BREAKDOWN (smooth texture gradients scatter into near-duplicate blocks). This sweep applies
// the R-seg pass to all 7 subjects: a TIGHT fixed palette is extracted from each GLB's own baseColor
// texture (E-10), occupied cells are grown into contiguous same-material regions (connected components by
// CIE-Lab ΔE), off-colour singletons absorbed, each region filled with ONE palette block, and gradients
// BANDED as solid steps along the gradient axis (hard band by default — minimises speckle; ordered-Bayer
// dither is opt-in via `dither`). The roll-up is the R2→R-seg before/after
// table — distinct-block, spatial speckle, and OFF-PALETTE all DOWN, form IoU STEADY (R-seg never moves a
// voxel, so form IoU is invariant by construction).
//
// REUSE, NOT REIMPLEMENTATION: the pure core is `segmentMaterials` (src/form/material-segment.mjs); the
// SUBJECTS list and the impure glue shape (dwebp WebP decode, silhouette-IoU judge, TRELLIS regen) are the
// SAME as the R1/R2 runners — kept local, the established split. GL + host-tool, NOT in npm test.
//
//   node benchmarks/sculpture/glb-voxel-seg.mjs [scale]                 # live R-seg sweep, 7 subjects
//   node benchmarks/sculpture/glb-voxel-seg.mjs --offline               # rebuild seg.{md,json} from summaries
//   node benchmarks/sculpture/glb-voxel-seg.mjs --regen-missing [scale] # also TRELLIS-regen any absent GLB
//
// Writes glb-voxel-seg/<subject>/{artifact.json, render-3q.png, summary.json} and glb-voxel-seg/seg.{md,json}.
// The R2 build (glb-voxel-clean/<subject>/{artifact,summary}.json) is the before-baseline.

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import {
  segmentMaterials,
  speckleScore,
  offPaletteCount,
  SEG_DEFAULTS,
} from "../../src/form/material-segment.mjs";
import { extractTexturePalette } from "../../src/form/material-clean.mjs";
import { paletteFromManifest, assertPaletteDiscipline } from "../../src/form/glb-voxel-build.mjs";
import { augmentPalette } from "../../src/form/palette-augment.mjs";
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
const R2_DIR = join(HERE, "glb-voxel-clean"); // R2 (before) artifacts live here
const OUT_DIR = join(HERE, "glb-voxel-seg"); // R-seg (after) outputs
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
 * PURE: rows[] → { md, json } for the R2→R-seg before/after table. The story in one table: distinct-block,
 * spatial speckle, AND off-palette DROP (the segmentation + tight palette); form IoU holds (form unbroken).
 */
function buildSeg(rows, { scale = DEFAULT_SCALE } = {}) {
  const live = rows.filter((r) => !r.skipped);
  const md = [
    "# R-seg — GLB-voxel material-region segmentation across the 7-subject sweep (E-18 T-058-01)",
    "",
    "Each R2 (material-clean) build re-materialed by REGION: a tight fixed palette is extracted from the GLB's own",
    "baseColor texture (E-10 CIE-Lab), occupied cells grown into contiguous same-material regions (connected",
    "components by ΔE), off-colour singletons absorbed, each region filled with ONE palette block, and gradients",
    "banded as solid steps along the gradient axis (a HARD band — nearest palette step per cell — minimises",
    "within-region speckle; an ordered-Bayer dither is opt-in via `dither`). Rendered at SCULPTURE_VIEW_3Q and scored vs the",
    "GLB silhouette. `distinct` = blocks in the manifest; `speckle` = fraction of face-adjacent cell pairs that",
    "differ (lower = cleaner); `off-palette` = blocks placed outside the fixed palette (R-seg is 0 by construction).",
    "Form IoU is expected to hold (R-seg never moves a voxel).",
    "",
    `Subjects: ${live.length} (sword excluded — TRELLIS 500'd on the thin blade; see glb/README.md).`,
    "",
    "| subject | occupancy | regions | distinct R2→seg | speckle R2→seg | off-palette R2→seg | form IoU R2→seg |",
    "| ------- | --------- | ------- | --------------- | -------------- | ------------------ | --------------- |",
    ...rows.map((r) =>
      r.skipped
        ? `| ${r.subject} | — | — | — | — | — | — | _(GLB absent — ${r.note ?? "skipped"})_`
        : `| ${r.subject} | ${r.occupancy} | ${r.regionCount} | ${r.distinctBefore} → ${r.distinctAfter} | ` +
          `${r.speckleBefore} → ${r.speckleAfter} | ${r.offPaletteBefore} → ${r.offPaletteAfter} | ` +
          `${r.formIoUBefore} → ${r.formIoUAfter} |` +
          (r.regenerated ? " _(GLB regenerated)_" : ""),
    ),
    "",
  ].join("\n");

  const json = {
    schema: "glb-voxel-seg/v1",
    rung: "R-seg",
    method: GLB_VOXEL_METHOD_ID,
    view: SCULPTURE_VIEW_3Q,
    scale,
    defaults: SEG_DEFAULTS,
    metric:
      "palette discipline = off-palette count (blocks outside the fixed palette) + distinct-block count " +
      "(manifest); noise = spatial speckle (fraction of face-adjacent differing pairs); form IoU = " +
      "silhouette vs the GLB's own mesh at SCULPTURE_VIEW_3Q (steady = segmentation did not break the shape)",
    generatedFrom: "benchmarks/sculpture/glb/<subject>.glb via segmentMaterials (src/form/material-segment.mjs)",
    note:
      "E-18 rung R-seg: region segmentation over the R2 material-clean builds. T-058-02: the palette is the " +
      "AUGMENTED DESIGN-DOC palette (design-doc manifest ∪ ≤K=2 gated secondary, T-058-03) and FIXED — NOT a " +
      "texture median-cut; every region fills with one palette block (gradients banded), so off-palette = 0 and " +
      "distinct ≤ design-doc size + 2 by construction (asserted by assertPaletteDiscipline). R-seg only " +
      "re-decides each occupied cell's block; it NEVER touches occupancy, so form IoU is invariant (GL rounding " +
      "aside). Before = the committed R2 build; its off-palette is counted against the SAME augmented palette " +
      "(the leakage R-seg removes). Sword excluded.",
    subjects: rows,
  };
  return { md, json };
}

/** The live GL/host sweep: segment every subject, render, judge, record before/after vs R2. */
async function runSeg({ scale = DEFAULT_SCALE, regenMissing = false } = {}) {
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
    // Decoded build shared by the segment pass, the palette description, and the before/after metrics.
    const occupancy = voxelizeGlb(glbBytes, { scale });
    const surface = parseGlbColoredSurface(glbBytes);
    if (!surface.baseColor) throw new Error(`${subj.key}: GLB has no baseColor texture`);
    const texture = await decodeTexture(surface.baseColor);
    const { description } = extractTexturePalette(texture, { k: SEG_DEFAULTS.k }); // kept for the before-state note only
    // The fix: snap within the DESIGN-DOC palette (the model's deliberate few blocks), NOT a palette
    // median-cut from the noisy TRELLIS texture (which is the "larger universe" that bloats + speckles).
    const designManifest = JSON.parse(await readFile(join(RUNS_DIR, subj.run, "artifact.json"), "utf8")).palette.manifest;
    const palette = paletteFromManifest(designManifest);
    // E-18 T-058-02: the canonical candidate set is the AUGMENTED design-doc palette (design-doc ∪ ≤K=2
    // gated secondary, T-058-03). `aug` is the membership reference for off-palette + the discipline guard.
    const aug = augmentPalette(palette, texture);

    const artifact = segmentMaterials(
      { occupancy, surface, texture },
      {
        palette,
        augment: true,
        metadata: { trial_id: `${subj.key}-glb-voxel-seg` },
        style: {
          name: "glb-voxel-seg",
          rationale: `Region-segmented ${subj.key} GLB under the augmented design-doc palette (${palette.length} design-doc + ≤2 gated secondary); gradients banded.`,
        },
      },
    );
    assertArtifact(artifact); // fail loud if the gate rejects
    assertPaletteDiscipline(artifact, aug, { cap: palette.length + 2 }); // fail loud on any off-(augmented) block
    await writeFile(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");

    const renderPath = join(dir, "render-3q.png");
    const report = await renderArtifact(artifact, { outPath: renderPath, view: SCULPTURE_VIEW_3Q });
    const sum = renderSummary(report);
    const formIoUAfter = await judgeIoU(renderPath, glbBytes);
    const afterKeys = keysFromArtifact(artifact);
    const speckleAfter = round3(speckleScore(occupancy, afterKeys));
    const offPaletteAfter = offPaletteCount(afterKeys, aug);
    const distinctAfter = artifact.palette.manifest.length;

    // Before (R2): the committed glb-voxel-clean/<subj> artifact + summary. Same GLB + scale ⇒ same occupancy order.
    const r2ArtPath = join(R2_DIR, subj.key, "artifact.json");
    const r2SumPath = join(R2_DIR, subj.key, "summary.json");
    let distinctBefore = null;
    let speckleBefore = null;
    let offPaletteBefore = null;
    let formIoUBefore = null;
    if (existsSync(r2ArtPath)) {
      const r2Art = JSON.parse(await readFile(r2ArtPath, "utf8"));
      const r2Keys = keysFromArtifact(r2Art);
      distinctBefore = r2Art.palette.manifest.length;
      speckleBefore = round3(speckleScore(occupancy, r2Keys));
      offPaletteBefore = offPaletteCount(r2Keys, aug); // R2 leakage vs the augmented design-doc palette
    }
    if (existsSync(r2SumPath)) {
      formIoUBefore = JSON.parse(await readFile(r2SumPath, "utf8")).formIoUAfter ?? null;
    }

    const secs = Number(((Date.now() - t0) / 1000).toFixed(1));
    const summary = {
      subject: subj.key,
      scale,
      occupancy: artifact.placements.length,
      regionCount: distinctAfter, // distinct blocks placed under the fixed palette (≈ filled region groups)
      blocks: sum.placed,
      unmapped: sum.unmapped,
      bounds: sum.bounds,
      paletteSize: aug.length,
      paletteDescription: description,
      distinctBefore,
      distinctAfter,
      speckleBefore,
      speckleAfter,
      offPaletteBefore,
      offPaletteAfter,
      formIoUBefore,
      formIoUAfter,
      view3q: SCULPTURE_VIEW_3Q,
      durationSec: secs,
      ...(regenerated ? { regenerated: true } : {}),
    };
    await writeFile(join(dir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
    rows.push(summary);
    console.error(
      `${subj.key}: occ ${summary.occupancy}, palette ${aug.length}, distinct ${distinctBefore}→` +
        `${distinctAfter}, speckle ${speckleBefore}→${speckleAfter}, off-palette ${offPaletteBefore}→${offPaletteAfter}, ` +
        `form IoU ${formIoUBefore}→${formIoUAfter}${regenerated ? " (regen)" : ""} (${secs}s)`,
    );
  }
  return rows;
}

/** Write seg.{md,json} from rows. */
async function emit(rows, opts) {
  await mkdir(OUT_DIR, { recursive: true });
  const { md, json } = buildSeg(rows, opts);
  await writeFile(join(OUT_DIR, "seg.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "seg.md"), md);
  console.error(`wrote glb-voxel-seg/seg.{md,json} (${rows.filter((r) => !r.skipped).length}/${rows.length} subjects)`);
}

/** --offline: rebuild seg.{md,json} from the committed per-subject summaries (no GL, no network). */
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
  await emit(await runSeg({ scale, regenMissing }), { scale });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("glb-voxel-seg failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { buildSeg, runSeg };
