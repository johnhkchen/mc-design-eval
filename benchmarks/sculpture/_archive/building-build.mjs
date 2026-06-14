// IMPURE RUNNER — the E-20 high-res building build (S-068 / T-068-01). Voxelize the whole-building GLB
// (T-067-01, stone-gatehouse.glb) at a DELIBERATELY HIGH scale (markedly more blocks than the ~32-block
// sculptures), clean it with the matured E-19 pipeline (value-true within the design-doc FLAT palette,
// material-region segmented, stray-pruned), render at the building 3/4 view, and score block count + form
// IoU + cleanliness — across a couple of scales, keeping the BEST-READING one (highest form IoU vs the GLB),
// NOT the biggest block count (scale↔fidelity is non-monotonic for angular forms).
//
// PURITY: the scale pick + report are the pure core (src/form/building-build.mjs). This file owns the impure
// edges only — GLB read, dwebp texture decode, GL render, silhouette IoU, file I/O. NOT unit-tested (the
// suite must never pull GL / a host tool); verified by the committed building/ outputs + `--offline`. The
// per-cell compose+score is the e19-build.mjs pattern at the building view, iterated over scales.
//
//   node benchmarks/sculpture/building-build.mjs                 # live: build scales 48,64,96 → pick → report
//   node benchmarks/sculpture/building-build.mjs --scales 48,64  # override the scale set
//   node benchmarks/sculpture/building-build.mjs --offline       # re-derive pick + report from committed summaries

import { readFile, writeFile, mkdir, rm, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import { voxelizeRouted, formTypeOf } from "../../src/form/form-routing.mjs";
import { parseGlbColoredSurface } from "../../src/form/glb-mesh.mjs";
import { segmentMaterials, speckleScore, offPaletteCount } from "../../src/form/material-segment.mjs";
import { paletteFromManifest, assertPaletteDiscipline } from "../../src/form/glb-voxel-build.mjs";
import { augmentPalette } from "../../src/form/palette-augment.mjs";
import { pruneStrays, strayVoxelStats } from "../../src/form/voxel-components.mjs";
import { extractTexturePalette } from "../../src/form/material-clean.mjs";
import { valueGate, realizedPaletteFromArtifact } from "../../src/color/value-gate.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { extractSilhouette, normalizeSilhouette, iou, RENDER_BG } from "../../src/form/form-fidelity.mjs";
import { assembleBuildingBuild, buildingRow, pickBestScale } from "../../src/form/building-build.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { BUILDING_VIEW_3Q, BUILDING_DEFAULT_SCALE } from "../../src/building.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { occupancyFromArtifact } from "./cleanliness-baseline.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const GLB_DIR = join(HERE, "glb");
const RUNS_DIR = join(HERE, "runs");
const OUT_DIR = join(HERE, "building");
const FRAMES_DIR = join(REPO, "pr", "assets", "frames");

const SUBJECT = {
  key: "building",
  glb: "stone-gatehouse.glb",
  run: "015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate",
};
// A couple of HIGH scales tried; the pure pick keeps the best-reading. NOTE: voxelizeGlb caps scale at 64
// (despite BUILDING_SCALE_MAX=96 in building.mjs — a latent inconsistency, recorded in the review), so 64 is
// the effective high-res ceiling. 48 + 64 both yield markedly more blocks than the ~32-block sculptures.
const DEFAULT_SCALES = [BUILDING_DEFAULT_SCALE, 64];
// PRUNE GATE (E-19 / T-066): prune only a real multi-mass hallucination; near-single-mass keeps incidental
// specks. The building is single-mass (largestFraction 1.0) → prune is a no-op safety net, the correct E-19
// behaviour for a clean building GLB.
const PRUNE_GATE_FRACTION = 0.9;

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
    const p = join(tmpdir(), `bb-tex-${process.pid}-${tmpSeq++}.${ext}`);
    await writeFile(p, data);
    try {
      return await decodeImage(p);
    } finally {
      await rm(p, { force: true });
    }
  }
  const inP = join(tmpdir(), `bb-tex-${process.pid}-${tmpSeq}.webp`);
  const outP = join(tmpdir(), `bb-tex-${process.pid}-${tmpSeq++}.png`);
  await writeFile(inP, data);
  try {
    await run("dwebp", [inP, "-o", outP]);
    return await decodeImage(outP);
  } finally {
    await rm(inP, { force: true });
    await rm(outP, { force: true });
  }
}

async function readJson(p) {
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(await readFile(p, "utf8"));
  } catch {
    return null;
  }
}

/** Silhouette IoU of a render PNG vs the GLB's own silhouette at the BUILDING 3/4 view. */
async function judgeIoU(renderPath, glbBytes) {
  const renderImg = await decodeImage(renderPath);
  const rSil = extractSilhouette(renderImg, RENDER_BG);
  const mesh = loadMeshFromGlb(glbBytes);
  const gSil = rasterizeSilhouette(mesh, { view: BUILDING_VIEW_3Q });
  return round3(iou(normalizeSilhouette(rSil), normalizeSilhouette(gSil)));
}

/** Bare block keys (occupiedCells order) from an artifact's voxel placements. */
function keysFromArtifact(artifact) {
  return artifact.placements.map((p) => p.block.replace(/^minecraft:/, ""));
}

/** Value ΔE: realized palette of `artifact` vs the GLB canonical texture palette. null on failure. */
function valueDeltaEOf(artifact, refClusters) {
  if (!refClusters) return null;
  try {
    return round2(valueGate(realizedPaletteFromArtifact(artifact), refClusters).meanDeltaE);
  } catch {
    return null;
  }
}

/** Build + clean + render + score the building at one scale → a building-build row (+ writes per-scale files). */
async function buildAtScale(scale, { glbBytes, surface, texture, designManifest, renderArtifact }) {
  const dir = join(OUT_DIR, `scale-${scale}`);
  await mkdir(dir, { recursive: true });

  // E-19 compose: routed voxelize (building → solid → plain) → gated prune → segment under augmented palette.
  const occRouted = voxelizeRouted(glbBytes, { subject: SUBJECT.key, scale });
  const strayBefore = strayVoxelStats(occRouted);
  const pruneApplied = strayBefore.largestFraction < PRUNE_GATE_FRACTION;
  const occ = pruneApplied ? pruneStrays(occRouted) : occRouted;
  const strayAfter = strayVoxelStats(occ);

  const refClusters = extractTexturePalette(texture).snapPalette;
  const prim = paletteFromManifest(designManifest);
  const aug = augmentPalette(prim, texture);

  const formType = formTypeOf(SUBJECT.key);
  const artifact = segmentMaterials(
    { occupancy: occ, surface, texture },
    {
      palette: aug,
      metadata: { trial_id: `${SUBJECT.key}-e20-scale-${scale}` },
      style: {
        name: "building-e20",
        rationale: `High-res building build @scale ${scale} (${formType}, ${occ.count} cells) — E-19 clean: ` +
          `region-segmented under the augmented design-doc flat palette (${prim.length} design-doc + ≤2 gated secondary)` +
          `${pruneApplied ? `, stray-pruned (${occRouted.count}→${occ.count})` : `, prune-gated (single mass, frac ${round3(strayBefore.largestFraction)})`}.`,
      },
    },
  );
  assertArtifact(artifact);
  assertPaletteDiscipline(artifact, aug, { cap: prim.length + 2 });
  await writeFile(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");

  const renderPath = join(dir, "render-3q.png");
  await renderArtifact(artifact, { outPath: renderPath, view: BUILDING_VIEW_3Q });
  const keys = keysFromArtifact(artifact);

  const cell = {
    scale,
    blocks: artifact.placements.length,
    formIoU: await judgeIoU(renderPath, glbBytes),
    speckle: round3(speckleScore(occ, keys)),
    distinct: artifact.palette.manifest.length,
    offPalette: offPaletteCount(keys, aug),
    valueDeltaE: valueDeltaEOf(artifact, refClusters),
    strayCount: strayAfter.strayCount,
    largestFraction: round3(strayAfter.largestFraction),
    occ: { routed: occRouted.count, pruned: occ.count },
    pruneApplied,
  };
  await writeFile(join(dir, "summary.json"), JSON.stringify(cell, null, 2) + "\n");
  console.error(
    `scale ${scale}: ${cell.blocks} blocks · form IoU ${cell.formIoU} · speckle ${cell.speckle} · ` +
      `distinct ${cell.distinct} · off-pal ${cell.offPalette} · ΔE ${cell.valueDeltaE} · ` +
      `frac ${cell.largestFraction} · prune ${pruneApplied ? "ON" : "gated"}`,
  );
  return cell;
}

/** Assemble + write building-build.{md,json}. */
async function emit(rows) {
  const chosen = pickBestScale(rows.map(buildingRow));
  const { md, json } = assembleBuildingBuild({ rows, chosen });
  await writeFile(join(HERE, "building-build.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(HERE, "building-build.md"), md);
  console.error(`wrote building-build.{md,json}; chosen scale ${chosen.scale} (${chosen.reason})`);
  return { json, chosen };
}

async function runLive({ scales }) {
  const glbPath = join(GLB_DIR, SUBJECT.glb);
  if (!existsSync(glbPath)) throw new Error(`glb/${SUBJECT.glb} absent (gitignored) — provision via T-067 / trellis-glb.mjs`);
  const designArtifact = await readJson(join(RUNS_DIR, SUBJECT.run, "artifact.json"));
  if (!designArtifact?.palette?.manifest?.length) throw new Error(`runs/${SUBJECT.run}/artifact.json missing design-doc manifest`);
  const designManifest = designArtifact.palette.manifest;

  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  await mkdir(OUT_DIR, { recursive: true });
  const glbBytes = await readFile(glbPath);
  const surface = parseGlbColoredSurface(glbBytes);
  if (!surface.baseColor) throw new Error("building GLB has no baseColor texture");
  const texture = await decodeTexture(surface.baseColor);

  const rows = [];
  for (const scale of scales) {
    try {
      rows.push(await buildAtScale(scale, { glbBytes, surface, texture, designManifest, renderArtifact }));
    } catch (err) {
      console.error(`scale ${scale}: FAILED — ${err?.message || err}`);
      rows.push({ scale, note: `build failed: ${err?.message || err}` });
    }
  }
  const { chosen } = await emit(rows);

  // copy the chosen build + render: building/best/artifact.json + pr/assets/frames/building-best.png.
  if (chosen.scale != null) {
    await mkdir(join(OUT_DIR, "best"), { recursive: true });
    const srcArt = join(OUT_DIR, `scale-${chosen.scale}`, "artifact.json");
    if (existsSync(srcArt)) await copyFile(srcArt, join(OUT_DIR, "best", "artifact.json"));
    const srcPng = join(OUT_DIR, `scale-${chosen.scale}`, "render-3q.png");
    if (existsSync(srcPng)) {
      await mkdir(FRAMES_DIR, { recursive: true });
      await copyFile(srcPng, join(FRAMES_DIR, "building-best.png"));
    }
    console.error(`best: scale ${chosen.scale} → building/best/artifact.json + pr/assets/frames/building-best.png`);
  }
}

/** --offline: re-derive the pick + report from committed scale-<n>/summary.json (no GL); re-validate artifacts. */
async function verifyOffline({ scales }) {
  const rows = [];
  for (const scale of scales) {
    const summary = await readJson(join(OUT_DIR, `scale-${scale}`, "summary.json"));
    const artifact = await readJson(join(OUT_DIR, `scale-${scale}`, "artifact.json"));
    if (!summary) {
      rows.push({ scale, note: "no summary.json" });
      continue;
    }
    if (artifact) assertArtifact(artifact); // the committed build is still schema-valid
    rows.push(summary);
  }
  const { json, chosen } = await emit(rows);
  console.error(`offline: ${json.rows.filter((r) => r.formIoU != null).length}/${json.rows.length} scales; chosen scale ${chosen.scale}`);
}

function parseScales(argv) {
  const i = argv.indexOf("--scales");
  if (i >= 0 && argv[i + 1]) return argv[i + 1].split(",").map((s) => Number(s.trim())).filter((n) => Number.isInteger(n));
  return DEFAULT_SCALES;
}

async function main() {
  const argv = process.argv.slice(2);
  const scales = parseScales(argv);
  await mkdir(OUT_DIR, { recursive: true });
  if (argv.includes("--offline")) {
    await verifyOffline({ scales });
    return;
  }
  await runLive({ scales });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("building-build failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { buildAtScale, runLive, verifyOffline, SUBJECT };
