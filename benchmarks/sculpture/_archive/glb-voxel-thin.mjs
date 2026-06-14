// Thin-feature-preserving voxel sweep — E-18 thin-form fix (T-059-01, story S-059).
//
// E-17's R1 breadth sweep scored all 7 subjects by silhouette IoU vs their own GLB. Bow-and-arrow was
// the WORST (form IoU 0.473): its stave/string/arrow shaft are sub-voxel thin, so voxelizeGlb's
// center-only parity test drops or severs them. This harness measures the fix: for bow-and-arrow (+ koi,
// whose fins are also thin) it voxelizes BOTH ways — voxelizeGlb (base) vs voxelizeGlbThin (solid ∪
// conservative shell) — colors each via the SAME E-16 value-true path, renders at SCULPTURE_VIEW_3Q, and
// scores silhouette IoU. The roll-up records form IoU + occupancy + connected-component count
// BEFORE/AFTER (the AC's no-dropped-thin-components check).
//
// REUSE, NOT REIMPLEMENTATION: the pure thin core is voxelizeGlbThin/connectedComponents
// (src/form/glb-thin.mjs); coloring reuses the EXPORTED pure parseGlbColoredSurface + sampleSurfaceColors
// + colorVoxelsToArtifact (no edit to glb-voxel-build.mjs). The impure glue — dwebp WebP decode + the
// silhouette IoU judge — is the SAME as glb-voxel-breadth.mjs, kept local to the harness. GL + host-tool,
// NEVER in `npm test`. An absent GLB is skipped (gitignored), never a hard error.
//
//   node benchmarks/sculpture/glb-voxel-thin.mjs [scale]                 # live sweep, bow + koi
//   node benchmarks/sculpture/glb-voxel-thin.mjs --offline               # rebuild thin.{md,json}
//   node benchmarks/sculpture/glb-voxel-thin.mjs --subjects bow-and-arrow
//
// Writes glb-voxel-thin/<subject>/{artifact-base.json, artifact-thin.json, render-{base,thin}-3q.png,
// summary.json} and glb-voxel-thin/thin.{md,json}.

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";
import { voxelizeGlbThin, connectedComponents } from "../../src/form/glb-thin.mjs";
import { sampleSurfaceColors, colorVoxelsToArtifact } from "../../src/form/glb-voxel-build.mjs";
import { parseGlbColoredSurface } from "../../src/form/glb-mesh.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { DEFAULT_SCALE, SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { extractSilhouette, normalizeSilhouette, iou, RENDER_BG } from "../../src/form/form-fidelity.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLB_DIR = join(HERE, "glb");
const OUT_DIR = join(HERE, "glb-voxel-thin");

// Thin-form subjects: bow-and-arrow (the worst-voxelizing of the 7) and koi (thin fins). `glb` basename
// equals `key`; mapping spelled out so it survives a rename. Mirrors glb-voxel-breadth.mjs's SUBJECTS.
const SUBJECTS = [
  { key: "bow-and-arrow", glb: "bow-and-arrow.glb" },
  { key: "koi", glb: "koi.glb" },
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
/** Decode a GLB baseColor image to RGBA. WebP → PNG via dwebp (host tool, never CI), then pngjs. */
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

/** Silhouette IoU of a render PNG vs the GLB's own silhouette at SCULPTURE_VIEW_3Q (same as breadth). */
async function judgeIoU(renderPath, glbBytes) {
  const renderImg = await decodeImage(renderPath);
  const rSil = extractSilhouette(renderImg, RENDER_BG);
  const mesh = loadMeshFromGlb(glbBytes);
  const gSil = rasterizeSilhouette(mesh, { view: SCULPTURE_VIEW_3Q });
  return Math.round(iou(normalizeSilhouette(rSil), normalizeSilhouette(gSil)) * 1000) / 1000;
}

/** Color an occupancy (base or thin) via the SAME E-16 value-true path → a schema-valid artifact. */
function buildArtifact(occupancy, surface, texture, { subject, variant }) {
  const colors = sampleSurfaceColors({ occupancy, surface, texture });
  const artifact = colorVoxelsToArtifact(occupancy, colors, {
    scale: occupancy.scale,
    metadata: { trial_id: `${subject}-glb-voxel-${variant}` },
    style: { name: `glb-voxel-${variant}`, rationale: `Voxelized ${subject} GLB (${variant}); cells colored value-true from the GLB surface.` },
  });
  assertArtifact(artifact);
  return artifact;
}

/** PURE: rows[] → { md, json } for the thin before/after roll-up. */
function buildThinRollup(rows, { scale = DEFAULT_SCALE } = {}) {
  const live = rows.filter((r) => !r.skipped);
  const md = [
    "# Thin-feature-preserving voxelization — before/after (E-18 T-059-01)",
    "",
    "Each thin-form subject voxelized two ways: `base` = voxelizeGlb (center-only parity, E-16) vs",
    "`thin` = voxelizeGlbThin (solid ∪ conservative-shell SAT). Both colored value-true from the GLB's own",
    "surface, rendered at SCULPTURE_VIEW_3Q, scored by silhouette IoU vs the GLB's own silhouette.",
    "`components` = 26-connected voxel components (lower/equal = fewer severed fragments).",
    "",
    `Subjects: ${live.length}. Sword excluded — TRELLIS produced no GLB on the thinnest subject (T-061 routing finding).`,
    "",
    "| subject | base IoU | thin IoU | ΔIoU | base occ | thin occ | thin-only | base comps | thin comps |",
    "| ------- | -------- | -------- | ---- | -------- | -------- | --------- | ---------- | ---------- |",
    ...rows.map((r) =>
      r.skipped
        ? `| ${r.subject} | — | — | — | — | — | — | — | — | _(${r.note ?? "skipped"})_`
        : `| ${r.subject} | ${r.base.iou} | ${r.thin.iou} | ${signed(r.dIoU)} | ${r.base.occupancy} | ${r.thin.occupancy} | ${r.thin.surfaceOnlyCount} | ${r.base.components} | ${r.thin.components} |`,
    ),
    "",
    "ΔIoU > 0 = the recovered thin surface lifts the silhouette toward the GLB. The conservative trace can",
    "only ADD true-surface cells, so a rise (or no change) is expected; the magnitude is the finding.",
    "",
  ].join("\n");

  const json = {
    schema: "glb-voxel-thin/v1",
    ticket: "T-059-01",
    epic: "E-18",
    view: SCULPTURE_VIEW_3Q,
    scale,
    metric: "silhouette-iou vs the build's OWN source GLB at SCULPTURE_VIEW_3Q, normalized; components = 26-connected voxel components.",
    method: "base = voxelizeGlb (center parity); thin = voxelizeGlbThin (solid ∪ conservative-shell triangle–box SAT).",
    note:
      "Bow-and-arrow was the worst-voxelizing of the E-17 7-subject sweep (R1 form IoU 0.473) — sub-voxel " +
      "stave/string/shaft dropped under center-only parity. The thin pass unions a conservative surface trace " +
      "so a connected mesh surface yields a connected voxel chain. Thick forms are bit-identical to base.",
    subjects: rows,
  };
  return { md, json };
}

const signed = (n) => (typeof n === "number" ? (n >= 0 ? `+${n.toFixed(3)}` : n.toFixed(3)) : "—");

/** The live GL/host sweep: voxelize base + thin, color, render, judge, write per-subject artifacts. */
async function runThin({ scale = DEFAULT_SCALE, subjects = SUBJECTS } = {}) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");

  await mkdir(OUT_DIR, { recursive: true });
  const rows = [];

  for (const subj of subjects) {
    const glbPath = join(GLB_DIR, subj.glb);
    if (!existsSync(glbPath)) {
      console.error(`${subj.key}: skipped (glb/${subj.glb} absent — gitignored)`);
      rows.push({ subject: subj.key, skipped: true, note: "GLB not present" });
      continue;
    }
    const dir = join(OUT_DIR, subj.key);
    await mkdir(dir, { recursive: true });
    const glbBytes = await readFile(glbPath);

    const surface = parseGlbColoredSurface(glbBytes);
    if (!surface.baseColor) throw new Error(`${subj.key}: GLB has no baseColor texture`);
    const texture = await decodeTexture(surface.baseColor);

    const baseOcc = voxelizeGlb(glbBytes, { scale });
    const thinOcc = voxelizeGlbThin(glbBytes, { scale });

    const baseArt = buildArtifact(baseOcc, surface, texture, { subject: subj.key, variant: "base" });
    const thinArt = buildArtifact(thinOcc, surface, texture, { subject: subj.key, variant: "thin" });
    await writeFile(join(dir, "artifact-base.json"), JSON.stringify(baseArt, null, 2) + "\n");
    await writeFile(join(dir, "artifact-thin.json"), JSON.stringify(thinArt, null, 2) + "\n");

    const baseRender = join(dir, "render-base-3q.png");
    const thinRender = join(dir, "render-thin-3q.png");
    await renderArtifact(baseArt, { outPath: baseRender, view: SCULPTURE_VIEW_3Q });
    await renderArtifact(thinArt, { outPath: thinRender, view: SCULPTURE_VIEW_3Q });

    const baseIoU = await judgeIoU(baseRender, glbBytes);
    const thinIoU = await judgeIoU(thinRender, glbBytes);
    const baseComponents = connectedComponents(baseOcc, { connectivity: 26 }).count;

    const summary = {
      subject: subj.key,
      scale,
      base: { occupancy: baseOcc.count, iou: baseIoU, components: baseComponents },
      thin: { occupancy: thinOcc.count, iou: thinIoU, components: thinOcc.thin.components, surfaceOnlyCount: thinOcc.thin.surfaceOnlyCount },
      dIoU: Math.round((thinIoU - baseIoU) * 1000) / 1000,
      view3q: SCULPTURE_VIEW_3Q,
    };
    await writeFile(join(dir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
    rows.push(summary);
    console.error(
      `${subj.key}: base IoU ${baseIoU} (occ ${baseOcc.count}, ${baseComponents} comps) → ` +
        `thin IoU ${thinIoU} (occ ${thinOcc.count}, ${thinOcc.thin.components} comps, +${thinOcc.thin.surfaceOnlyCount} thin)`,
    );
  }
  return rows;
}

/** Write thin.{md,json}. */
async function emit(rows, opts) {
  await mkdir(OUT_DIR, { recursive: true });
  const { md, json } = buildThinRollup(rows, opts);
  await writeFile(join(OUT_DIR, "thin.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "thin.md"), md);
  console.error(`wrote glb-voxel-thin/thin.{md,json} (${rows.filter((r) => !r.skipped).length}/${rows.length} subjects)`);
}

/** --offline: rebuild thin.{md,json} from the committed per-subject summaries. */
async function regenerateOffline({ scale = DEFAULT_SCALE, subjects = SUBJECTS } = {}) {
  const rows = [];
  for (const subj of subjects) {
    const p = join(OUT_DIR, subj.key, "summary.json");
    if (existsSync(p)) rows.push(JSON.parse(await readFile(p, "utf8")));
    else rows.push({ subject: subj.key, skipped: true, note: "no summary.json" });
  }
  await emit(rows, { scale });
}

async function main() {
  const argv = process.argv.slice(2);
  const offline = argv.includes("--offline");
  const subjArg = argv.find((a) => a.startsWith("--subjects"));
  const subjects = subjArg
    ? SUBJECTS.filter((s) => subjArg.split("=")[1]?.split(",").includes(s.key) || argv[argv.indexOf(subjArg) + 1]?.split(",").includes(s.key))
    : SUBJECTS;
  const scaleArg = argv.find((a) => /^\d+$/.test(a));
  const scale = scaleArg ? Number(scaleArg) : DEFAULT_SCALE;

  if (offline) {
    await regenerateOffline({ scale, subjects });
    return;
  }
  await emit(await runThin({ scale, subjects }), { scale });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("glb-voxel-thin failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { SUBJECTS, buildThinRollup, runThin };
