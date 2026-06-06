// IMPURE RUNNER — the terminal E-21 concept-grounded materials A/B (S-074 / T-074-01). Measures the whole
// pipeline (T-071 map → T-072 feature-assign) against the colorimetric E-19 build, isolating the ONLY
// variable: the material AUTHORITY. Per subject one GLB, one palette universe (the LLM material map's
// palette); the BEFORE build assigns it by mean COLOUR (segmentMaterials — the path that collapses the
// near-tone stone_bricks/cobblestone pair), the AFTER build assigns it by geometric FEATURE (the T-072
// path that separates them). Same geometry, same palette, different authority → the near-tone distinction
// restored, clean (no new speckle/off-palette) and true (right material per feature), with concept-justified
// palette growth recorded.
//
// PURITY: every colour/feature/judge computation is the pure assembler (src/form/concept-materials-ab.mjs)
// or an already-pure kernel. This file owns the impure edges only — GLB read, dwebp texture decode, colour
// sample, GL render, the metered material:map bridge (sculptures only, gated), file I/O. NOT unit-tested; the
// live branch is verified by the committed records + `--offline`, the project idiom (matches e19-build.mjs).
//
// Usage:
//   node benchmarks/sculpture/concept-materials-ab.mjs            # live sweep (GL; metered only for absent sculpture maps)
//   node benchmarks/sculpture/concept-materials-ab.mjs --offline  # re-derive the report from committed before/after artifacts
//   node benchmarks/sculpture/concept-materials-ab.mjs --only gatehouse,cottage   # subset

import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir, rm, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";
import { parseGlbColoredSurface } from "../../src/form/glb-mesh.mjs";
import { sampleSurfaceColors, keysToArtifact, paletteFromManifest } from "../../src/form/glb-voxel-build.mjs";
import { augmentPalette } from "../../src/form/palette-augment.mjs";
import {
  classifyFeatures,
  assignFeatureBlocks,
  fallbackPalette,
  featureBlockMatrix,
  FEATURE_RULE,
} from "../../src/form/feature-classify.mjs";
import { segmentMaterials, speckleScore, offPaletteCount } from "../../src/form/material-segment.mjs";
import { nearTonePairs } from "../../src/form/material-map.mjs";
import {
  abRow,
  nearToneRestoration,
  paletteGrowth,
  trueByFeatureOf,
  assembleConceptMaterialsAb,
} from "../../src/form/concept-materials-ab.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { DEFAULT_SCALE, SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { occupancyFromArtifact } from "./cleanliness-baseline.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const GLB_DIR = join(HERE, "glb");
const MAP_DIR = join(HERE, "material-map");
const RUNS = join(HERE, "runs");
const E19_DIR = join(HERE, "e19-build");
const OUT_DIR = join(HERE, "concept-materials");
const FRAMES_DIR = join(REPO, "pr", "assets", "frames");
const MAP_BRIDGE = join(REPO, "src", "form", "baml-material-map.mts");

// gatehouse + cottage = the architectural headline (both carry the stone_bricks/cobblestone near-tone pair).
// moai (monochrome → no near-tone pair, the bloat control) + pineapple (body/crown two-material) = the 2
// sculptures (the organic over-reach honesty case). Sculpture "before" = the committed E-19 colorimetric build.
const SUBJECTS = [
  { key: "gatehouse", kind: "architectural", glb: "stone-gatehouse.glb", map: "gatehouse.json", run: "015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate" },
  { key: "cottage", kind: "architectural", glb: "cottage.glb", map: "cottage.json", run: "014-vConcept-a-cottage" },
  { key: "moai", kind: "sculpture", glb: "moai.glb", map: "moai.json", run: "003-vConcept-a-moai-statue", e19: "moai" },
  { key: "pineapple", kind: "sculpture", glb: "pineapple.glb", map: "pineapple.json", run: "004-vConcept-a-pineapple", e19: "pineapple" },
];

const LEDGER = [
  "`trim` (a 1-block accent voussoir/band) has no geometric feature in the T-072 classifier — recorded as a known gap, not placed by form (see T-072 review).",
  "Non-full-cube fixtures (spruce_door, dark_oak_trapdoor, lantern) are dropped by the material map (not voxel materials) — see the cottage map `dropped`.",
  "The colorimetric BEFORE and concept-grounded AFTER share the SAME map palette universe; the ONLY variable is the authority (mean colour vs geometric feature). Architectural before/after share one voxelization; sculpture before is the published E-19 build (its own routed+pruned geometry), after is a fresh voxelization.",
  "SHARED-RULE LIMIT (the cottage finding): the T-072 assigner places ONE block per geometric feature, but the LLM map may assign TWO materials to the same placementRule (cottage: stone_bricks + white_terracotta both `walls`; spruce_planks + dark_oak_planks both `roof`). The second same-role material has no distinct feature to land on and is mis-placed (white_terracotta→base, dark_oak_planks→opening-recess) — recorded as `over-reach` though the material is concept-justified, not invented. Geometry alone cannot separate two materials sharing one architectural role; this needs a finer sub-feature selector (same family as the `trim` gap). The gatehouse (1:1 rule→block) restores cleanly.",
  "On organic sculptures the architectural feature classifier (flat-face/edge-corner/roof/base/recess) is ill-defined; the concept-grounded build leans on the colour fallback and may mis-zone — recorded as `over-reach`, the honest negative (AC#5), not a regression.",
  "Near-tone identity is invisible to a render (T-073 finding): the refine pass corrects VISIBLE mis-zoning; the near-tone distinction is carried by GEOMETRY (T-072), not colour. This A/B measures the assign-level build; the T-073 correct pass is cited, not re-run per subject.",
];

// FEATURE_RULE is keyed feature→rule; invert it to rule→feature for trueByFeatureOf / the matrices.
const RULE_FEATURE = Object.fromEntries(Object.entries(FEATURE_RULE).map(([feature, rule]) => [rule, feature]));

const round3 = (n) => Math.round(n * 1000) / 1000;

/** Run a child process to completion; reject on non-zero exit. */
function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"], ...opts });
    let err = "";
    if (child.stderr) child.stderr.on("data", (c) => (err += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${err.slice(0, 200)}`))));
  });
}

let tmpSeq = 0;
/** Decode a GLB baseColor image to RGBA (WebP→PNG via dwebp; PNG/JPEG straight through). The impure edge. */
async function decodeTexture({ data, mimeType }) {
  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const ext = mimeType === "image/png" ? "png" : "jpg";
    const p = join(tmpdir(), `cmab-tex-${process.pid}-${tmpSeq++}.${ext}`);
    await writeFile(p, data);
    try {
      return await decodeImage(p);
    } finally {
      await rm(p, { force: true });
    }
  }
  const inP = join(tmpdir(), `cmab-tex-${process.pid}-${tmpSeq}.webp`);
  const outP = join(tmpdir(), `cmab-tex-${process.pid}-${tmpSeq++}.png`);
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

/** Cell metrics for a build (distinct / speckle / off-palette) on its own occupancy + the augmented palette. */
function cellOf(occupancy, keys, manifest, augPalette) {
  return {
    distinct: manifest.length,
    speckle: round3(speckleScore(occupancy, keys)),
    offPalette: offPaletteCount(keys, augPalette),
  };
}

/**
 * Derive the A/B row from the two committed/built artifacts — IDENTICALLY in live and `--offline` (the single
 * source of truth so the two paths never diverge). Everything is reconstructed from each artifact's OWN
 * occupancy via occupancyFromArtifact, so cells + matrices are self-consistent (no fresh-occ ↔ artifact-keys
 * misalignment). The collapse is SPATIAL: classify each build by the same feature classifier and check whether
 * the near-tone pair is feature-separated (the colorimetric build scatters it by colour; the concept-grounded
 * build separates it by feature → restored). `metricPalette` is the CONCEPT MAP palette (texture-
 * independent, so live and offline agree): off-palette = cells using a block beyond the concept's declared
 * palette (the colorimetric build drifts off it; the concept-grounded build stays on it). PURE given inputs.
 */
function deriveRow(subj, beforeArtifact, afterArtifact, map, metricPalette) {
  const bo = occupancyFromArtifact(beforeArtifact);
  const ao = occupancyFromArtifact(afterArtifact);
  const beforeMatrix = featureBlockMatrix(bo.occupancy, classifyFeatures(bo.occupancy), bo.keys);
  const afterMatrix = featureBlockMatrix(ao.occupancy, classifyFeatures(ao.occupancy), ao.keys);
  const before = cellOf(bo.occupancy, bo.keys, beforeArtifact.palette.manifest, metricPalette);
  const after = cellOf(ao.occupancy, ao.keys, afterArtifact.palette.manifest, metricPalette);
  const nearTone = nearToneRestoration({
    nearTonePairs: nearTonePairs(map),
    beforeManifest: beforeArtifact.palette.manifest,
    afterManifest: afterArtifact.palette.manifest,
    beforeMatrix,
    afterMatrix,
  });
  // design-doc baseline for growth = the colorimetric (design-doc-disciplined) before manifest.
  const growth = paletteGrowth({ afterManifest: afterArtifact.palette.manifest, designDocManifest: beforeArtifact.palette.manifest, map });
  const trueByFeature = trueByFeatureOf({ map, afterMatrix, ruleFeature: RULE_FEATURE });
  return { subject: subj.key, kind: subj.kind, before, after, nearTone, growth, trueByFeature };
}

/**
 * Generate a sculpture material map via the metered tsx bridge (claude -p subscription), gated. Writes
 * material-map/<subj>.{json,raw.json}. Returns the parsed map json, or null on failure (the subject defers).
 */
async function ensureMap(subj) {
  const mapPath = join(MAP_DIR, subj.map);
  const committed = await readJson(mapPath);
  if (committed?.map?.length) return committed;
  if (subj.kind !== "sculpture") return null; // architectural maps are committed; never generate here
  const conceptPath = join(RUNS, subj.run, "concept.png");
  const docPath = join(RUNS, subj.run, "design-doc.md");
  if (!existsSync(conceptPath)) {
    console.error(`${subj.key}: concept ${conceptPath} absent — map deferred`);
    return null;
  }
  console.error(`${subj.key}: generating material map (metered claude -p)…`);
  try {
    const raw = await spawnMap({ conceptPath, docPath: existsSync(docPath) ? docPath : undefined });
    // Reuse the committed material-map runner's pure validate+write path.
    const { parseMaterialMap } = await import("../../src/form/material-map.mjs");
    const parsed = parseMaterialMap(raw, { subject: subj.key });
    await writeFile(join(MAP_DIR, `${subj.key}.raw.json`), JSON.stringify(raw, null, 2) + "\n");
    await writeFile(mapPath, JSON.stringify(parsed, null, 2) + "\n");
    console.error(`${subj.key}: map written (${parsed.map.length} blocks, preservesNearTone=${parsed.preservesNearTone})`);
    return parsed;
  } catch (e) {
    console.error(`${subj.key}: map generation FAILED (${e?.message || e}) — subject deferred`);
    return null;
  }
}

/** Spawn the metered tsx material-map bridge with {conceptPath, docPath?} on stdin → parsed {materials}. */
function spawnMap({ conceptPath, docPath }) {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", MAP_BRIDGE], { cwd: REPO, stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (c) => (out += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`baml-material-map exited ${code}`));
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(new Error(`unparseable bridge output: ${e.message}\n${out.slice(0, 300)}`));
      }
    });
  });
}

/** Build both sides for one subject → an abRow input (+ writes the two artifacts + renders). */
async function buildSubject(subj, { scale, renderArtifact }) {
  const mapJson = await ensureMap(subj);
  if (!mapJson?.map?.length) {
    return { subject: subj.key, kind: subj.kind, deferred: true, note: "no material map" };
  }
  const glbPath = join(GLB_DIR, subj.glb);
  if (!existsSync(glbPath)) {
    console.error(`${subj.key}: glb/${subj.glb} absent (gitignored) — deferred`);
    return { subject: subj.key, kind: subj.kind, deferred: true, note: "GLB absent" };
  }

  const dir = join(OUT_DIR, subj.key);
  await mkdir(dir, { recursive: true });
  const glbBytes = await readFile(glbPath);
  const surface = parseGlbColoredSurface(glbBytes);
  if (!surface.baseColor) throw new Error(`${subj.key}: GLB has no baseColor texture`);
  const texture = await decodeTexture(surface.baseColor);
  const map = mapJson.map;
  const augPalette = augmentPalette(paletteFromManifest(mapJson.palette), texture);

  // --- AFTER: concept-grounded (feature-assign over a fresh voxelization) ---
  const occ = voxelizeGlb(glbBytes, { scale });
  const colors = sampleSurfaceColors({ occupancy: occ, surface, texture });
  const features = classifyFeatures(occ);
  const afterKeys = assignFeatureBlocks(occ, features, map, { colors, palette: fallbackPalette(map) });
  const afterArtifact = keysToArtifact(occ, afterKeys, {
    metadata: { trial_id: `${subj.key}-concept-grounded` },
    style: { name: "concept-grounded", rationale: "T-071 LLM material map placed by T-072 geometric feature — near-tone materials separated by FORM, not colour." },
  });
  assertArtifact(afterArtifact);
  await writeFile(join(dir, "after-artifact.json"), JSON.stringify(afterArtifact, null, 2) + "\n");
  await renderArtifact(afterArtifact, { outPath: join(dir, "after-3q.png"), view: SCULPTURE_VIEW_3Q });

  // --- BEFORE: colorimetric (segmentMaterials = mean-colour; sculpture reuses the published E-19 build) ---
  let beforeArtifact;
  if (subj.kind === "sculpture") {
    beforeArtifact = await readJson(join(E19_DIR, subj.e19, "artifact.json"));
    if (!beforeArtifact) throw new Error(`${subj.key}: e19-build/${subj.e19}/artifact.json absent (run e19:build first)`);
  } else {
    beforeArtifact = segmentMaterials(
      { occupancy: occ, surface, texture },
      {
        palette: augPalette,
        metadata: { trial_id: `${subj.key}-colorimetric` },
        style: { name: "colorimetric", rationale: "Mean-colour region segmentation under the same map palette — the E-19 authority that COLLAPSES near-tone materials (brick≈cobble snap to one)." },
      },
    );
    assertArtifact(beforeArtifact);
  }
  await writeFile(join(dir, "before-artifact.json"), JSON.stringify(beforeArtifact, null, 2) + "\n");
  await renderArtifact(beforeArtifact, { outPath: join(dir, "before-3q.png"), view: SCULPTURE_VIEW_3Q });

  // --- the A/B cell (derived IDENTICALLY in live + --offline via deriveRow) ---
  // off-palette metric is vs the CONCEPT MAP palette (texture-independent → live≡offline), not the
  // texture-augmented palette that seeds segmentMaterials' build.
  const row = deriveRow(subj, beforeArtifact, afterArtifact, map, paletteFromManifest(mapJson.palette));
  const { before, after, nearTone, growth, trueByFeature } = row;

  console.error(
    `${subj.key} (${subj.kind}): distinct ${before.distinct}→${after.distinct} · speckle ${before.speckle}→${after.speckle} · ` +
      `off-pal ${before.offPalette}→${after.offPalette} · near-tone collapsed ${nearTone.collapsedBefore}→restored ${nearTone.restoredAfter} (sep ${nearTone.separatedAfter}) · ` +
      `true ${trueByFeature?.ok} · growth +${growth.count} (justified ${growth.justified})`,
  );
  return row;
}

/** Copy the headline architectural before/after frames to pr/assets/frames/ (AC#3 / E-12). */
async function copyFrames(keys) {
  await mkdir(FRAMES_DIR, { recursive: true });
  const copied = [];
  for (const key of keys) {
    for (const side of ["before", "after"]) {
      const src = join(OUT_DIR, key, `${side}-3q.png`);
      if (existsSync(src)) {
        await copyFile(src, join(FRAMES_DIR, `concept-${key}-${side}.png`));
        copied.push(`concept-${key}-${side}.png`);
      }
    }
  }
  console.error(`frames: copied ${copied.length} → pr/assets/frames/`);
}

/** Assemble + write concept-materials-ab.{md,json} + the pr/assets/ handoff. */
async function emit(rowInputs, { scale }) {
  const rows = rowInputs.map((r) => abRow(r));
  const { md, json } = assembleConceptMaterialsAb({ rows, scale, ledger: LEDGER });
  await writeFile(join(HERE, "concept-materials-ab.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(HERE, "concept-materials-ab.md"), md);
  console.error(`wrote concept-materials-ab.{md,json} (${rows.length} subjects)`);
  return json;
}

async function runLive({ scale, only }) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  await mkdir(OUT_DIR, { recursive: true });
  const subjects = only ? SUBJECTS.filter((s) => only.includes(s.key)) : SUBJECTS;
  const rowInputs = [];
  for (const subj of subjects) {
    try {
      rowInputs.push(await buildSubject(subj, { scale, renderArtifact }));
    } catch (err) {
      console.error(`${subj.key}: FAILED — ${err?.message || err}`);
      rowInputs.push({ subject: subj.key, kind: subj.kind, deferred: true, note: `build failed: ${err?.message || err}` });
    }
  }
  await emit(rowInputs, { scale });
  await copyFrames(["gatehouse", "cottage"]);
}

/** --offline: re-derive the report from committed before/after artifacts + maps, re-validate AJV, no GL/model. */
async function verifyOffline({ scale, only }) {
  const subjects = only ? SUBJECTS.filter((s) => only.includes(s.key)) : SUBJECTS;
  const rowInputs = [];
  for (const subj of subjects) {
    const dir = join(OUT_DIR, subj.key);
    const beforeArtifact = await readJson(join(dir, "before-artifact.json"));
    const afterArtifact = await readJson(join(dir, "after-artifact.json"));
    const mapJson = await readJson(join(MAP_DIR, subj.map));
    if (!beforeArtifact || !afterArtifact || !mapJson?.map?.length) {
      rowInputs.push({ subject: subj.key, kind: subj.kind, deferred: true, note: "no committed before/after artifact or map" });
      continue;
    }
    assertArtifact(beforeArtifact);
    assertArtifact(afterArtifact);
    rowInputs.push(deriveRow(subj, beforeArtifact, afterArtifact, mapJson.map, paletteFromManifest(mapJson.palette)));
  }
  const json = await emit(rowInputs, { scale });
  console.error(`offline: ${json.subjects.filter((r) => r.judge !== "deferred").length}/${json.subjects.length} subjects re-derived; judges ${JSON.stringify(Object.fromEntries(Object.entries(json.judges).map(([k, v]) => [k, v.length])))}`);
}

async function main() {
  const argv = process.argv.slice(2);
  const offline = argv.includes("--offline");
  const onlyArg = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
  const only = onlyArg ? onlyArg.split(",").map((s) => s.trim()) : null;
  const scaleArg = argv.find((a) => /^\d+$/.test(a));
  const scale = scaleArg ? Number(scaleArg) : DEFAULT_SCALE;
  await mkdir(OUT_DIR, { recursive: true });
  if (offline) {
    await verifyOffline({ scale, only });
    return;
  }
  await runLive({ scale, only });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("concept-materials-ab failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { buildSubject, runLive, verifyOffline, SUBJECTS };
