// GLB-voxel build runner (E-16 T-051-01) — the image→3D arm, rendered + judged on real koi + heart.
//
// Voxelize each TRELLIS GLB to occupancy (T-050-01), color every cell value-true from the GLB's own
// surface texture (T-051-01 core), compile a standard DesignArtifact, render the 3/4 still, and JUDGE
// it deterministically by silhouette IoU against the GLB's OWN silhouette (T-048-01) at the same camera.
// This is the head-to-head number vs the text→JSON sculpture builds.
//
// GL + HOST-TOOL, NOT in `npm test`. WebP decode shells out to `dwebp` (installed; never in CI) — the
// only impurity, injected into glbVoxelBuild as `decodeTexture`. The GLBs are gitignored local
// artifacts; an absent GLB is skipped, not an error (mirrors voxelize-sanity.mjs).
//
// Usage:  node benchmarks/sculpture/glb-voxel-run.mjs [scale]
// Writes  benchmarks/sculpture/glb-voxel/<subj>/{artifact.json, render-3q.png, summary.json}
//   and   benchmarks/sculpture/glb-voxel/summary.md

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import { glbVoxelBuild } from "../../src/form/glb-voxel-build.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { DEFAULT_SCALE, SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import {
  extractSilhouette,
  normalizeSilhouette,
  iou,
  RENDER_BG,
} from "../../src/form/form-fidelity.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "glb-voxel");
const subjects = ["koi", "heart"];
const scale = Number(process.argv[2] ?? DEFAULT_SCALE);

/** Run a child process to completion; reject on non-zero exit. */
function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (c) => (err += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}: ${err.slice(0, 200)}`));
    });
  });
}

let tmpSeq = 0;
/**
 * Decode a GLB baseColor image to RGBA. WebP → PNG via `dwebp` (host tool), then pngjs via decodeImage.
 * PNG/JPEG pass straight through. The only impure edge; injected into glbVoxelBuild.
 */
async function decodeTexture({ data, mimeType }) {
  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    // decodeImage reads a path; write to a temp file with the right extension.
    const ext = mimeType === "image/png" ? "png" : "jpg";
    const p = join(tmpdir(), `glbtex-${process.pid}-${tmpSeq++}.${ext}`);
    await writeFile(p, data);
    try {
      return await decodeImage(p);
    } finally {
      await rm(p, { force: true });
    }
  }
  // WebP (the TRELLIS case): dwebp <in.webp> -o <out.png>, then decode the PNG.
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
  const rNorm = normalizeSilhouette(rSil);
  const gNorm = normalizeSilhouette(gSil);
  return Math.round(iou(rNorm, gNorm) * 1000) / 1000;
}

async function main() {
  // Lazy GL import — only a live run pulls prismarine/GL into the process.
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const { renderSummary } = await import("../../src/render-tool.mjs");

  await mkdir(OUT_DIR, { recursive: true });
  const rows = [];

  for (const subj of subjects) {
    const glbPath = join(HERE, "glb", `${subj}.glb`);
    if (!existsSync(glbPath)) {
      console.log(`${subj}: skipped (${glbPath} absent / gitignored)`);
      rows.push({ subj, skipped: true });
      continue;
    }
    const dir = join(OUT_DIR, subj);
    await mkdir(dir, { recursive: true });
    const glbBytes = await readFile(glbPath);

    const t0 = Date.now();
    const artifact = await glbVoxelBuild(glbBytes, {
      scale,
      decodeTexture,
      metadata: { trial_id: `${subj}-glb-voxel` },
      style: { name: "glb-voxel", rationale: `Voxelized ${subj} GLB; cells colored value-true from the GLB surface.` },
    });
    assertArtifact(artifact); // fail loud if the gate rejects
    await writeFile(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");

    const renderPath = join(dir, "render-3q.png");
    const report = await renderArtifact(artifact, { outPath: renderPath, view: SCULPTURE_VIEW_3Q });
    const sum = renderSummary(report);
    const iouScore = await judgeIoU(renderPath, glbBytes);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);

    const manifest = artifact.palette.manifest;
    const summary = {
      subject: subj,
      scale,
      blocks: sum.placed,
      unmapped: sum.unmapped,
      bounds: sum.bounds,
      manifestSize: manifest.length,
      view3q: SCULPTURE_VIEW_3Q,
      silhouetteIoU: iouScore,
      durationSec: Number(secs),
    };
    await writeFile(join(dir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
    rows.push(summary);
    console.log(`${subj}: ${sum.placed} blocks, ${manifest.length} blocks in manifest, IoU ${iouScore} (${secs}s)`);
  }

  // Roll up a small markdown table (the durable, committed record; renders are gitignored).
  const md = [
    "# GLB-voxel builds (E-16 T-051-01)",
    "",
    "Real koi + heart GLBs → occupancy (T-050-01) → value-true color (T-051-01) → DesignArtifact,",
    "rendered at SCULPTURE_VIEW_3Q and judged by silhouette IoU vs the GLB's own silhouette (T-048-01).",
    "",
    "| subject | scale | blocks | manifest | silhouette IoU | sec |",
    "| ------- | ----- | ------ | -------- | -------------- | --- |",
    ...rows.map((r) =>
      r.skipped
        ? `| ${r.subj} | — | — | — | — | (skipped) |`
        : `| ${r.subject} | ${r.scale} | ${r.blocks} | ${r.manifestSize} | ${r.silhouetteIoU} | ${r.durationSec} |`,
    ),
    "",
  ].join("\n");
  await writeFile(join(OUT_DIR, "summary.md"), md);
  console.log(`\nwrote ${join("benchmarks/sculpture/glb-voxel", "summary.md")}`);
}

main().catch((err) => {
  console.error("glb-voxel run failed:\n  " + (err?.message || err));
  process.exit(1);
});
