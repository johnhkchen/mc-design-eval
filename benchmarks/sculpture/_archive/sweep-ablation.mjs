// E-17 ablation COLLECTOR — the R0–R3 data spine (T-056-01, story S-056, epic E-17).
//
// The terminal data step of E-17: take all 7 subjects up ONE ladder and collect the SAME three metrics at
// every rung into one structured record the scorecard (T-057-01) reads.
//
//   R0 text→JSON        runs/<run>/artifact.json
//   R1 glb-voxel        glb-voxel/<subj>/                 (T-054-01)
//   R2 +material-clean  glb-voxel-clean/<subj>/           (T-055-01)
//   R3 +surgical        glb-voxel-surgical-sweep/<subj>/  (this story, glb-voxel-surgical-sweep.mjs)
//
// METRICS (same at every rung):
//   - form IoU vs the GLB  — READ from each rung's committed summary (R1 silhouetteIoU, R2 formIoUAfter,
//     R3 wholeObjectIoUAfter), so the table can never drift from the rung records. R0 alone has no GLB IoU
//     on disk, so it is the ONLY render here: render the R0 artifact @ 3/4 and judge silhouette IoU vs the
//     GLB (the same kernel R1–R3 use). normalizeSilhouette removes translation + uniform scale, so the
//     text→JSON build (different coords than the mesh) is comparable — the honest cross-target floor.
//   - value ΔE  — palette cleanliness via value-gate.mjs: realizedPaletteFromArtifact(artifact) scored
//     against the GLB's OWN canonical texture palette (extractTexturePalette, the E-10 extractor),
//     computed once per subject and used for all four rungs. Lower = closer to the true material values.
//   - verdict  — form IoU rung-over-rung (assembleAblation → rungVerdict), with the marginal Δ.
//
// REUSE: assembleAblation/RUNGS (pure src/), valueGate/realizedPaletteFromArtifact (E-14),
// extractTexturePalette (R2 core), the silhouette kernel (E-13/E-16), SUBJECTS (R1 runner). The only impure
// edges are the R0 render (GL) and the dwebp WebP decode (host tool) — neither in `npm test`. An absent
// asset is recorded as a null cell, never a hard error (AC #3: nothing dropped silently).
//
//   node benchmarks/sculpture/sweep-ablation.mjs            # live: collect R0–R3 for 7 subjects
//   node benchmarks/sculpture/sweep-ablation.mjs --offline  # rebuild from per-subject ablation.json
//
// Writes sweep-ablation/<subj>/ablation.json and benchmarks/sculpture/sweep-ablation.{md,json}.

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import { assembleAblation, RUNGS } from "../../src/form/ablation.mjs";
import { valueGate, realizedPaletteFromArtifact } from "../../src/color/value-gate.mjs";
import { extractTexturePalette } from "../../src/form/material-clean.mjs";
import { parseGlbColoredSurface } from "../../src/form/glb-mesh.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { extractSilhouette, normalizeSilhouette, iou, RENDER_BG } from "../../src/form/form-fidelity.mjs";
import { DEFAULT_SCALE, SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
import { SUBJECTS } from "./glb-voxel-breadth.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLB_DIR = join(HERE, "glb");
const RUNS_DIR = join(HERE, "runs");
const R1_DIR = join(HERE, "glb-voxel");
const R2_DIR = join(HERE, "glb-voxel-clean");
const R3_DIR = join(HERE, "glb-voxel-surgical-sweep");
const OUT_DIR = join(HERE, "sweep-ablation");

const round2 = (n) => Math.round(n * 100) / 100;

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
    const p = join(tmpdir(), `ablate-tex-${process.pid}-${tmpSeq++}.${ext}`);
    await writeFile(p, data);
    try {
      return await decodeImage(p);
    } finally {
      await rm(p, { force: true });
    }
  }
  const inP = join(tmpdir(), `ablate-tex-${process.pid}-${tmpSeq}.webp`);
  const outP = join(tmpdir(), `ablate-tex-${process.pid}-${tmpSeq++}.png`);
  await writeFile(inP, data);
  try {
    await run("dwebp", [inP, "-o", outP]);
    return await decodeImage(outP);
  } finally {
    await rm(inP, { force: true });
    await rm(outP, { force: true });
  }
}

/** Silhouette IoU of a render PNG vs the GLB's own silhouette at SCULPTURE_VIEW_3Q (only used for R0). */
async function judgeIoU(renderPath, glbBytes) {
  const renderImg = await decodeImage(renderPath);
  const rSil = extractSilhouette(renderImg, RENDER_BG);
  const mesh = loadMeshFromGlb(glbBytes);
  const gSil = rasterizeSilhouette(mesh, { view: SCULPTURE_VIEW_3Q });
  return Math.round(iou(normalizeSilhouette(rSil), normalizeSilhouette(gSil)) * 1000) / 1000;
}

/** Value ΔE: realized palette of `artifact` vs the GLB's canonical texture palette. null on any failure. */
function valueDeltaEOf(artifact, refClusters) {
  try {
    const realized = realizedPaletteFromArtifact(artifact);
    return { v: round2(valueGate(realized, refClusters).meanDeltaE), note: null };
  } catch (e) {
    return { v: null, note: `value ΔE unresolved: ${e.message.slice(0, 80)}` };
  }
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

/** The four rung artifact paths + the committed form IoU source for R1–R3. */
function rungSources(subj) {
  return {
    R0: { artifact: join(RUNS_DIR, subj.run, "artifact.json"), summary: null, iouKey: null },
    R1: { artifact: join(R1_DIR, subj.key, "artifact.json"), summary: join(R1_DIR, subj.key, "summary.json"), iouKey: "silhouetteIoU" },
    R2: { artifact: join(R2_DIR, subj.key, "artifact.json"), summary: join(R2_DIR, subj.key, "summary.json"), iouKey: "formIoUAfter" },
    R3: { artifact: join(R3_DIR, subj.key, "artifact.json"), summary: join(R3_DIR, subj.key, "summary.json"), iouKey: "wholeObjectIoUAfter" },
  };
}

/** Collect the four rung cells for one subject (the only GL render is R0). Returns {subject, cells}. */
async function collectSubject(subj, { renderArtifact }) {
  const glbPath = join(GLB_DIR, subj.glb);
  const cells = {};
  // The shared reference: the GLB's own canonical material palette (or null if the GLB/texture is absent).
  let refClusters = null;
  if (existsSync(glbPath)) {
    try {
      const surface = parseGlbColoredSurface(await readFile(glbPath));
      if (surface.baseColor) {
        const texture = await decodeTexture(surface.baseColor);
        refClusters = extractTexturePalette(texture).snapPalette;
      }
    } catch (e) {
      console.error(`${subj.key}: texture palette unavailable (${e.message.slice(0, 60)})`);
    }
  }

  const src = rungSources(subj);
  const dir = join(OUT_DIR, subj.key);
  await mkdir(dir, { recursive: true });

  for (const { id } of RUNGS) {
    const s = src[id];
    const artifact = await readJson(s.artifact);
    if (!artifact) {
      cells[id] = { formIoU: null, valueDeltaE: null, note: `${id} artifact absent` };
      continue;
    }
    // form IoU: read committed for R1–R3; render+judge for R0 (the only gap on disk).
    let formIoU = null;
    if (s.summary) {
      const sum = await readJson(s.summary);
      formIoU = sum && typeof sum[s.iouKey] === "number" ? sum[s.iouKey] : null;
    } else if (existsSync(glbPath)) {
      const renderPath = join(dir, `r0-render-3q.png`);
      await renderArtifact(artifact, { outPath: renderPath, view: SCULPTURE_VIEW_3Q });
      formIoU = await judgeIoU(renderPath, await readFile(glbPath));
    }
    // value ΔE: realized palette vs the GLB canonical palette (null if no reference).
    const { v, note } = refClusters ? valueDeltaEOf(artifact, refClusters) : { v: null, note: "no GLB reference" };
    cells[id] = { formIoU, valueDeltaE: v, ...(note ? { note } : {}) };
  }

  await writeFile(join(dir, "ablation.json"), JSON.stringify({ subject: subj.key, cells }, null, 2) + "\n");
  return { subject: subj.key, cells };
}

/** {subject, cells:{R0:{…}}} → the flat rows assembleAblation consumes. */
function toRows(perSubject) {
  const rows = [];
  for (const { subject, cells } of perSubject) {
    for (const { id } of RUNGS) {
      const c = cells[id] || {};
      rows.push({ subject, rung: id, formIoU: c.formIoU ?? null, valueDeltaE: c.valueDeltaE ?? null, note: c.note });
    }
  }
  return rows;
}

async function emit(perSubject, { scale }) {
  await mkdir(OUT_DIR, { recursive: true });
  const { md, json } = assembleAblation(toRows(perSubject), { scale });
  await writeFile(join(HERE, "sweep-ablation.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(HERE, "sweep-ablation.md"), md);
  console.error(`wrote sweep-ablation.{md,json} (${json.subjects.length} subjects × ${RUNGS.length} rungs)`);
}

/** --offline: rebuild from committed per-subject ablation.json (no GL, no host tool). */
async function regenerateOffline({ scale }) {
  const perSubject = [];
  for (const subj of SUBJECTS) {
    const p = join(OUT_DIR, subj.key, "ablation.json");
    const j = await readJson(p);
    if (j) perSubject.push(j);
    else perSubject.push({ subject: subj.key, cells: {} });
  }
  await emit(perSubject, { scale });
}

async function collectLive({ scale }) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  await mkdir(OUT_DIR, { recursive: true });
  const perSubject = [];
  for (const subj of SUBJECTS) {
    const row = await collectSubject(subj, { renderArtifact });
    perSubject.push(row);
    const c = row.cells;
    console.error(
      `${subj.key}: formIoU ${[c.R0, c.R1, c.R2, c.R3].map((x) => (x && x.formIoU != null ? x.formIoU : "—")).join("/")} ` +
        `· ΔE ${[c.R0, c.R1, c.R2, c.R3].map((x) => (x && x.valueDeltaE != null ? x.valueDeltaE : "—")).join("/")}`,
    );
  }
  return perSubject;
}

async function main() {
  const argv = process.argv.slice(2);
  const scaleArg = argv.find((a) => /^\d+$/.test(a));
  const scale = scaleArg ? Number(scaleArg) : DEFAULT_SCALE;
  if (argv.includes("--offline")) {
    await regenerateOffline({ scale });
    return;
  }
  await emit(await collectLive({ scale }), { scale });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("sweep-ablation failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { collectSubject, toRows };
