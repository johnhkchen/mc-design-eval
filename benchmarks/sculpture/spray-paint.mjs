// IMPURE RUNNER — E-23 spray-paint judgement path on the cottage (S-079 / T-079-01). Reverses the
// 215→8 plaster collapse: the E-21 material map was correct but the 3-D feature placer collapsed plaster
// into stone because 3-D feature space has no storey axis. Here the build face is PROJECTED to the 2.5-D
// grid (T-078 Path P), a per-cell material TARGET is SPLATTED onto it — the CONCEPT for the front (where
// it is the truth), the textured GLB for a side (the concept never shows it) — and the target is
// BACK-PROJECTED to recolor placements on the front-most surface voxels. The front face is gated against
// the concept (E-22 per-face accept-if-closer, P14-safe); corner voxels take the concept paint over the
// GLB paint. White_terracotta recovers from 8.
//
// THE SEAM INVARIANT: the splat, back-projection, palette enforcement, and accept gate are the PURE
// src/view/* cores (unit-tested). This file is the impure wiring only: GL face renders (E-22 fixed lens),
// GLB decode, the optional metered LLM refine, and the durable record. Mirrors material-correct.mjs.
//
// THE BASE COAT (T-085-01, E-24): the splat cannot ESTABLISH a zone's dominant material — it converted
// only 9% of the upper-storey wall to plaster (quantization collapse + concept→face misalignment); the
// good 77% skin existed only as an inline hand-edit (e8062fa). Now a deterministic ZONE-FILL (zoneFill,
// pure) lays each zone's dominant FIRST (base=stone, upper=plaster, roof=planks; secondary RUNS kept),
// and the splat is DEMOTED to placing secondaries only (its per-zone palette excludes every field
// material) — so it can never repaint the coat back to stone. Coverage before polish (Rule 3), and the
// whole result is reproduced by `npm run spray:paint` end-to-end (Rule 1, no hand edits).
//
// GL + (optionally) METERED — run on demand, NOT in `npm test`:
//   node benchmarks/sculpture/spray-paint.mjs            # splat + paint + per-face gate (GL renders)
//   node benchmarks/sculpture/spray-paint.mjs --refine   # + the metered LLM face-vs-face refinement
//   node benchmarks/sculpture/spray-paint.mjs --offline  # deterministic only: splat→paint→assert, no GL/model
//
// Writes spray-paint/cottage.json (the committed record) + spray-paint/cottage/artifact.json (the painted,
// AJV-valid build) + face PNGs (gitignored). The deterministic core (splat→paint→merge→assert + the
// white_terracotta count) ALWAYS runs and is recorded; the GL face-scores are best-effort (a headless-GL
// failure degrades to a recorded gap, never a crash).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy, bareBlock } from "../../src/view/occupancy.mjs";
import { projectSurface } from "../../src/view/surface-grid.mjs";
import { quantizeToFace } from "../../src/view/reference-quantize.mjs";
import { loadGlbSplat, resampleBlockGrid } from "../../src/view/glb-splat.mjs";
import { paintFace, mergePaints, applyPaint } from "../../src/view/face-paint.mjs";
import { zoneFill, surfaceZoneHistogram, dominantCoverage, exposedVoxelEntries } from "../../src/view/zone-fill.mjs";
import { structuralZones } from "../../src/view/structural-read.mjs";
import { sealRoof, sealWalls, applyDeltas } from "../../src/view/surface-coherence.mjs";
import { allowedPalette } from "../../src/view/palette-cans.mjs";
import {
  faceResemblance, coverageGate, acceptWithCoverage, DEFAULT_COVERAGE_THRESHOLD,
} from "../../src/view/face-resemblance.mjs";
import { paletteFromManifest } from "../../src/form/glb-voxel-build.mjs";
import { loadBlockTable } from "../../src/color/block-table.mjs";
import { assertArtifact } from "../../src/artifact.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const ART_PATH = join(ROOT, "benchmarks/sculpture/concept-materials/cottage/after-artifact.json");
const CONCEPT_PATH = join(ROOT, "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png");
const GLB_PATH = join(ROOT, "benchmarks/sculpture/glb/cottage.glb");
const OUT_DIR = join(ROOT, "benchmarks/sculpture/spray-paint");
const SUBJ_DIR = join(OUT_DIR, "cottage");

const PLASTER = "minecraft:white_terracotta";

// THE ZONE POLICY (cottage; derived from material-map/cottage.json roles, intersected with the build
// manifest at runtime). Per zone: the DOMINANT (the field material the zone-fill base coat establishes),
// the PRESERVE set (secondaries kept by the fill when they form runs — studs, quoins, the chimney; plus
// roof-skirt planks on voxels that geometrically classify "upper": a spruce gable is a legit resident),
// and the SPLAT set (what the demoted splat may still place — secondaries ONLY). Two binding invariants:
//   • plaster (white_terracotta) is "upper"-only — a plaster target on base/roof is zoneRejected (T-079-02);
//   • no zone's splat set contains ANY zone's field material — the splat can never repaint the base coat
//     back to stone (the quantization collapse maps the concept's cream to stone_bricks; with the old
//     generous "upper" palette it would re-apply the 64% failure on top of the fill) (T-085-01).
// Cost accepted & named: upper-band stone window reveals are plastered (stone cannot be preserved in
// "upper" — it IS the displaced field); reveal restoration is a surface-pattern concern (S-087).
const ZONE_POLICY = {
  base: {
    dominant: "stone_bricks",                                       // coursed ashlar wall field
    preserve: ["cobblestone", "dark_oak_log"],                      // quoins/plinth + sill timber
    splat: ["cobblestone", "dark_oak_log"],
  },
  upper: {
    dominant: "white_terracotta",                                   // the plaster infill — THE base coat
    preserve: ["dark_oak_log", "spruce_planks", "dark_oak_planks"], // timber frame + roof-skirt/gable cells
    splat: ["dark_oak_log"],                                        // the splat places studs only
  },
  roof: {
    dominant: "spruce_planks",                                      // plank-course field (NO plaster)
    // dark_oak_planks = eaves/verge; dark_oak_log = gable timber framing (gable cells classify "roof"
    // above upperTop, and the full-shell fill reaches their exposed faces). cobblestone/bricks are NOT
    // preserved here (T-090-01): the material map binds them to quoins/plinth/CHIMNEY, never the roof
    // field — the 185 scattered cobble fragments on the courses ARE the grey jumble. The chimney keeps
    // its material via the DECLARED SUB-REGION below (protruding-stack detection), not via preserve;
    // and the splat may no longer scatter grey onto the roof either.
    preserve: ["dark_oak_planks", "dark_oak_log"],
    splat: ["dark_oak_planks"],
  },
};

// The fill policy the SHIPPED T-085/T-088 wall-field stage used (projection skin; cobble/bricks
// preserved as runs, gable logs filled) — kept ONLY to replay the old base coat deterministically: the
// "before" of the T-090-01 band histograms and oblique renders. Not used to paint the build.
const LEGACY_FILL_ZONES = {
  base: { dominant: "stone_bricks", preserve: ["cobblestone", "dark_oak_log"] },
  upper: { dominant: "white_terracotta", preserve: ["dark_oak_log", "spruce_planks", "dark_oak_planks"] },
  roof: { dominant: "spruce_planks", preserve: ["dark_oak_planks", "cobblestone", "bricks"] },
};

// THE BAND ACCEPTANCE (T-090-01, S-090): on the FULL exposed shell (6-dir exposure — the camera's
// truth at any angle), the roof zone must read >= ROOF_BAND_TARGET roof materials (dominant +
// preserve; the chimney's cobble/bricks are declared preserve, so no exception needed) and the upper
// zone's stone residue must be <= UPPER_RESIDUE_MAX. Hard throws, same precedent as the coverage gate:
// a marginal number cannot silently ship a grey-jumble roof.
const ROOF_BAND_TARGET = 0.9;
const UPPER_RESIDUE_MAX = 0.05;

// THE COVERAGE GATE (T-088-01, S-088): every zone's intended dominant must cover >= this fraction of the
// zone's visible skin, as a PRECONDITION ahead of the per-face hill-climb — the gate that accepted a
// marginal 0.25→0.40 on a 91%-bare wall can no longer be fooled. 0.5 = "the dominant is actually
// dominant" (a majority of the skin), with margin both ways on the recorded evidence (splat-only upper
// 0.13 must fail; the weakest passing zone, base 0.619, must pass).
const COVERAGE_THRESHOLD = DEFAULT_COVERAGE_THRESHOLD;

// The T-079-02-era per-zone splat palettes (dominants included), kept ONLY to replay the splat-only
// baseline deterministically — the "(was 9%)" coverage evidence in the record. Not used to paint the build.
const LEGACY_ZONE_MATERIALS = {
  base: ["stone_bricks", "cobblestone", "dark_oak_log"],
  upper: ["white_terracotta", "dark_oak_log", "stone_bricks"],
  roof: ["spruce_planks", "dark_oak_planks", "cobblestone", "bricks"],
};

/** The 5 exposed faces a painted-plaster surface voxel can live on (the visible skin). */
const SURFACE_FACES = ["+x", "-x", "+z", "-z", "+y"];

/** Per-zone count of PLASTER surface voxels in `artifact` (the visible skin), classified by `zoneOf`.
 *  Interior plaster strays (not on any face) are NOT counted — they are not the visible defect. */
function surfacePlasterByZone(artifact, zoneOf) {
  const occ = artifactOccupancy(artifact);
  const seen = new Set();
  const hist = { base: 0, upper: 0, roof: 0 };
  for (const dir of SURFACE_FACES) {
    const grid = projectSurface(occ, dir);
    for (const row of grid.cells) {
      for (const c of row) {
        if (!c || bareBlock(c.block) !== "white_terracotta") continue;
        const k = c.voxel.join(",");
        if (seen.has(k)) continue;
        seen.add(k);
        hist[zoneOf(c.voxel)]++;
      }
    }
  }
  return hist;
}

/** STRIP off-zone plaster from the skin: recolor any base/roof SURFACE plaster voxel to its zone's
 *  primary material (base→stone, roof→planks). Plaster belongs to the upper storey ONLY, so any base/
 *  roof plaster is a defect — a pre-existing stray (or a smear). Narrowly scoped to plaster so it can
 *  never grey-out a legit off-primary material (e.g. a spruce gable, which classifies "upper"). Returns
 *  recolor placements (deduped by voxel). PURE. */
function stripOffZonePlaster(occ, zoneOf, allowed) {
  const primary = { base: ZONE_POLICY.base.dominant, roof: ZONE_POLICY.roof.dominant };
  const byKey = new Map();
  for (const dir of SURFACE_FACES) {
    const grid = projectSurface(occ, dir);
    for (const row of grid.cells) {
      for (const c of row) {
        if (!c || bareBlock(c.block) !== "white_terracotta") continue;
        const zone = zoneOf(c.voxel);
        if (zone === "upper") continue; // plaster is legal here
        const to = primary[zone];
        if (!allowed.has(to)) continue; // primary not in manifest — skip rather than guess
        byKey.set(c.voxel.join(","), { op: "voxel", pos: [...c.voxel], block: `minecraft:${to}` });
      }
    }
  }
  return [...byKey.values()];
}

/** One-line per-zone dominant-coverage summary for the console/md. */
function coverageLine(cov) {
  return Object.entries(cov)
    .map(([z, c]) => `${z} ${c.dominant}=${c.dominantFraction == null ? "?" : Math.round(c.dominantFraction * 100) + "%"}`)
    .join(", ");
}

/** Total interior (non-surface) plaster voxels — pre-existing strays paint/seal cannot reach. */
function interiorPlaster(artifact) {
  const occ = artifactOccupancy(artifact);
  const surf = new Set();
  for (const dir of SURFACE_FACES) {
    const grid = projectSurface(occ, dir);
    for (const row of grid.cells) for (const c of row) if (c) surf.add(c.voxel.join(","));
  }
  let n = 0;
  for (const [k, blk] of occ.cells) if (bareBlock(blk) === "white_terracotta" && !surf.has(k)) n++;
  return n;
}

// The cottage "front" the concept shows is the +Z face: multi-angle's `front` (azimuth 0) looks toward
// −Z from the +Z side, so it renders the +Z-facing surface = Path-P "+z". The render angle and the Path-P
// projection MUST agree or paint lands on one face while the gate scores another.
const DIR_TO_ANGLE = { "+z": "front", "-z": "back", "+x": "right", "-x": "left", "+y": "top", "-y": "bottom" };

/** Decode a GLB baseColor image to RGBA (WebP→PNG via dwebp; PNG/JPEG straight through) — the dwebp-backed
 *  decoder injected into loadGlbSplat (src/ keeps no WebP codec; TRELLIS GLBs are WebP). */
async function decodeTexture({ data, mimeType }) {
  const { writeFile: wf, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { decodeImage } = await import("../../src/color/palette-extract.mjs");
  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const p = join(tmpdir(), `sp-tex-${process.pid}.${mimeType === "image/png" ? "png" : "jpg"}`);
    await wf(p, Buffer.from(data));
    try { return await decodeImage(p); } finally { await rm(p, { force: true }); }
  }
  const { spawn } = await import("node:child_process");
  const inP = join(tmpdir(), `sp-tex-${process.pid}.webp`);
  const outP = join(tmpdir(), `sp-tex-${process.pid}.png`);
  await wf(inP, Buffer.from(data));
  await new Promise((res, rej) => {
    const c = spawn("dwebp", [inP, "-o", outP], { stdio: "ignore" });
    c.on("error", rej);
    c.on("close", (code) => (code === 0 ? res() : rej(new Error(`dwebp exited ${code}`))));
  });
  try { return await decodeImage(outP); } finally { await rm(inP, { force: true }); await rm(outP, { force: true }); }
}

/** Count placements of `block` after expansion (final material per voxel, last-write-wins). */
function materialCounts(artifact) {
  const occ = artifactOccupancy(artifact);
  const counts = {};
  for (const blk of occ.cells.values()) {
    const b = bareBlock(blk);
    counts[b] = (counts[b] || 0) + 1;
  }
  return counts;
}

/** The DECLARED chimney sub-region, derived from GEOMETRY (T-090-01, no subject constants): a
 *  protruding stack = the columns rising ABOVE the highest roof PLANE. ridgeY = the highest column-top
 *  shared by an 8-connected plateau of >= minPlateau equal-top columns (a roof plane / gable top is at
 *  least a small plane; a chimney or finial footprint is smaller). Region = cells above ridgeY in
 *  columns whose top exceeds it. A build with no protrusion gets an empty region. PURE logic. */
function protrudingStackRegion(occ, { minPlateau = 4 } = {}) {
  const topY = new Map(); // "x,z" → max y
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    const k = `${x},${z}`;
    if (!(topY.has(k)) || topY.get(k) < y) topY.set(k, y);
  }
  // largest-y plateau: 8-connected components of equal-top columns, sized >= minPlateau
  let ridgeY = -Infinity;
  const seen = new Set();
  for (const [start, y0] of topY) {
    if (seen.has(start) || y0 <= ridgeY) continue;
    const comp = [start];
    seen.add(start);
    const stack = [start];
    while (stack.length) {
      const [x, z] = stack.pop().split(",").map(Number);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        if (!dx && !dz) continue;
        const nk = `${x + dx},${z + dz}`;
        if (seen.has(nk) || topY.get(nk) !== y0) continue;
        seen.add(nk); stack.push(nk); comp.push(nk);
      }
    }
    if (comp.length >= minPlateau && y0 > ridgeY) ridgeY = y0;
  }
  if (!Number.isFinite(ridgeY)) return { contains: () => false, columns: new Set(), ridgeY: null };
  const columns = new Set([...topY].filter(([, y]) => y > ridgeY).map(([k]) => k));
  return { contains: ([x, y, z]) => y > ridgeY && columns.has(`${x},${z}`), columns, ridgeY };
}

/** Best-effort GL render at a named angle (no scoring) — the oblique-evidence path (T-090-01). */
async function tryRenderAngle(artifact, angle, label) {
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const [r] = await renderViews(artifact, [angle], { outDir: SUBJ_DIR, label: () => label });
    return { path: r.path.replace(ROOT, "") };
  } catch (e) {
    return { error: e.message };
  }
}

/** Best-effort GL render of the build face → decoded RGBA, or null if headless GL is unavailable. */
async function tryRenderFace(artifact, dir, label, refImg, table, blockTable) {
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const { decodeImage } = await import("../../src/color/palette-extract.mjs");
    const angle = DIR_TO_ANGLE[dir] ?? "front";
    const [r] = await renderViews(artifact, [angle], { outDir: SUBJ_DIR, label: () => label });
    const img = await decodeImage(r.path);
    const score = refImg ? faceResemblance(img, refImg, blockTable, { artifact }) : null;
    return { path: r.path.replace(ROOT, ""), score };
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  const refine = process.argv.includes("--refine");
  const offline = process.argv.includes("--offline");
  await mkdir(SUBJ_DIR, { recursive: true });

  if (offline) {
    const recPath = join(OUT_DIR, "cottage.json");
    if (!existsSync(recPath)) throw new Error("spray-paint/cottage.json absent — run the live pass first");
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const reversalOk = rec.plaster.after >= rec.plaster.before && rec.plaster.after > 8;
    const h = rec.zones?.histogram?.masked;
    const zoneOk = !h || (h.base === 0 && h.roof === 0); // base/roof surface plaster must be 0 when recorded
    // T-085-01: the zone-filled upper dominant coverage must beat the splat-only baseline when recorded
    // (the 9%→≈77% reversal is reproducible from the record; the threshold gate itself is S-088).
    const cov = rec.zones?.coverage;
    const covOk = !cov ||
      (cov.zoneFilled?.upper?.dominantFraction ?? 0) > (cov.splatOnly?.upper?.dominantFraction ?? 0);
    // T-088-01: the coverage gate's proof both ways must hold in the record — the splat-only replay
    // REJECTED, the zone-filled skin PASSED (skip-if-absent so pre-gate records degrade gracefully).
    const cg = rec.zones?.coverageGate;
    const covGateOk = !cg || (cg.splatOnly?.passed === false && cg.zoneFilled?.passed === true);
    // T-090-01: the full-shell band acceptance must hold in the record — roof reads >= target roof
    // materials, the upper band's displaced-field residue is bounded (skip-if-absent for old records).
    const bands = rec.zones?.bands;
    const bandsOk = !bands ||
      ((bands.acceptance?.roofMaterialsFraction ?? 0) >= (bands.thresholds?.roofMaterialsTarget ?? 0.9) &&
       (bands.acceptance?.upperStoneFraction ?? 1) <= (bands.thresholds?.upperResidueMax ?? 0.05));
    const ok = reversalOk && zoneOk && covOk && covGateOk && bandsOk;
    console.error(`[offline] plaster ${rec.plaster.before}→${rec.plaster.after}; reversal ${reversalOk ? "CONFIRMED" : "NOT confirmed"}` +
      (h ? `; zone histogram masked=${JSON.stringify(h)} (base/roof=0 ${zoneOk ? "OK" : "VIOLATED"})` : "") +
      (cov ? `; upper dominant coverage splat-only ${cov.splatOnly?.upper?.dominantFraction} → zone-filled ${cov.zoneFilled?.upper?.dominantFraction} (${covOk ? "OK" : "NOT improved"})` : "") +
      (cg ? `; coverage gate @${cg.threshold}: splat-only ${cg.splatOnly?.passed ? "PASSED (unexpected)" : "rejected"} / zone-filled ${cg.zoneFilled?.passed ? "passed" : "REJECTED (unexpected)"} (${covGateOk ? "OK" : "VIOLATED"})` : "") +
      (bands ? `; full-shell bands: roof materials ${bands.acceptance?.roofMaterialsFraction} / upper residue ${bands.acceptance?.upperStoneFraction} (${bandsOk ? "OK" : "VIOLATED"})` : ""));
    if (!ok) process.exitCode = 1;
    return;
  }

  if (!existsSync(ART_PATH)) throw new Error(`${ART_PATH} absent`);
  const raw = JSON.parse(await readFile(ART_PATH, "utf8"));
  const manifest = raw.palette?.manifest ?? [];
  const allowed = allowedPalette(raw); // the "4 cans" — manifest (no add-back needed; plaster is in it)
  const palette = paletteFromManifest(manifest);
  const blockTable = loadBlockTable();

  // --- 0. SEAL BEFORE PAINT (T-079-02 AC #3) ------------------------------------------------------
  // Strip stray specks + seal skin/roof holes FIRST, so paint never lands on a stray (no floating
  // painted blocks) and runs on a complete skin. Inline (no cross-ticket file dep) — the seal ops are
  // pure. `artifact`/`occ` below are the SEALED build; all downstream work uses it.
  const rawOcc = artifactOccupancy(raw);
  const artifact = applyDeltas(raw, [...sealRoof(rawOcc).placements, ...sealWalls(rawOcc).placements]);
  const occ = artifactOccupancy(artifact);
  const before = materialCounts(artifact);
  console.error(`cottage: raw ${raw.placements.length} → sealed ${artifact.placements.length} placements; plaster(${PLASTER}) before = ${before.white_terracotta ?? 0}`);

  // --- 0b. STRUCTURAL ZONE MASK (T-079-02 AC #1) --------------------------------------------------
  // Derive base/upper/roof from the structural read; map each zone → its SPLAT materials ∩ the manifest
  // (secondaries only — the dominants are the zone-fill's job, §0c). The legacy map (dominants included)
  // is built alongside, solely for the splat-only baseline replay in §2b.
  const { zoneOf, storeyDivide } = structuralZones(occ);
  const allowedByZone = new Map(
    Object.entries(ZONE_POLICY).map(([z, p]) => [z, new Set(p.splat.filter((b) => allowed.has(b)))]),
  );
  const legacyByZone = new Map(
    Object.entries(LEGACY_ZONE_MATERIALS).map(([z, mats]) => [z, new Set(mats.filter((b) => allowed.has(b)))]),
  );
  console.error(`zones: storeyDivide=${storeyDivide}; splat palettes base={${[...allowedByZone.get("base")].join(",")}} upper={${[...allowedByZone.get("upper")].join(",")}} roof={${[...allowedByZone.get("roof")].join(",")}}`);

  // --- 0c. THE FULL-SHELL ZONE-FILL BASE COAT (T-085-01, skin upgraded by T-090-01) ----------------
  // Deterministically establish each zone's dominant BEFORE any splat — on the FULL EXPOSED SHELL
  // (skin:"exposure", every cell with any of its 6 faces air-exposed), not just the five-camera
  // projection skin: the old wall-field fill covered the surfaces one enumeration found, and the camera
  // found the rest (grey side faces of the stepped roof courses at every oblique azimuth). Exposure ⊇
  // projection, so this REPLACES the E-24 stage rather than stacking on it (implementer's call, ticket
  // AC #2). Secondary RUNS (studs, quoins, chimney, gable framing) are kept. Recolor-only, so every
  // projection below has identical geometry. The old projection-skin fill is kept as a REPLAY
  // (`basedProjection`) — the before-baseline for the T-090-01 band histograms and oblique renders.
  const fillZones = Object.fromEntries(
    Object.entries(ZONE_POLICY).map(([z, p]) => [z, { dominant: p.dominant, preserve: p.preserve }]),
  );
  for (const [z, p] of Object.entries(fillZones)) {
    if (!allowed.has(p.dominant)) throw new Error(`zone-fill: ${z} dominant "${p.dominant}" not in the build manifest`);
  }
  // THE DECLARED SUB-REGION: the chimney (the stack protruding above the highest roof plane) keeps its
  // material — cobble shaft + cap — while every OTHER roof-zone cobble/bricks fragment is jumble and
  // gets filled (the material map binds those blocks to quoins/plinth/chimney, never the roof field).
  const chimney = protrudingStackRegion(occ);
  const regions = [{ name: "chimney", contains: chimney.contains }];
  console.error(`declared sub-region "chimney": ridgeY=${chimney.ridgeY}, ${chimney.columns.size} protruding columns`);
  const fill = zoneFill(occ, { zoneOf, zones: fillZones, skin: "exposure", regions });
  const based = applyPaint(artifact, fill.placements);
  const occBased = artifactOccupancy(based);
  // the old wall-field fill replayed with ITS OWN era's policy — the faithful "before"
  const fillProjection = zoneFill(occ, { zoneOf, zones: LEGACY_FILL_ZONES });
  const basedProjection = applyPaint(artifact, fillProjection.placements);
  console.error(`full-shell zone-fill base coat: ${fill.placements.length} cells filled, ${fill.kept} kept ` +
    `(region-kept ${JSON.stringify(fill.byRegion)}) — ` +
    Object.entries(fill.byZone).map(([z, s]) => `${z} ${s.filled}/${s.surface}`).join(", ") +
    ` (legacy projection-skin replay fills ${fillProjection.placements.length})`);

  // --- 1. per-face material targets ---------------------------------------------------------------
  // FRONT (+z): the concept is the truth → quantize it to the face cell-grid (within the manifest), resample.
  const frontGrid = projectSurface(occBased, "+z");
  const conceptRes = await quantizeToFace(CONCEPT_PATH, frontGrid, { manifest });
  const frontTarget = resampleBlockGrid(conceptRes.grid, conceptRes.n, conceptRes.m, frontGrid.n, frontGrid.m).grid;
  console.error(`front target: concept quantized ${conceptRes.n}×${conceptRes.m} → face ${frontGrid.n}×${frontGrid.m}, outOfPalette=${conceptRes.outOfPalette}`);

  // SIDE (+x): the concept never shows it → textured-GLB splat, same dir, in voxel space.
  const sideGrid = projectSurface(occBased, "+x");
  let sideSplat = null;
  try {
    sideSplat = await loadGlbSplat(GLB_PATH, sideGrid, "+x", { palette, decodeTexture });
    console.error(`side target: GLB splat ${sideGrid.n}×${sideGrid.m}, sourceFilled=${sideSplat.sourceFilled}`);
  } catch (e) {
    console.error(`side GLB splat skipped: ${e.message}`);
  }

  // --- 2. paint passes (back-projection, SECONDARIES over the base coat) — splat ∩ zone policy -----
  const frontPass = paintFace(occBased, "+z", frontTarget, { allowed, source: "concept", zoneOf, allowedByZone });
  const sidePass = sideSplat
    ? paintFace(occBased, "+x", sideSplat.grid, { allowed, source: "glb", zoneOf, allowedByZone })
    : { dir: "+x", source: "glb", placements: [], painted: 0, skipped: 0, offPalette: 0, zoneRejected: 0 };
  console.error(`paint (secondaries over the coat): front ${frontPass.painted} cells (zoneRejected ${frontPass.zoneRejected}), side ${sidePass.painted} cells (zoneRejected ${sidePass.zoneRejected})`);

  // --- 2b. THE PROOFS (both replayed on the pre-fill sealed build) ---------------------------------
  // (a) the splat WITHOUT the zone mask — the original smear (T-079-02's before).
  const frontUnmasked = paintFace(occ, "+z", frontTarget, { allowed, source: "concept" });
  const sideUnmasked = sideSplat ? paintFace(occ, "+x", sideSplat.grid, { allowed, source: "glb" }) : { placements: [] };
  const unmaskedBuild = applyPaint(artifact, mergePaints([sideUnmasked, frontUnmasked].filter((p) => (p.placements?.length ?? 0) > 0), { priority: ["concept", "glb"] }).placements);
  const histUnmasked = surfacePlasterByZone(unmaskedBuild, zoneOf);   // plaster smeared into base/roof
  console.error(`histogram (surface plaster by zone): UNMASKED ${JSON.stringify(histUnmasked)}`);
  // (b) the zone-masked splat WITHOUT the fill — the shipped T-079-02 path, i.e. what `npm run` used to
  // produce: the "(was 9%)" coverage baseline the zone-fill is measured against (T-085-01 AC #3).
  const frontLegacy = paintFace(occ, "+z", frontTarget, { allowed, source: "concept", zoneOf, allowedByZone: legacyByZone });
  const sideLegacy = sideSplat ? paintFace(occ, "+x", sideSplat.grid, { allowed, source: "glb", zoneOf, allowedByZone: legacyByZone }) : { placements: [] };
  const splatOnlyBuild = applyPaint(artifact, mergePaints([sideLegacy, frontLegacy].filter((p) => (p.placements?.length ?? 0) > 0), { priority: ["concept", "glb"] }).placements);
  const covSplatOnly = dominantCoverage(
    surfaceZoneHistogram(artifactOccupancy(splatOnlyBuild), zoneOf, { skin: "exposure" }), ZONE_POLICY);
  console.error(`coverage (splat-only baseline): ${coverageLine(covSplatOnly)}`);
  // T-088-01 proof, the REJECT side: the under-applied splat-only skin must fail the coverage gate —
  // and the verdict is delta-independent (no resemblance number can rescue a missing base coat).
  const gateSplatOnly = coverageGate(covSplatOnly, { threshold: COVERAGE_THRESHOLD, zones: ZONE_POLICY });
  console.error(`coverage gate (splat-only baseline): ${gateSplatOnly.passed ? "PASS (unexpected)" : "FAIL"} — ` +
    gateSplatOnly.failures.map((f) => `${f.zone} ${f.dominant}=${f.fraction} < ${COVERAGE_THRESHOLD}`).join(", "));

  // --- 3. optional metered LLM refine (the one metered call; default off) --------------------------
  // T-079-02: the GUARD is the structural invariant (splat ∩ zone mask + the base/roof=0 THROW below),
  // NOT this refine pass — the shipped defect was structural (no storey axis), so the zone mask is the
  // fix; refine stays an optional polish, not the thing standing between us and a pink blob.
  let refineNote = "skipped (optional polish; the structural zone mask + base/roof=0 throw are the guard)";
  if (refine) {
    refineNote = "requested — face-vs-face refinement is the metered call (LLM corrects the splat, palette+zone-gated). " +
      "Wired through requestTextWithImage in a follow-up; the splat ∩ zone path stands alone without it.";
    console.error(`[refine] ${refineNote}`);
  }

  // --- 4. per-face accept-if-closer gate (front vs concept; E-22, P14-safe) ------------------------
  const conceptImg = await (async () => {
    try { return await (await import("../../src/color/palette-extract.mjs")).decodeImage(CONCEPT_PATH); }
    catch { return null; }
  })();
  const faceRecords = [];

  // FRONT: gate the concept paint against the concept itself. "Before" = the base-coated build — the
  // gate now measures the splat's MARGINAL contribution over the coat, not the coat itself.
  const frontBeforeR = await tryRenderFace(based, "+z", "front-before", conceptImg, palette, blockTable);
  const frontCandidate = applyPaint(based, frontPass.placements);
  const frontAfterR = await tryRenderFace(frontCandidate, "+z", "front-after", conceptImg, palette, blockTable);
  // T-088-01: the coverage PRECONDITION runs AHEAD of the hill-climb — the candidate skin must show
  // every zone's intended dominant at >= threshold before the marginal delta is even consulted (a
  // 0.25→0.40 can no longer rubber-stamp a 91%-bare wall). GL-free, so it binds even when the
  // resemblance score is blind.
  const covFrontCandidate = dominantCoverage(
    surfaceZoneHistogram(artifactOccupancy(frontCandidate), zoneOf, { skin: "exposure" }), ZONE_POLICY);
  const frontGate = acceptWithCoverage({
    coverage: covFrontCandidate, threshold: COVERAGE_THRESHOLD, zones: ZONE_POLICY,
    before: frontBeforeR.score?.score ?? null,
    after: frontAfterR.score?.score ?? null,
  });
  // P14: with the coverage precondition PASSED, accept the front paint when it moves toward the concept
  // OR when the resemblance gate is blind (no GL ref) — in the GL-blind case the splat IS the concept
  // truth (the band is in the concept), recorded as such. A coverage failure rejects in every case.
  const gateBlind = (frontBeforeR.score?.score ?? null) == null;
  const frontAccepted = frontGate.reason === "coverage" ? false : gateBlind ? true : frontGate.accepted;
  faceRecords.push({
    face: "front (+z)", source: "concept", painted: frontPass.painted, skipped: frontPass.skipped,
    offPalette: frontPass.offPalette, zoneRejected: frontPass.zoneRejected, before: frontBeforeR, after: frontAfterR, gate: frontGate,
    coverageGate: { passed: frontGate.coverage.passed, threshold: COVERAGE_THRESHOLD, failures: frontGate.coverage.failures },
    accepted: frontAccepted, gateBlind,
  });

  // SIDE: the GLB is the truth (no concept face to gate against) — apply the splat paint, render for the record.
  const sideBeforeR = await tryRenderFace(based, "+x", "side-before", null, palette, blockTable);
  const sideCandidate = applyPaint(based, sidePass.placements);
  const sideAfterR = await tryRenderFace(sideCandidate, "+x", "side-after", null, palette, blockTable);
  const sideAccepted = sidePass.painted > 0;
  faceRecords.push({
    face: "side (+x)", source: "glb", painted: sidePass.painted, skipped: sidePass.skipped,
    offPalette: sidePass.offPalette, zoneRejected: sidePass.zoneRejected, before: sideBeforeR, after: sideAfterR,
    accepted: sideAccepted, note: "no concept face for this side — the textured GLB is the truth; gated by-construction",
  });

  // --- 5. commit the accepted passes (corner precedence: concept > glb) ----------------------------
  const acceptedPasses = [];
  if (sideAccepted) acceptedPasses.push(sidePass); // glb first; concept wins corners on merge
  if (frontAccepted) acceptedPasses.push(frontPass);
  const merged = mergePaints(acceptedPasses, { priority: ["concept", "glb"] });
  // Strip off-zone plaster (pre-existing base/roof strays) FIRST so the concept/glb paint wins any
  // collision; together they make base/roof plaster = 0 by construction. The fill itself never emits
  // off-zone plaster (only "upper"'s dominant is plaster), so stripping the base-coated occ is safe.
  const stripPlacements = stripOffZonePlaster(occBased, zoneOf, allowed);
  const painted = applyPaint(based, [...stripPlacements, ...merged.placements]);
  assertArtifact(painted); // AC #7: the painted build is still AJV-valid

  // --- 5b. THE STRUCTURAL GUARD (T-079-02 AC #4): plaster must be confined to the upper storey. The
  // zone mask makes off-zone paint impossible by construction; this THROW (mirroring the milestone's
  // exteriorHeld) guarantees it can never silently ship — a marginal resemblance number cannot rubber-
  // stamp a zone-wrong skin. Measured on the SURFACE (the visible skin); interior strays are pre-existing.
  const histMasked = surfacePlasterByZone(painted, zoneOf);
  const interiorStrays = interiorPlaster(painted);
  console.error(`off-zone plaster stripped from skin: ${stripPlacements.length}`);
  console.error(`histogram (surface plaster by zone): MASKED ${JSON.stringify(histMasked)} (interior strays ${interiorStrays}, untouched)`);
  if (histMasked.base !== 0 || histMasked.roof !== 0) {
    throw new Error(`zone violation: plaster on base/roof surface (base=${histMasked.base}, roof=${histMasked.roof}) — the splat∩zone mask failed`);
  }
  // THE T-085-01 EVIDENCE: per-zone dominant coverage of the final skin vs the splat-only baseline —
  // the 9%→≈77% reversal, produced by the pipeline (Rule 1), GL-free.
  // The census basis is the EXPOSURE skin from here on (T-090-01): the projection census declared the
  // upper band 71% plaster while the camera saw 32% — the exposure census is the camera's truth.
  const covFilled = dominantCoverage(
    surfaceZoneHistogram(artifactOccupancy(painted), zoneOf, { skin: "exposure" }), ZONE_POLICY);
  console.error(`coverage (zone-filled, final): ${coverageLine(covFilled)}`);
  // T-088-01 proof, the PASS side + the guard: the shipped skin must clear the coverage gate, and a
  // failing skin must never silently ship a record (same precedent as the base/roof-plaster throw —
  // a marginal resemblance number cannot substitute for the base coat).
  const gateZoneFilled = coverageGate(covFilled, { threshold: COVERAGE_THRESHOLD, zones: ZONE_POLICY });
  console.error(`coverage gate (zone-filled, final): ${gateZoneFilled.passed ? "PASS" : "FAIL"} @ threshold ${COVERAGE_THRESHOLD}`);
  if (!gateZoneFilled.passed) {
    throw new Error(`coverage gate FAILED on the final skin: ` +
      gateZoneFilled.failures.map((f) => `${f.zone} ${f.dominant}=${f.fraction} < ${COVERAGE_THRESHOLD}`).join(", "));
  }
  console.error(`coverage upper ${ZONE_POLICY.upper.dominant}: splat-only ${Math.round((covSplatOnly.upper?.dominantFraction ?? 0) * 100)}% → zone-filled ${Math.round((covFilled.upper?.dominantFraction ?? 0) * 100)}%`);

  // --- 5c. THE T-090-01 BAND EVIDENCE: before/after composition of the full exposed shell ----------
  // BEFORE = the projection-skin fill replay (what the old wall-field stage shipped), AFTER = the
  // painted build — both measured with the SAME instrument (6-dir exposure per zone, the ticket's
  // measurement). Acceptance: roof reads >= ROOF_BAND_TARGET roof materials (dominant + preserve;
  // chimney cobble/bricks are declared preserve), upper's displaced-field residue <= UPPER_RESIDUE_MAX.
  const bandsBefore = dominantCoverage(
    surfaceZoneHistogram(artifactOccupancy(basedProjection), zoneOf, { skin: "exposure" }), ZONE_POLICY);
  const bandsAfter = covFilled; // the final skin, same exposure census as the coverage gate above
  const residueBlock = ZONE_POLICY.base.dominant; // the displaced field that collapsed into the upper band
  // One instrument, chimney-aware: walk the exposure skin; roof fraction = (dominant+preserve) cells
  // over roof-zone cells OUTSIDE the declared chimney region; upper residue = displaced-field fraction.
  const roofMats = new Set([ZONE_POLICY.roof.dominant, ...ZONE_POLICY.roof.preserve].map(bareBlock));
  const measureBands = (build) => {
    let roofTotal = 0, roofOk = 0, chimneyCells = 0, upperTotal = 0, upperResidue = 0;
    for (const { voxel, block } of exposedVoxelEntries(artifactOccupancy(build))) {
      const zn = zoneOf(voxel);
      if (zn === "roof") {
        if (chimney.contains(voxel)) { chimneyCells++; continue; }
        roofTotal++;
        if (roofMats.has(bareBlock(block))) roofOk++;
      } else if (zn === "upper") {
        upperTotal++;
        if (bareBlock(block) === residueBlock) upperResidue++;
      }
    }
    return {
      roofMaterialsFraction: roofTotal ? Math.round((roofOk / roofTotal) * 1000) / 1000 : null,
      upperStoneFraction: Math.round((upperResidue / (upperTotal || 1)) * 1000) / 1000,
      roofTotal, chimneyCells, upperTotal,
    };
  };
  const measuredBefore = measureBands(basedProjection);
  const acceptance = measureBands(painted);
  console.error(`bands (6-dir exposure, chimney excepted): roof materials ${Math.round((measuredBefore.roofMaterialsFraction ?? 0) * 100)}% → ` +
    `${Math.round((acceptance.roofMaterialsFraction ?? 0) * 100)}% (target >= ${ROOF_BAND_TARGET}); ` +
    `upper ${residueBlock} residue ${Math.round(measuredBefore.upperStoneFraction * 100)}% → ` +
    `${Math.round(acceptance.upperStoneFraction * 100)}% (max ${UPPER_RESIDUE_MAX})`);
  if ((acceptance.roofMaterialsFraction ?? 0) < ROOF_BAND_TARGET || acceptance.upperStoneFraction > UPPER_RESIDUE_MAX) {
    throw new Error(`full-shell band acceptance FAILED: roof materials ${acceptance.roofMaterialsFraction} ` +
      `(target >= ${ROOF_BAND_TARGET}), upper ${residueBlock} residue ${acceptance.upperStoneFraction} (max ${UPPER_RESIDUE_MAX})`);
  }

  // The oblique renders ARE the evidence (E-25 Rule 1): an azimuth the old fill failed on. 135° at a
  // low 15° elevation sees the +x/-z roof course side faces and the scattered cobble the projection
  // skin never cleaned (measured the most-changed of the ticket's candidate azimuths). Best-effort like
  // the face renders (a headless-GL failure degrades to a recorded gap).
  const OBLIQUE_ANGLE = { azimuthDeg: 135, elevationDeg: 15 };
  const obliqueBefore = await tryRenderAngle(basedProjection, OBLIQUE_ANGLE, "oblique135-before");
  const obliqueAfter = await tryRenderAngle(painted, OBLIQUE_ANGLE, "oblique135-after");
  console.error(`oblique 135° renders: before ${obliqueBefore.path ?? obliqueBefore.error}, after ${obliqueAfter.path ?? obliqueAfter.error}`);

  await writeFile(join(SUBJ_DIR, "artifact.json"), JSON.stringify(painted, null, 2) + "\n");

  const after = materialCounts(painted);
  const reversal = (after.white_terracotta ?? 0) > (before.white_terracotta ?? 0) && (after.white_terracotta ?? 0) > 8;
  console.error(`plaster(${PLASTER}) after = ${after.white_terracotta ?? 0} — 215→8 regression ${reversal ? "REVERSED" : "not reversed"}`);

  // --- 6. the durable record ----------------------------------------------------------------------
  const record = {
    schema: "spray-paint/v1",
    subject: "cottage",
    inputs: {
      build: ART_PATH.replace(ROOT, ""), concept: CONCEPT_PATH.replace(ROOT, ""), glb: GLB_PATH.replace(ROOT, ""),
    },
    palette: { allowed: [...allowed].sort(), additions: [] },
    sealed: { raw: raw.placements.length, sealed: artifact.placements.length },
    fill: {
      policy: ZONE_POLICY,
      minRun: 2,
      skin: "exposure",
      placements: fill.placements.length,
      projectionReplayPlacements: fillProjection.placements.length,
      kept: fill.kept,
      byZone: fill.byZone,
      byRegion: fill.byRegion,
      regions: { chimney: { ridgeY: chimney.ridgeY, protrudingColumns: chimney.columns.size,
        note: "declared sub-region, derived from geometry (the stack protruding above the highest " +
          "roof plane) — keeps its material unconditionally; cobble/bricks anywhere else in the roof " +
          "zone are jumble and get filled (the material map binds them to quoins/plinth/chimney)." } },
      note: "the deterministic zone-fill base coat (T-085-01), upgraded to the FULL EXPOSED SHELL " +
        "(T-090-01, skin:exposure — every cell with any of its 6 faces air-exposed, replacing the " +
        "five-camera projection skin the old wall-field fill used): each zone's dominant established " +
        "ahead of the splat; secondary runs (studs, quoins, chimney, gable framing) kept; the splat " +
        "demoted to secondaries (its palette excludes every field material).",
    },
    zones: {
      storeyDivide,
      materials: ZONE_POLICY,
      histogram: { masked: histMasked, unmasked: histUnmasked }, // surface plaster by zone (before/after the fix)
      coverage: { skin: "exposure", splatOnly: covSplatOnly, zoneFilled: covFilled }, // per-zone dominant coverage (T-085-01; exposure basis since T-090-01)
      coverageGate: { // the threshold PRECONDITION (T-088-01): proof both ways, delta-independent
        threshold: COVERAGE_THRESHOLD,
        splatOnly: gateSplatOnly,   // expect passed:false — the under-applied E-23 skin is REJECTED
        zoneFilled: gateZoneFilled, // expect passed:true  — the base-coated skin clears the precondition
        note: "coverage is a PRECONDITION ahead of the per-face hill-climb, not a tie-breaker: any zone " +
          "whose intended dominant covers < threshold of its visible skin fails the skin regardless of " +
          "the marginal resemblance delta (the 0.25→0.40 that rubber-stamped the 91%-bare wall cannot " +
          "pass it). splatOnly replays the pre-fill path; zoneFilled is the shipped skin.",
      },
      bands: { // T-090-01: before/after composition of the full exposed shell, one instrument both ways
        skin: "exposure",
        measuredOn: {
          before: "legacy projection-fill replay (the shipped T-085 wall-field base coat + its era's policy)",
          after: "the painted build",
        },
        before: bandsBefore,
        after: bandsAfter,
        acceptanceBefore: measuredBefore,
        acceptance,
        thresholds: { roofMaterialsTarget: ROOF_BAND_TARGET, upperResidueMax: UPPER_RESIDUE_MAX, residueBlock },
        note: "roofMaterialsFraction = (dominant + preserve) cells over the roof zone's exposed shell " +
          "EXCLUDING the declared chimney sub-region (the ticket's exception); upperStoneFraction = " +
          "the displaced base field's residue on the upper zone's exposed shell. Same instrument " +
          "before and after.",
      },
      offZonePlasterStripped: stripPlacements.length,
      interiorStrays,
      note: "histogram = surface plaster per structural zone. MASKED (this fix) confines plaster to 'upper' " +
        "(base=0, roof=0); UNMASKED (the shipped color-only splat) smears it into base+roof. Interior strays " +
        "are pre-existing, not on any face, and untouched by seal/paint — not the visible defect. " +
        "coverage = per-zone dominant fraction of the visible skin: splatOnly replays the pre-fill " +
        "T-079-02 path (the 9% baseline); zoneFilled is the shipped base-coat result.",
    },
    plaster: { block: PLASTER, before: before.white_terracotta ?? 0, after: after.white_terracotta ?? 0, reversed: reversal },
    materialCounts: { before, after },
    cornerCollisions: merged.collisions,
    renders: {
      oblique: { angle: OBLIQUE_ANGLE, azimuthDeg: OBLIQUE_ANGLE.azimuthDeg, before: obliqueBefore, after: obliqueAfter,
        note: "the T-090-01 evidence: an azimuth the old wall-field fill failed on — grey roof course " +
          "side faces before, zone materials after. The render is the evidence; the histogram is support." },
    },
    faces: faceRecords,
    refine: refineNote,
    note: "the splat does the bulk; the LLM refines/judges (twodee-interaction-sector). Verdict = the human face " +
      "triptych + categorical judge (E-22 Rule 2); these scores are the per-face hill-climb nudge.",
  };
  await writeFile(join(OUT_DIR, "cottage.json"), JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "cottage.md"), renderMd(record));
  console.error(`\n✓ wrote ${join(OUT_DIR, "cottage.json")} + artifact.json`);
}

function renderMd(r) {
  const f = r.faces.map((x) =>
    `- **${x.face}** (${x.source}): painted ${x.painted}, skipped ${x.skipped}, offPalette ${x.offPalette}, ` +
    `zoneRejected ${x.zoneRejected ?? 0}, accepted=${x.accepted}` +
    (x.before?.score ? ` · resemblance ${x.before.score.score}→${x.after?.score?.score ?? "?"}` : ` · ${x.before?.error ? "GL unavailable (gate blind)" : (x.note ?? "")}`),
  ).join("\n");
  const z = r.zones;
  const histLine = (h) => `base ${h.base}, upper ${h.upper}, roof ${h.roof}`;
  const pct = (f) => (f == null ? "?" : `${Math.round(f * 100)}%`);
  const covLine = (cov) => ["base", "upper", "roof"]
    .map((zn) => `${zn} \`${cov[zn]?.dominant}\` ${pct(cov[zn]?.dominantFraction)} of ${cov[zn]?.total ?? "?"}`)
    .join(" · ");
  const fillMd = r.fill ? `## Zone-fill base coat (T-085-01)\n` +
    `Deterministic fill of each zone's dominant on the visible skin, ahead of the splat: ` +
    `**${r.fill.placements} cells filled**, ${r.fill.kept} kept (secondary runs + already-dominant). ` +
    Object.entries(r.fill.byZone).map(([zn, s]) => `${zn} ${s.filled}/${s.surface}`).join(", ") + `.\n` +
    `Per-zone dominant coverage of the skin:\n` +
    `- **splat-only (the pre-fill pipeline):** ${covLine(z.coverage.splatOnly)}\n` +
    `- **zone-filled (this fix):** ${covLine(z.coverage.zoneFilled)}\n` +
    `- upper-band plaster: **${pct(z.coverage.splatOnly.upper?.dominantFraction)} → ` +
    `${pct(z.coverage.zoneFilled.upper?.dominantFraction)}** — the splat places secondaries only ` +
    `(upper palette = ${JSON.stringify(r.fill.policy.upper.splat)}).\n\n` : "";
  const bands = z?.bands;
  const bandLine = (cov) => ["base", "upper", "roof"].map((zn) => {
    const top = Object.entries(cov[zn]?.byBlock ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([b, n]) => `${b} ${Math.round((n / cov[zn].total) * 100)}%`).join(" ");
    return `${zn} (${cov[zn]?.total ?? "?"}): ${top}`;
  }).join("\n  - ");
  const bandsMd = bands ? `## Full-shell fill (T-090-01)\n` +
    `The base coat now covers the FULL exposed shell (6-dir exposure — every face any camera can see), ` +
    `not just the five-camera projection skin (${r.fill?.projectionReplayPlacements ?? "?"} cells) the ` +
    `old wall-field fill painted; this run filled **${r.fill?.placements ?? "?"} cells**.\n` +
    `Exposed-shell composition, same instrument before/after:\n` +
    `- **before (projection-fill replay):**\n  - ${bandLine(bands.before)}\n` +
    `- **after (the painted build):**\n  - ${bandLine(bands.after)}\n` +
    `- **acceptance (chimney sub-region excepted):** roof materials ` +
    `${pct(bands.acceptanceBefore?.roofMaterialsFraction)} → **${pct(bands.acceptance.roofMaterialsFraction)}** ` +
    `(target ≥ ${pct(bands.thresholds.roofMaterialsTarget)}); upper \`${bands.thresholds.residueBlock}\` residue ` +
    `${pct(bands.acceptanceBefore?.upperStoneFraction)} → **${pct(bands.acceptance.upperStoneFraction)}** ` +
    `(max ${pct(bands.thresholds.upperResidueMax)}).\n` +
    (r.renders?.oblique ? `- **evidence renders (azimuth ${r.renders.oblique.azimuthDeg}°):** ` +
      `${r.renders.oblique.before.path ?? r.renders.oblique.before.error} → ` +
      `${r.renders.oblique.after.path ?? r.renders.oblique.after.error}\n\n` : "\n") : "";
  const cg = z?.coverageGate;
  const gateMd = cg ? `## Coverage gate (T-088-01)\n` +
    `Per-zone dominant coverage is a **precondition** ahead of the per-face hill-climb (threshold ` +
    `**${cg.threshold}** of the zone's visible skin) — proof both ways:\n` +
    `- **splat-only replay (the E-23 under-applied skin): ${cg.splatOnly.passed ? "PASSED (unexpected)" : "REJECTED"}** — ` +
    cg.splatOnly.failures.map((f) => `${f.zone} \`${f.dominant}\` ${pct(f.fraction)} < ${pct(cg.threshold)}`).join(", ") +
    `. Delta-independent: even the historically accepted marginal 0.25→0.40 front delta cannot pass it.\n` +
    `- **zone-filled skin (the shipped base coat): ${cg.zoneFilled.passed ? "PASSED" : "REJECTED (unexpected)"}** — ` +
    `every zone's dominant ≥ ${pct(cg.threshold)} of its skin.\n\n` : "";
  const zoneMd = z ? `## Zone mask (T-079-02)\n` +
    `storeyDivide = y${z.storeyDivide}. Surface plaster by zone:\n` +
    `- **masked (this fix):** ${histLine(z.histogram.masked)} → plaster confined to the upper storey (base 0, roof 0).\n` +
    `- **unmasked (the shipped color-only splat):** ${histLine(z.histogram.unmasked)} → smeared into base + roof.\n` +
    `- interior strays (pre-existing, not on any face, untouched): ${z.interiorStrays}.\n\n` : "";
  return `# Spray-paint — cottage (T-079-02)\n\n` +
    `Plaster (\`${r.plaster.block}\`): **${r.plaster.before} → ${r.plaster.after}** — ` +
    `the 215→8 regression ${r.plaster.reversed ? "**reversed**" : "NOT reversed"}.\n\n` +
    (r.sealed ? `Sealed before paint: ${r.sealed.raw} → ${r.sealed.sealed} placements (seal then paint).\n\n` : "") +
    fillMd + bandsMd + gateMd + zoneMd +
    `Enforced palette ("4 cans"): ${r.palette.allowed.join(", ")}.\n` +
    `Corner collisions resolved (concept > glb): ${r.cornerCollisions}.\n\n## Faces\n${f}\n\n` +
    `Refine: ${r.refine}\n\n> ${r.note}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
