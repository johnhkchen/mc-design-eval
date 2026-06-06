// E-19 CLEANUP CONSOLIDATION sweep — the terminal before/after (T-066-01, story S-066, epic E-19).
//
// Rebuilds all 7 sculpture subjects with the COMBINED cleanup fixes and measures the honest before/after vs
// the busy E-18 builds. The three fixes — landed independently — are composed here for the first time:
//   T-063 stray pruning (pruneStrays) + T-064 clean materials (variance-aware palette, baked into
//   segmentMaterials/palette-augment) + T-065 per-subject thin routing (voxelizeRouted).
// The ONLY delta from the committed e18-build is the voxelizer: this runner calls `voxelizeRouted` (solids
// drop the over-thickening universal-thin shell for plain voxelizeGlb) where e18-remeasure ran thin on all 7.
//
// Per subject the combined E-19 build is:
//   voxelizeRouted (thin→thin voxelizer, solid→plain) → pruneStrays → segmentMaterials (clean materials,
//   augmented design-doc palette) → DesignArtifact → render.
// Scored on the fixed T-062 metrics against TWO references:
//   BUSY        = the E-18 seg build (glb-voxel-seg/), re-scored on the fixed metrics (occupancyFromArtifact);
//   INTERMEDIATE = the committed e18-build (universal thin + prune + clean) summary.
// The pure roll-up (deltas + per-fix marginals + headline) is assembleCleanup (src/form/e19-cleanup.mjs);
// this runner owns the GL render + dwebp decode + frame copy.
//
//   node benchmarks/sculpture/e19-build.mjs [scale]    # live combined sweep, 7 subjects, + report + frames
//   node benchmarks/sculpture/e19-build.mjs --offline  # rebuild e19-cleanup.{md,json} from committed summaries
//
// Writes e19-build/<subject>/{artifact.json, render-3q.png, summary.json}, e19-cleanup.{md,json},
// and pr/assets/frames/e19-{heart,moai,koi}-{before,after}.png.

import { readFile, writeFile, mkdir, rm, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";
import { voxelizeRouted, formTypeOf } from "../../src/form/form-routing.mjs";
import { parseGlbColoredSurface } from "../../src/form/glb-mesh.mjs";
import { segmentMaterials, speckleScore, offPaletteCount } from "../../src/form/material-segment.mjs";
import { paletteFromManifest, assertPaletteDiscipline } from "../../src/form/glb-voxel-build.mjs";
import { augmentPalette } from "../../src/form/palette-augment.mjs";
import { pruneStrays, strayVoxelStats } from "../../src/form/voxel-components.mjs";
import { extractTexturePalette } from "../../src/form/material-clean.mjs";
import { valueGate, realizedPaletteFromArtifact } from "../../src/color/value-gate.mjs";
import { assembleCleanup } from "../../src/form/e19-cleanup.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { DEFAULT_SCALE, SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { extractSilhouette, normalizeSilhouette, iou, RENDER_BG } from "../../src/form/form-fidelity.mjs";
import { occupancyFromArtifact } from "./cleanliness-baseline.mjs";
import { SUBJECTS } from "./glb-voxel-breadth.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLB_DIR = join(HERE, "glb");
const RUNS_DIR = join(HERE, "runs");
const SEG_DIR = join(HERE, "glb-voxel-seg"); // the busy E-18 seg build ("before")
const E18_DIR = join(HERE, "e18-build"); // the intermediate build (universal thin + prune + clean)
const OUT_DIR = join(HERE, "e19-build"); // the combined E-19 build outputs
const FRAMES_DIR = join(HERE, "..", "..", "pr", "assets", "frames");
const WORST = ["heart", "moai", "koi"]; // speckle / stray geometry / speckle

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
    const p = join(tmpdir(), `e19-tex-${process.pid}-${tmpSeq++}.${ext}`);
    await writeFile(p, data);
    try {
      return await decodeImage(p);
    } finally {
      await rm(p, { force: true });
    }
  }
  const inP = join(tmpdir(), `e19-tex-${process.pid}-${tmpSeq}.webp`);
  const outP = join(tmpdir(), `e19-tex-${process.pid}-${tmpSeq++}.png`);
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

/** Re-score the BUSY E-18 seg build for a subject on the fixed metrics. null if its artifact is absent. */
async function busyCell(subjKey, { augPalette, refClusters }) {
  const artifact = await readJson(join(SEG_DIR, subjKey, "artifact.json"));
  const summary = await readJson(join(SEG_DIR, subjKey, "summary.json"));
  if (!artifact) return null;
  const { occupancy, keys } = occupancyFromArtifact(artifact);
  const stray = strayVoxelStats(occupancy);
  return {
    formIoU: summary && typeof summary.formIoUAfter === "number" ? summary.formIoUAfter : null,
    speckle: round3(speckleScore(occupancy, keys)),
    largestFraction: round3(stray.largestFraction),
    strayCount: stray.strayCount,
    components: stray.components,
    distinct: artifact.palette.manifest.length,
    offPalette: offPaletteCount(keys, augPalette),
    valueDeltaE: valueDeltaEOf(artifact, refClusters),
  };
}

/** The INTERMEDIATE cell (committed e18-build: universal thin + prune + clean). null if absent. */
async function intermediateCell(subjKey) {
  const s = await readJson(join(E18_DIR, subjKey, "summary.json"));
  if (!s || !s.e18) return null;
  const after = s.stray?.after;
  return {
    formIoU: s.e18.formIoU ?? null,
    speckle: s.e18.speckle ?? null,
    largestFraction: after ? after.largestFraction : null,
    strayCount: after ? after.strayCount : null,
    components: after ? after.components : null,
    distinct: s.e18.distinct ?? null,
    offPalette: s.e18.offPalette ?? null,
    valueDeltaE: s.e18.valueDeltaE ?? null,
  };
}

/** Build the combined E-19 artifact for a subject + collect busy/intermediate/E-19 cells. */
async function buildSubject(subj, { scale, renderArtifact }) {
  const glbPath = join(GLB_DIR, subj.glb);
  if (!existsSync(glbPath)) {
    console.error(`${subj.key}: skipped (glb/${subj.glb} absent — gitignored)`);
    return { subject: subj.key, note: "GLB not present" };
  }

  const dir = join(OUT_DIR, subj.key);
  await mkdir(dir, { recursive: true });
  const glbBytes = await readFile(glbPath);

  const occBase = voxelizeGlb(glbBytes, { scale });
  // T-065 routing: thin subjects keep voxelizeGlbThin; solids use plain voxelizeGlb (no over-thickening).
  const occRouted = voxelizeRouted(glbBytes, { subject: subj.key, scale });
  // T-063 pruning: drop TRELLIS strays (moai's duplicate masses) geometrically.
  const occPruned = pruneStrays(occRouted);
  const strayBefore = strayVoxelStats(occRouted);
  const strayAfter = strayVoxelStats(occPruned);

  const surface = parseGlbColoredSurface(glbBytes);
  if (!surface.baseColor) throw new Error(`${subj.key}: GLB has no baseColor texture`);
  const texture = await decodeTexture(surface.baseColor);
  const refClusters = extractTexturePalette(texture).snapPalette; // value-ΔE reference (k=8)
  const designManifest = JSON.parse(await readFile(join(RUNS_DIR, subj.run, "artifact.json"), "utf8")).palette.manifest;
  const prim = paletteFromManifest(designManifest);
  const aug = augmentPalette(prim, texture); // T-064 clean materials live inside augment + segment

  const formType = formTypeOf(subj.key);
  const artifact = segmentMaterials(
    { occupancy: occPruned, surface, texture },
    {
      palette: aug,
      metadata: { trial_id: `${subj.key}-e19-cleanup` },
      style: {
        name: "glb-voxel-e19",
        rationale: `Routed voxelization (${formType}: ${occBase.count}→${occRouted.count} cells) then stray-pruned (${occRouted.count}→${occPruned.count}) then region-segmented under the augmented design-doc palette (${prim.length} design-doc + ≤2 gated secondary).`,
      },
    },
  );
  assertArtifact(artifact);
  assertPaletteDiscipline(artifact, aug, { cap: prim.length + 2 });
  await writeFile(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");

  const renderPath = join(dir, "render-3q.png");
  await renderArtifact(artifact, { outPath: renderPath, view: SCULPTURE_VIEW_3Q });
  const eKeys = keysFromArtifact(artifact);
  const e19 = {
    formIoU: await judgeIoU(renderPath, glbBytes),
    speckle: round3(speckleScore(occPruned, eKeys)),
    largestFraction: round3(strayAfter.largestFraction),
    strayCount: strayAfter.strayCount,
    components: strayAfter.components,
    distinct: artifact.palette.manifest.length,
    offPalette: offPaletteCount(eKeys, aug),
    valueDeltaE: valueDeltaEOf(artifact, refClusters),
  };

  const busy = await busyCell(subj.key, { augPalette: aug, refClusters });
  const intermediate = await intermediateCell(subj.key);

  const row = {
    subject: subj.key,
    formType,
    busy,
    intermediate,
    e19,
    occ: { base: occBase.count, routed: occRouted.count, pruned: occPruned.count },
    stray: {
      before: { components: strayBefore.components, largestFraction: round3(strayBefore.largestFraction), strayCount: strayBefore.strayCount },
      after: { components: strayAfter.components, largestFraction: round3(strayAfter.largestFraction), strayCount: strayAfter.strayCount },
    },
    scale,
  };
  await writeFile(join(dir, "summary.json"), JSON.stringify(row, null, 2) + "\n");
  console.error(
    `${subj.key} (${formType}): IoU ${busy?.formIoU}→${intermediate?.formIoU}→${e19.formIoU} · ` +
      `speckle ${busy?.speckle}→${intermediate?.speckle}→${e19.speckle} · distinct ${busy?.distinct}→${e19.distinct} · ` +
      `off-pal ${busy?.offPalette}→${e19.offPalette} · ΔE ${busy?.valueDeltaE}→${e19.valueDeltaE} · ` +
      `occ ${occBase.count}→${occRouted.count}→${occPruned.count} · stray ${strayBefore.strayCount}→${strayAfter.strayCount} ` +
      `(frac ${round3(strayBefore.largestFraction)}→${round3(strayAfter.largestFraction)})`,
  );
  return row;
}

/** Build the per-fix marginal-attribution block from the assembled rows + the committed routing record. */
async function buildMarginals(rows) {
  const valid = rows.filter((r) => r && r.e19);
  const moai = valid.find((r) => r.subject === "moai");
  const avg = (sel) => {
    let s = 0, n = 0;
    for (const r of valid) { const v = sel(r); if (typeof v === "number" && Number.isFinite(v)) { s += v; n += 1; } }
    return n ? Math.round((s / n) * 1000) / 1000 : null;
  };
  const busySpeckle = avg((r) => r.busy?.speckle);
  const e19Speckle = avg((r) => r.e19?.speckle);
  const busyOffPal = Math.round(avg((r) => r.busy?.offPalette) ?? 0);
  const busyDistinct = avg((r) => r.busy?.distinct);
  const e19Distinct = avg((r) => r.e19?.distinct);

  const routing = await readJson(join(HERE, "form-routing.json"));
  const r = routing
    ? `form IoU avg ${routing.averages.formIoU.before}→${routing.averages.formIoU.after} (${routing.averages.formIoU.delta >= 0 ? "+" : ""}${routing.averages.formIoU.delta}); ` +
      `occupancy ${routing.occupancy.before}→${routing.occupancy.after} (${routing.occupancy.delta}); solids de-thickened by ${routing.occupancy.solidsDropped} cells. ` +
      `Recovered: ${routing.recovered.join(", ")}; traded: ${routing.traded.join(", ")}; kept (thin): ${routing.kept.join(", ")}.`
    : "form-routing.json absent.";

  return {
    prune: moai
      ? `moai stray ${moai.stray.before.strayCount}→${moai.stray.after.strayCount}, largest-frac ${moai.stray.before.largestFraction}→${moai.stray.after.largestFraction}, components ${moai.stray.before.components}→${moai.stray.after.components} — the TRELLIS duplicate masses dropped. The other 6 subjects are already single-mass (no-op).`
      : "moai row missing.",
    materials: `the busy textured blocks (coral_brain/mycelium/quartz_ore) are gone; off-palette avg ${busyOffPal}→0; speckle avg ${busySpeckle}→${e19Speckle}; distinct avg ${busyDistinct}→${e19Distinct}. Variance-aware nearestFlat + varCeiling 1200 + keepFloor dual-gate + true-axis gradient banding.`,
    routing: r,
  };
}

/** Copy worst-case before/after frames to pr/assets/frames/ for the E-12 handoff. */
async function copyFrames() {
  await mkdir(FRAMES_DIR, { recursive: true });
  const copied = [];
  for (const subj of WORST) {
    const before = join(SEG_DIR, subj, "render-3q.png");
    const after = join(OUT_DIR, subj, "render-3q.png");
    if (existsSync(before)) {
      await copyFile(before, join(FRAMES_DIR, `e19-${subj}-before.png`));
      copied.push(`e19-${subj}-before.png`);
    }
    if (existsSync(after)) {
      await copyFile(after, join(FRAMES_DIR, `e19-${subj}-after.png`));
      copied.push(`e19-${subj}-after.png`);
    }
  }
  console.error(`frames: copied ${copied.length} → pr/assets/frames/`);
}

/** Write e19-cleanup.{md,json} from rows. */
async function emit(rows, { scale, marginals }) {
  const cleanupRows = rows
    .filter((r) => r && r.e19)
    .map((r) => ({ subject: r.subject, busy: r.busy, intermediate: r.intermediate, e19: r.e19 }));
  const { md, json } = assembleCleanup({ rows: cleanupRows, marginals, scale });
  await writeFile(join(HERE, "e19-cleanup.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(HERE, "e19-cleanup.md"), md);
  console.error(`wrote e19-cleanup.{md,json} (${cleanupRows.length} subjects)`);
}

/** The live GL/host sweep. */
async function runLive({ scale }) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  await mkdir(OUT_DIR, { recursive: true });
  const rows = [];
  for (const subj of SUBJECTS) {
    try {
      rows.push(await buildSubject(subj, { scale, renderArtifact }));
    } catch (err) {
      console.error(`${subj.key}: FAILED — ${err?.message || err}`);
      rows.push({ subject: subj.key, note: `build failed: ${err?.message || err}` });
    }
  }
  return rows;
}

/** --offline: rebuild the report from committed per-subject summary.json (no GL). */
async function regenerateOffline({ scale }) {
  const rows = [];
  for (const subj of SUBJECTS) {
    const j = await readJson(join(OUT_DIR, subj.key, "summary.json"));
    rows.push(j || { subject: subj.key, note: "no summary.json" });
  }
  const marginals = await buildMarginals(rows);
  await emit(rows, { scale, marginals });
}

async function main() {
  const argv = process.argv.slice(2);
  const offline = argv.includes("--offline");
  const scaleArg = argv.find((a) => /^\d+$/.test(a));
  const scale = scaleArg ? Number(scaleArg) : DEFAULT_SCALE;
  if (offline) {
    await regenerateOffline({ scale });
    return;
  }
  const rows = await runLive({ scale });
  const marginals = await buildMarginals(rows);
  await emit(rows, { scale, marginals });
  await copyFrames();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("e19-build failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { buildSubject, runLive };
