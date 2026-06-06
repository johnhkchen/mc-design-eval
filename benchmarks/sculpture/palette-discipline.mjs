// PALETTE-DISCIPLINE verification sweep — E-18 T-058-02 (story S-058, epic E-18).
//
// The GUARANTEE record. The E-18 fix locked the GLB-voxel colour picker to the DESIGN-DOC palette (the few
// blocks the model chose) instead of the full 305-block table or a noisy-texture median-cut — and T-058-03
// added a STRICTLY GATED secondary (≤K=2 table blocks for genuine under-served texture colours). T-058-02
// makes that discipline a guarantee across every build path and proves it here: for all 7 subjects,
//   • off-(augmented-palette) count = 0   — no block outside design-doc ∪ ≤2 gated secondary,
//   • distinct-block count ≤ design-doc size + 2   — no bloat,
//   • the before→after DROP vs the PRE-FIX full-table snap (e.g. heart 91 → ≤7)   — the headline,
//   • form IoU INVARIANT   — palette only recolours; it never moves a voxel (same occupancy → same form).
// The record IS the guard: each subject is run through `assertPaletteDiscipline`, which THROWS (the run
// fails loudly) on any off-(augmented) block or a distinct count over the design-doc + K cap.
//
// GL-FREE BY DESIGN: off-palette and distinct depend only on the placed block KEYS (voxelize → decode
// texture → palette snap), NOT on rendering. Form IoU is recolour-invariant, so it is recorded as a
// cross-reference to the committed R1 build's silhouetteIoU rather than re-rendered. So this sweep needs the
// GLBs + dwebp (both host-only, gitignored) but NO headless WebGL — fast and robust. NOT in `npm test`.
//
// REUSE, NOT REIMPLEMENTATION: the pure cores are glbVoxelBuild / paletteFromManifest /
// assertPaletteDiscipline (glb-voxel-build.mjs), augmentPalette (palette-augment.mjs), blockPaletteFromTable
// (the pre-fix full-table candidate set), offPaletteCount (material-segment.mjs). The SUBJECTS list +
// dwebp glue are the SAME as the R1 runner — kept local, the established split.
//
//   node benchmarks/sculpture/palette-discipline.mjs [scale]   # live verification, 7 subjects (GLBs+dwebp)
//   node benchmarks/sculpture/palette-discipline.mjs --offline # rebuild palette-discipline.{md,json}
//   node benchmarks/sculpture/palette-discipline.mjs --regen-missing [scale]
//
// Writes palette-discipline/<subject>/summary.json and palette-discipline.{md,json}.

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import {
  glbVoxelBuild,
  paletteFromManifest,
  blockPaletteFromTable,
  assertPaletteDiscipline,
} from "../../src/form/glb-voxel-build.mjs";
import { augmentPalette } from "../../src/form/palette-augment.mjs";
import { offPaletteCount } from "../../src/form/material-segment.mjs";
import { parseGlbColoredSurface } from "../../src/form/glb-mesh.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { DEFAULT_SCALE } from "../../src/sculpture.mjs";
import { GLB_VOXEL_METHOD_ID } from "../../src/config.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { SUBJECTS } from "./glb-voxel-breadth.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLB_DIR = join(HERE, "glb");
const RUNS_DIR = join(HERE, "runs");
const R1_DIR = join(HERE, "glb-voxel"); // committed R1 build (form-IoU cross-reference)
const OUT_DIR = join(HERE, "palette-discipline");

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
    const p = join(tmpdir(), `pd-tex-${process.pid}-${tmpSeq++}.${ext}`);
    await writeFile(p, data);
    try {
      return await decodeImage(p);
    } finally {
      await rm(p, { force: true });
    }
  }
  const inP = join(tmpdir(), `pd-tex-${process.pid}-${tmpSeq}.webp`);
  const outP = join(tmpdir(), `pd-tex-${process.pid}-${tmpSeq++}.png`);
  await writeFile(inP, data);
  try {
    await run("dwebp", [inP, "-o", outP]);
    return await decodeImage(outP);
  } finally {
    await rm(inP, { force: true });
    await rm(outP, { force: true });
  }
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

/** The committed R1 build's silhouette IoU (recolour-invariant form reference), if present. */
async function r1FormIoU(key) {
  const s = await readJson(join(R1_DIR, key, "summary.json"));
  return s && typeof s.silhouetteIoU === "number" ? s.silhouetteIoU : null;
}

/**
 * Verify one subject. Build TWICE over the SAME voxelization: once with the PRE-FIX full-table candidate set
 * (the bloat we moved away from — the "before" distinct count) and once with the AUGMENTED design-doc palette
 * (the "after"). Assert discipline on the after build (off-(aug) = 0, distinct ≤ design-doc + K). PURE except
 * the injected decodeTexture; no GL.
 */
async function verifySubject(subj, { scale }) {
  const glbPath = join(GLB_DIR, subj.glb);
  const glbBytes = await readFile(glbPath);

  const designManifest = JSON.parse(await readFile(join(RUNS_DIR, subj.run, "artifact.json"), "utf8")).palette.manifest;
  const prim = paletteFromManifest(designManifest);

  // The augmented palette is computed from the decoded texture; glbVoxelBuild decodes internally too, but we
  // need `aug` here for the off-palette reference + the guard, so decode once and reuse for augmentation.
  const surface = parseGlbColoredSurface(glbBytes);
  if (!surface.baseColor) throw new Error(`${subj.key}: GLB has no baseColor texture`);
  const texture = await decodeTexture(surface.baseColor);
  const aug = augmentPalette(prim, texture);
  const secondaryCount = aug.length - prim.length;

  // AFTER: the canonical augmented design-doc build (what every path now produces).
  const after = await glbVoxelBuild(glbBytes, { scale, decodeTexture, palette: prim, augment: true });
  assertArtifact(after);
  // The guard — fails the whole run loudly on any off-(augmented) block or a distinct count over the cap.
  assertPaletteDiscipline(after, aug, { cap: prim.length + 2 });
  const afterKeys = keysFromArtifact(after);
  const distinctAfter = after.palette.manifest.length;
  const offPaletteAfter = offPaletteCount(afterKeys, aug); // 0 by construction; recorded for the AC

  // BEFORE: the pre-fix full-table snap over the SAME GLB/scale (same occupancy) → the bloat distinct count.
  const before = await glbVoxelBuild(glbBytes, { scale, decodeTexture, palette: blockPaletteFromTable() });
  assertArtifact(before);
  const distinctBefore = before.palette.manifest.length; // the "91"-style pre-fix number
  const offPaletteBeforeVsAug = offPaletteCount(keysFromArtifact(before), aug); // how leaky the full-table snap was

  return {
    subject: subj.key,
    scale,
    occupancy: after.placements.length,
    designDocSize: prim.length,
    secondaryCount,
    cap: prim.length + 2,
    distinctBefore, // pre-fix full-table snap
    distinctAfter, // augmented design-doc snap
    offPaletteAfter, // = 0 (the leakage directive)
    offPaletteBeforeVsAug, // the pre-fix leakage measured against the augmented palette (context)
    formIoURef: await r1FormIoU(subj.key), // recolour-invariant (same occupancy as the committed R1 build)
    pass: offPaletteAfter === 0 && distinctAfter <= prim.length + 2,
  };
}

/**
 * PURE: rows[] → { md, json } for the palette-discipline guarantee record. The headline: every subject's
 * off-(augmented) = 0, distinct ≤ design-doc + 2, and the before→after drop (full-table → augmented).
 */
function buildDiscipline(rows, { scale = DEFAULT_SCALE } = {}) {
  const live = rows.filter((r) => !r.skipped);
  const maxDrop = live.reduce(
    (best, r) => (r.distinctBefore - r.distinctAfter > best.drop ? { subj: r.subject, drop: r.distinctBefore - r.distinctAfter, b: r.distinctBefore, a: r.distinctAfter } : best),
    { subj: null, drop: -Infinity, b: 0, a: 0 },
  );
  const allClean = live.length > 0 && live.every((r) => r.offPaletteAfter === 0);
  const allCapped = live.length > 0 && live.every((r) => r.distinctAfter <= r.cap);
  const md = [
    "# Palette discipline — the E-18 guarantee across the 7-subject sweep (T-058-02)",
    "",
    "Every color-assigning GLB-voxel build path now snaps within the **augmented design-doc palette** — the",
    "design-doc manifest (the few blocks the model deliberately chose) ∪ **≤K=2 gated secondary** table blocks",
    "(T-058-03), NOT the full 305-block table or a noisy-texture median-cut. This record proves the guarantee:",
    "for each subject the build is run through `assertPaletteDiscipline` (which THROWS on any off-(augmented)",
    "block or a distinct count over design-doc + K), and is compared to the PRE-FIX full-table snap over the",
    "same voxelization.",
    "",
    `**Headline:** ${allClean ? "off-(augmented-palette) = **0** on all 7" : "OFF-PALETTE LEAK — see table"}; ` +
      `${allCapped ? "distinct ≤ design-doc size + 2 on all 7" : "CAP EXCEEDED — see table"}; ` +
      (maxDrop.subj ? `largest before→after drop: **${maxDrop.subj} ${maxDrop.b} → ${maxDrop.a}** (full-table → augmented).` : ""),
    "**Form IoU is invariant** under the palette change (recolour only — same occupancy → same geometry); the",
    "`form IoU (R1 ref)` column is the committed R1 build's silhouette IoU, unchanged by the tighter palette.",
    "",
    `Subjects: ${live.length} (sword excluded — TRELLIS 500'd on the thin blade; see glb/README.md).`,
    "",
    "| subject | design-doc size | secondary (≤2) | distinct before→after | off-(aug) | cap | distinct ≤ cap | form IoU (R1 ref) | pass |",
    "| ------- | --------------- | -------------- | --------------------- | --------- | --- | -------------- | ----------------- | ---- |",
    ...rows.map((r) =>
      r.skipped
        ? `| ${r.subject} | — | — | — | — | — | — | — | _(GLB absent — ${r.note ?? "skipped"})_ |`
        : `| ${r.subject} | ${r.designDocSize} | ${r.secondaryCount} | ${r.distinctBefore} → ${r.distinctAfter} | ` +
          `${r.offPaletteAfter} | ${r.cap} | ${r.distinctAfter <= r.cap ? "✓" : "✗"} | ${r.formIoURef ?? "—"} | ` +
          `${r.pass ? "✓" : "✗"} |`,
    ),
    "",
  ].join("\n");

  const json = {
    schema: "palette-discipline/v1",
    method: GLB_VOXEL_METHOD_ID,
    scale,
    metric:
      "off-(augmented-palette) = blocks placed outside design-doc ∪ ≤K=2 gated secondary (0 = the guarantee); " +
      "distinct = manifest size (≤ design-doc size + 2 by construction); distinctBefore = the PRE-FIX " +
      "full-table (305-block) snap over the SAME voxelization (the bloat removed); form IoU = the committed " +
      "R1 build's silhouette IoU (recolour-invariant — palette never moves a voxel).",
    generatedFrom:
      "benchmarks/sculpture/glb/<subject>.glb via glbVoxelBuild({palette: paletteFromManifest(manifest), " +
      "augment:true}) vs glbVoxelBuild({palette: blockPaletteFromTable()}); guarded by assertPaletteDiscipline.",
    note:
      "E-18 T-058-02: makes the design-doc-palette discipline a GUARANTEE (audit + guard), not a convention. " +
      "GL-free: off-palette + distinct depend only on placed keys; form IoU is recolour-invariant so it is " +
      "cross-referenced to the committed R1 silhouetteIoU, not re-rendered. assertPaletteDiscipline is run " +
      "live on every subject — this record could not be produced if any build leaked. Sword excluded.",
    allClean,
    allCapped,
    subjects: rows,
  };
  return { md, json };
}

/** The live host sweep (GLBs + dwebp; no GL render). */
async function runDiscipline({ scale = DEFAULT_SCALE, regenMissing = false } = {}) {
  await mkdir(OUT_DIR, { recursive: true });
  const rows = [];
  for (const subj of SUBJECTS) {
    const glbPath = join(GLB_DIR, subj.glb);
    if (!existsSync(glbPath)) {
      if (regenMissing) {
        console.error(`${subj.key}: GLB absent — regenerating via TRELLIS …`);
        await regenMissingGlb(subj, glbPath);
      }
      if (!existsSync(glbPath)) {
        console.error(`${subj.key}: skipped (glb/${subj.glb} absent — gitignored; pass --regen-missing)`);
        rows.push({ subject: subj.key, skipped: true, note: regenMissing ? "regen failed" : "not present" });
        continue;
      }
    }
    const dir = join(OUT_DIR, subj.key);
    await mkdir(dir, { recursive: true });
    const row = await verifySubject(subj, { scale });
    await writeFile(join(dir, "summary.json"), JSON.stringify(row, null, 2) + "\n");
    rows.push(row);
    console.error(
      `${subj.key}: design-doc ${row.designDocSize} +${row.secondaryCount} secondary, distinct ${row.distinctBefore}→` +
        `${row.distinctAfter} (cap ${row.cap}), off-(aug) ${row.offPaletteAfter}, form IoU ${row.formIoURef} → ${row.pass ? "PASS" : "FAIL"}`,
    );
  }
  return rows;
}

/** Write palette-discipline.{md,json} from rows. */
async function emit(rows, opts) {
  const { md, json } = buildDiscipline(rows, opts);
  await writeFile(join(HERE, "palette-discipline.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(HERE, "palette-discipline.md"), md);
  console.error(`wrote palette-discipline.{md,json} (${rows.filter((r) => !r.skipped).length}/${rows.length} subjects)`);
}

/** --offline: rebuild palette-discipline.{md,json} from committed per-subject summaries (no GLB, no dwebp). */
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
  await emit(await runDiscipline({ scale, regenMissing }), { scale });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("palette-discipline failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { buildDiscipline, runDiscipline, verifySubject };
