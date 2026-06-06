// GLB-voxel BREADTH sweep — E-17 rung R1 (T-054-01, story S-054, epic E-17).
//
// E-16 proved voxelizing a TRELLIS image→3D mesh is the decisive FORM win, but on koi + heart only
// (koi +0.150, heart +0.421 silhouette IoU vs text→JSON). This harness GENERALIZES that exact proven
// path to ALL 7 E-13 sculptural subjects with GLBs: for each, voxelize → value-true color from the GLB's
// own surface texture → compile a DesignArtifact → render @ 3/4 → score silhouette IoU vs the GLB. The
// roll-up is the R1 ablation table — the first rung of the E-17 consolidation sweep.
//
// REUSE, NOT REIMPLEMENTATION: the pure core is `glbVoxelBuild` (src/form/glb-voxel-build.mjs), unchanged
// from E-16. This runner only (a) loops it over 7 subjects and (b) emits glb-voxel/r1.{md,json}. The thin
// impure glue (dwebp WebP decode, the silhouette IoU judge) is the SAME as glb-voxel-run.mjs — kept local
// to the harness, the established split (reuse pure src/, each harness owns its render/host glue).
//
// SWORD EXCLUDED — a finding, not a gap: TRELLIS 500'd on the thin blade (3 attempts, no GLB). The sweep
// is 7 subjects; see glb/README.md. GL + host-tool (dwebp), NOT in `npm test`. An absent GLB is skipped
// (or, with --regen-missing, TRELLIS-regenerated from its concept.png), never a hard error.
//
//   node benchmarks/sculpture/glb-voxel-breadth.mjs [scale]                 # live sweep, 7 subjects
//   node benchmarks/sculpture/glb-voxel-breadth.mjs --offline               # rebuild r1.{md,json} from summaries
//   node benchmarks/sculpture/glb-voxel-breadth.mjs --regen-missing [scale] # also TRELLIS-regen any absent GLB
//
// Writes glb-voxel/<subject>/{artifact.json, render-3q.png, summary.json} and glb-voxel/r1.{md,json}.

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import { glbVoxelBuild, paletteFromManifest } from "../../src/form/glb-voxel-build.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { DEFAULT_SCALE, SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
import { GLB_VOXEL_METHOD_ID } from "../../src/config.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { extractSilhouette, normalizeSilhouette, iou, RENDER_BG } from "../../src/form/form-fidelity.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLB_DIR = join(HERE, "glb");
const OUT_DIR = join(HERE, "glb-voxel");
const RUNS_DIR = join(HERE, "runs");

// The 7 subjects with GLBs (E-13 sculptural set minus sword). `key` is the output-dir / table-row name;
// `glb` is its file under glb/; `run` is the concept-image dir (AC #3: --regen-missing source). The GLB
// basename equals `key` for all 7, but the mapping is spelled out so it survives any rename.
// `007-sword` is intentionally absent — TRELLIS 500'd on the thin blade (glb/README.md).
const SUBJECTS = [
  { key: "dancing-man", glb: "dancing-man.glb", run: "002-vConcept-a-dancing-man" },
  { key: "moai", glb: "moai.glb", run: "003-vConcept-a-moai-statue" },
  { key: "pineapple", glb: "pineapple.glb", run: "004-vConcept-a-pineapple" },
  { key: "bow-and-arrow", glb: "bow-and-arrow.glb", run: "005-vConcept-a-bow-and-arrow" },
  { key: "heart", glb: "heart.glb", run: "006-vConcept-an-anatomically-correct-human-heart" },
  { key: "mushroom", glb: "mushroom.glb", run: "008-vConcept-a-mushroom" },
  { key: "koi", glb: "koi.glb", run: "009-vConcept-a-koi-fish" },
];

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
 * decodeImage. PNG/JPEG pass straight through. The only impure edge; injected into glbVoxelBuild.
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
  return Math.round(iou(normalizeSilhouette(rSil), normalizeSilhouette(gSil)) * 1000) / 1000;
}

/**
 * AC #3 safety branch (only reached with --regen-missing): regenerate an absent GLB from its concept.png
 * via TRELLIS. Shells to trellis-glb.mjs, which reads MODAL_ENDPOINT_URL from the gitignored .env and
 * NEVER prints it (inherited via the child's env). Returns true if the GLB now exists.
 */
async function regenMissingGlb(subj, glbPath) {
  const concept = join(RUNS_DIR, subj.run, "concept.png");
  if (!existsSync(concept)) {
    throw new Error(`regen ${subj.key}: concept image not found at runs/${subj.run}/concept.png`);
  }
  await run("node", [join(HERE, "trellis-glb.mjs"), concept, glbPath]);
  return existsSync(glbPath);
}

/**
 * PURE: rows[] → { md, json } for the R1 ablation table. md is the human record (the AC columns plus
 * scale/blocks/manifest for context); json is the machine record with method/view provenance.
 */
function buildR1(rows, { scale = DEFAULT_SCALE } = {}) {
  const live = rows.filter((r) => !r.skipped);
  const md = [
    "# R1 — GLB-voxel builds across the 7-subject sweep (E-17 T-054-01)",
    "",
    "Each TRELLIS image→3D GLB → occupancy (T-050-01) → value-true color from its own surface texture",
    "(T-051-01) → DesignArtifact, rendered at SCULPTURE_VIEW_3Q and scored by silhouette IoU vs the GLB's",
    "own silhouette (T-048-01). This is the first ablation rung; `glbVoxelBuild` is the E-16 core, unchanged.",
    "",
    `Subjects: ${live.length} (sword excluded — TRELLIS 500'd on the thin blade; see glb/README.md).`,
    "",
    "| subject | occupancy | form IoU vs GLB | scale | blocks | manifest |",
    "| ------- | --------- | --------------- | ----- | ------ | -------- |",
    ...rows.map((r) =>
      r.skipped
        ? `| ${r.subject} | — | — | — | — | — | _(GLB absent — ${r.note ?? "skipped"})_`
        : `| ${r.subject} | ${r.occupancy} | ${r.silhouetteIoU} | ${r.scale} | ${r.blocks} | ${r.manifestSize} |` +
          (r.regenerated ? " _(GLB regenerated)_" : ""),
    ),
    "",
  ].join("\n");

  const json = {
    schema: "glb-voxel-r1/v1",
    rung: "R1",
    method: GLB_VOXEL_METHOD_ID,
    view: SCULPTURE_VIEW_3Q,
    scale,
    metric: "silhouette-iou (GLB 3-D target = the build's OWN source mesh)",
    generatedFrom: "benchmarks/sculpture/glb/<subject>.glb via glbVoxelBuild (src/form/glb-voxel-build.mjs)",
    note:
      "E-17 rung R1: the E-16 GLB-voxel build (koi+heart) generalized to all 7 subjects with GLBs. occupancy = " +
      "artifact.placements.length (one voxel per occupied cell). formIoU = full-build 3/4 render silhouette vs the " +
      "whole GLB silhouette at SCULPTURE_VIEW_3Q, normalized (translation + uniform scale removed; rotation NOT " +
      "corrected — but the build is voxelized FROM this GLB, so alignment is as good as it gets). Single 3/4 view; " +
      "silhouette ≠ volume. Sword excluded (thin-subject TRELLIS failure).",
    subjects: rows,
  };
  return { md, json };
}

/** The live GL/host sweep: voxel-build every subject, render, judge, write per-subject artifacts. */
async function runBreadth({ scale = DEFAULT_SCALE, regenMissing = false } = {}) {
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
    // Candidate palette = the DESIGN-DOC manifest (the model's deliberate few blocks), NOT the full
    // 305-block table — the fix for palette bloat / speckle. Snap each GLB-surface color to the nearest
    // of just those blocks.
    const designManifest = JSON.parse(await readFile(join(RUNS_DIR, subj.run, "artifact.json"), "utf8")).palette.manifest;
    const palette = paletteFromManifest(designManifest);
    // E-18 T-058-02: snap within the AUGMENTED design-doc palette (design-doc ∪ ≤K=2 gated secondary,
    // T-058-03) — canonical across every build path, NOT the full 305-block table or a texture median-cut.
    const artifact = await glbVoxelBuild(glbBytes, {
      scale,
      decodeTexture,
      palette,
      augment: true,
      metadata: { trial_id: `${subj.key}-glb-voxel` },
      style: { name: "glb-voxel", rationale: `Voxelized ${subj.key} GLB; cells colored value-true from the GLB surface, snapped to the augmented design-doc palette (${palette.length} design-doc blocks + ≤2 gated secondary).` },
    });
    assertArtifact(artifact); // fail loud if the gate rejects
    await writeFile(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");

    const renderPath = join(dir, "render-3q.png");
    const report = await renderArtifact(artifact, { outPath: renderPath, view: SCULPTURE_VIEW_3Q });
    const sum = renderSummary(report);
    // Field name kept as `silhouetteIoU` (not `formIoU`): glb-voxel-surgical.mjs reads it for its build
    // baseline cross-reference. Same quantity; the r1 column LABELS it "form IoU vs GLB".
    const silhouetteIoU = await judgeIoU(renderPath, glbBytes);
    const secs = Number(((Date.now() - t0) / 1000).toFixed(1));

    const summary = {
      subject: subj.key,
      scale,
      occupancy: artifact.placements.length, // == occupied cells (one voxel each)
      blocks: sum.placed,
      unmapped: sum.unmapped,
      bounds: sum.bounds,
      manifestSize: artifact.palette.manifest.length,
      view3q: SCULPTURE_VIEW_3Q,
      silhouetteIoU,
      durationSec: secs,
      ...(regenerated ? { regenerated: true } : {}),
    };
    await writeFile(join(dir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
    rows.push(summary);
    console.error(
      `${subj.key}: occ ${summary.occupancy}, ${sum.placed} blocks, manifest ${summary.manifestSize}, ` +
        `form IoU ${silhouetteIoU}${regenerated ? " (regen)" : ""} (${secs}s)`,
    );
  }
  return rows;
}

/** Write r1.{md,json} from rows. */
async function emit(rows, opts) {
  await mkdir(OUT_DIR, { recursive: true });
  const { md, json } = buildR1(rows, opts);
  await writeFile(join(OUT_DIR, "r1.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "r1.md"), md);
  console.error(`wrote glb-voxel/r1.{md,json} (${rows.filter((r) => !r.skipped).length}/${rows.length} subjects)`);
}

/** --offline: rebuild r1.{md,json} from the committed per-subject summaries (no GL, no network). */
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
  await emit(await runBreadth({ scale, regenMissing }), { scale });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("glb-voxel-breadth failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { SUBJECTS, buildR1, runBreadth };
