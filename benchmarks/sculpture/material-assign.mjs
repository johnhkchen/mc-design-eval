// IMPURE RUNNER — E-21 feature-aware assignment on the gatehouse (S-072 / T-072-01). The "place style"
// proof: voxelize the gatehouse GLB, classify every cell by geometric feature, place the T-071 material
// map's block per feature, render, and verify the brick≠cobble distinction is RESTORED in the manifest —
// cobblestone on corners/edges, stone_bricks on the wall field — placed by FORM, not colour (their mean
// colours are ~identical; only geometry can separate them).
//
// PURITY: all the geometry + assignment is the pure core (src/form/feature-classify.mjs). This file owns
// the impure edges only — GLB read, texture decode (dwebp), surface-colour sampling, GL render, file I/O.
// It is NOT unit-tested (the suite must never pull GL / the metered render); it is verified by the
// committed material-assign/gatehouse.json + the `--offline` re-check, exactly like e19-build.mjs.
//
// Usage:
//   node benchmarks/sculpture/material-assign.mjs            # live: build + render + write the record
//   node benchmarks/sculpture/material-assign.mjs --offline  # re-verify brick≠cobble from committed JSON

import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";
import { parseGlbColoredSurface } from "../../src/form/glb-mesh.mjs";
import { sampleSurfaceColors, keysToArtifact } from "../../src/form/glb-voxel-build.mjs";
import {
  classifyFeatures,
  assignFeatureBlocks,
  fallbackPalette,
  featureCounts,
  featureBlockMatrix,
  FEATURE_RULE,
} from "../../src/form/feature-classify.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { DEFAULT_SCALE, SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { occupancyFromArtifact } from "./cleanliness-baseline.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLB_DIR = join(HERE, "glb");
const MAP_DIR = join(HERE, "material-map");
const OUT_DIR = join(HERE, "material-assign");

const SUBJECT = { key: "gatehouse", glb: "stone-gatehouse.glb", map: "gatehouse.json" };

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
/** Decode a GLB baseColor image to RGBA. WebP→PNG via dwebp (host tool); PNG/JPEG straight through. */
async function decodeTexture({ data, mimeType }) {
  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const ext = mimeType === "image/png" ? "png" : "jpg";
    const p = join(tmpdir(), `ma-tex-${process.pid}-${tmpSeq++}.${ext}`);
    await writeFile(p, data);
    try {
      return await decodeImage(p);
    } finally {
      await rm(p, { force: true });
    }
  }
  const inP = join(tmpdir(), `ma-tex-${process.pid}-${tmpSeq}.webp`);
  const outP = join(tmpdir(), `ma-tex-${process.pid}-${tmpSeq++}.png`);
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

/** The argmax feature for a block's column — "where this block mostly landed." */
function dominantFeature(row) {
  return Object.entries(row).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

/**
 * The AC#4 verdict from a block×feature matrix + the map. brickNotCobbleByFeature is true iff BOTH the
 * walls block and the corners-edges block are present in the manifest AND each dominates its OWN feature
 * (walls→flat-face, corners→edge-corner) — i.e. the collapsed grey is restored by geometry. PURE.
 */
function verdict(matrix, map) {
  const wallsBlock = (map.find((e) => e.placementRule === "walls")?.block ?? "").replace(/^minecraft:/, "");
  const cornerBlock = (map.find((e) => e.placementRule === "corners-edges")?.block ?? "").replace(/^minecraft:/, "");
  const wallsRow = matrix[wallsBlock];
  const cornerRow = matrix[cornerBlock];
  const wallsOnFaces = wallsRow ? dominantFeature(wallsRow) === "flat-face" : false;
  const cornerOnEdges = cornerRow ? dominantFeature(cornerRow) === "edge-corner" : false;
  return {
    wallsBlock,
    cornerBlock,
    wallsPresent: !!wallsRow,
    cornerPresent: !!cornerRow,
    wallsOnFaces,
    cornerOnEdges,
    brickNotCobbleByFeature: !!wallsRow && !!cornerRow && wallsOnFaces && cornerOnEdges,
  };
}

/** blocksByRule: which block each feature's region received (the placement summary), + the unplaced rules. */
function blocksByRule(map) {
  const byRule = {};
  for (const e of map) byRule[e.placementRule] ??= e.block;
  const geomRules = new Set(Object.values(FEATURE_RULE));
  const unplaced = map.filter((e) => !geomRules.has(e.placementRule)).map((e) => ({ block: e.block, rule: e.placementRule }));
  return { byRule, unplaced }; // unplaced = rules with no geometric feature (e.g. trim) — documented gap
}

async function buildLive({ scale }) {
  const glbPath = join(GLB_DIR, SUBJECT.glb);
  if (!existsSync(glbPath)) throw new Error(`glb/${SUBJECT.glb} absent (gitignored) — regen via trellis-glb.mjs`);
  const mapJson = await readJson(join(MAP_DIR, SUBJECT.map));
  if (!mapJson?.map?.length) throw new Error(`material-map/${SUBJECT.map} missing or empty (run T-071 material:map)`);
  const map = mapJson.map;

  const dir = join(OUT_DIR, SUBJECT.key);
  await mkdir(dir, { recursive: true });
  const glbBytes = await readFile(glbPath);

  const occ = voxelizeGlb(glbBytes, { scale });
  const surface = parseGlbColoredSurface(glbBytes);
  if (!surface.baseColor) throw new Error("gatehouse GLB has no baseColor texture");
  const texture = await decodeTexture(surface.baseColor);
  const colors = sampleSurfaceColors({ occupancy: occ, surface, texture }); // for the silent-map fallback

  const features = classifyFeatures(occ);
  const palette = fallbackPalette(map);
  const keys = assignFeatureBlocks(occ, features, map, { colors, palette });

  const artifact = keysToArtifact(occ, keys, {
    metadata: { trial_id: `${SUBJECT.key}-feature-assign` },
    style: {
      name: "feature-assign",
      rationale:
        "Voxels classified by pure geometric feature (flat-face / edge-corner / top-roof / base / " +
        "opening-recess) and filled with the T-071 LLM material map's block per region — cobblestone on " +
        "corners, stone_bricks on walls, a near-tone distinction placed by FORM, not colour. The E-14 " +
        "colorimetric matcher fills cells the map is silent for (e.g. the base band).",
    },
  });
  assertArtifact(artifact); // AC#3: output passes the AJV gate

  const renderPath = join(dir, "render-3q.png");
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  await renderArtifact(artifact, { outPath: renderPath, view: SCULPTURE_VIEW_3Q });

  const matrix = featureBlockMatrix(occ, features, keys);
  const v = verdict(matrix, map);
  const { byRule, unplaced } = blocksByRule(map);

  const record = {
    schema: "material-assign/v1",
    subject: SUBJECT.key,
    scale,
    generatedFrom: { glb: `glb/${SUBJECT.glb}`, materialMap: `material-map/${SUBJECT.map}` },
    cells: occ.count,
    features: featureCounts(features),
    manifest: artifact.palette.manifest,
    blocksByRule: byRule,
    unplacedRules: unplaced, // trim etc. — no geometric feature (documented gap)
    matrix,
    ...v,
  };
  await writeFile(join(dir, "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${SUBJECT.key}.json`), JSON.stringify(record, null, 2) + "\n");

  console.error(
    `gatehouse: ${occ.count} cells, ${artifact.palette.manifest.length} blocks; ` +
      `brickNotCobbleByFeature=${v.brickNotCobbleByFeature} ` +
      `(walls=${v.wallsBlock}@flat-face=${v.wallsOnFaces}, corners=${v.cornerBlock}@edge-corner=${v.cornerOnEdges})`,
  );
  if (!v.brickNotCobbleByFeature) console.error("WARNING: brick≠cobble distinction NOT confirmed — inspect the render + matrix.");
  return record;
}

/** --offline: re-verify the property from the committed record + artifact, no GL. */
async function verifyOffline() {
  const record = await readJson(join(OUT_DIR, `${SUBJECT.key}.json`));
  const artifact = await readJson(join(OUT_DIR, SUBJECT.key, "artifact.json"));
  const mapJson = await readJson(join(MAP_DIR, SUBJECT.map));
  if (!record || !artifact || !mapJson) {
    console.error("offline: no committed material-assign/gatehouse.json + artifact.json yet — run live first.");
    return;
  }
  const { occupancy, keys } = occupancyFromArtifact(artifact);
  const features = classifyFeatures(occupancy);
  const matrix = featureBlockMatrix(occupancy, features, keys);
  const v = verdict(matrix, mapJson.map);
  assertArtifact(artifact);
  console.error(
    `offline gatehouse: ${occupancy.count} cells, manifest ${artifact.palette.manifest.length}; ` +
      `brickNotCobbleByFeature=${v.brickNotCobbleByFeature}`,
  );
  if (!v.brickNotCobbleByFeature) {
    console.error("offline: brick≠cobble NOT confirmed on the committed artifact.");
    process.exitCode = 1;
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const offline = argv.includes("--offline");
  const scaleArg = argv.find((a) => /^\d+$/.test(a));
  const scale = scaleArg ? Number(scaleArg) : DEFAULT_SCALE;
  if (offline) {
    await verifyOffline();
    return;
  }
  await mkdir(OUT_DIR, { recursive: true });
  await buildLive({ scale });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("material-assign failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { buildLive, verifyOffline, verdict, blocksByRule };
