// Live GL proof for the E-23 view layer (T-078-01, AC #5). Loads the built cottage, runs the PURE
// structural read + Path-P surface grid (asserting the back-projection round-trip on real data), renders
// a MULTI-ANGLE set through the E-22 fixed lens, and demonstrates the same-angle reference quantize. All
// outputs land under docs/active/work/T-078-01/. Run: `npm run view:proof`.
//
// This is the one metered/GL entry point; the pure cores it exercises are unit-tested offline.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { structuralRead, openings } from "../../src/view/structural-read.mjs";
import { projectSurface, backProject } from "../../src/view/surface-grid.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { quantizeToFace } from "../../src/view/reference-quantize.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const ART_PATH = join(ROOT, "benchmarks/sculpture/concept-materials/cottage/after-artifact.json");
const OUT_DIR = join(ROOT, "docs/active/work/T-078-01");

function summarizeRead(r) {
  return {
    footprint: { width: r.footprint.width, depth: r.footprint.depth, columns: r.footprint.area },
    storeyBands: {
      bandCount: r.storeyBands.bands.length,
      bands: r.storeyBands.bands,
      floorLines: r.storeyBands.floorLines,
    },
    roofRegion: { coverage: r.roofRegion.coverage, yRange: r.roofRegion.yRange, cells: r.roofRegion.cells.length },
    wallFields: Object.fromEntries(
      Object.entries(r.wallFields.faces).map(([dir, f]) => [
        dir,
        { surfaceCells: f.surfaceCells.length, holes: f.holes.length, blocks: Object.keys(f.blockCounts).length },
      ]),
    ),
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const artifact = JSON.parse(await readFile(ART_PATH, "utf8"));
  const manifest = artifact.palette?.manifest ?? [];
  console.error(`Loaded cottage: ${artifact.placements.length} placements, ${manifest.length} blocks in manifest.`);

  // --- pure structural read on the real build -----------------------------------------------------
  const occ = artifactOccupancy(artifact);
  console.error(`Occupancy: ${occ.size} voxels, dims ${occ.dims.join("×")}, bounds ${JSON.stringify(occ.bounds)}`);
  const read = structuralRead(occ);
  const readSummary = summarizeRead(read);
  console.error("Structural read:", JSON.stringify(readSummary, null, 2));

  // openings per side elevation
  const openingsByFace = {};
  for (const dir of ["+x", "-x", "+z", "-z"]) {
    const o = openings(occ, dir);
    openingsByFace[dir] = o;
    console.error(`openings ${dir}: ${o.length} (${o.map((x) => x.kind).join(",") || "none"})`);
  }

  // --- Path-P surface grid + back-projection round-trip on real data -------------------------------
  const front = projectSurface(occ, "-z");
  const back = backProject(front);
  // round-trip: every back-projected voxel is occupied AND is the front-most in its column (no occupied
  // voxel nearer the camera in the same column). Verify membership + count == filled cells.
  let allOccupied = true;
  for (const v of back) if (!occ.has(...v.pos)) { allOccupied = false; break; }
  const roundTrip = { dir: "-z", filledCells: front.filled, backProjected: back.length, allOccupied, identity: back.length === front.filled && allOccupied };
  console.error(`Path-P -z face: ${front.n}×${front.m} grid, ${front.filled} filled; round-trip identity: ${roundTrip.identity}`);
  if (!roundTrip.identity) throw new Error("back-projection round-trip FAILED on the cottage");

  // --- multi-angle GL render (the proof images) ----------------------------------------------------
  console.error("Rendering multi-angle set through the E-22 fixed lens…");
  const angles = ["front", "threeQuarter", "top", "+x+z"];
  const renders = await renderViews(artifact, angles, { outDir: OUT_DIR, label: (a) => String(a) });
  for (const r of renders) console.error(`  ✓ ${r.path} (${r.bytes} bytes)`);

  // --- same-angle reference quantize: quantize the front render to the -z face's cell grid ---------
  const frontRender = renders.find((r) => r.angle === "front");
  let referenceTargetSummary = null;
  try {
    const target = await quantizeToFace(frontRender.path, front, { manifest });
    referenceTargetSummary = {
      n: target.n, m: target.m, paletteMode: target.paletteMode, outOfPalette: target.outOfPalette,
      filledCells: target.filledCells, meanDeltaE: target.meanDeltaE,
      legend: target.legend.map((l) => ({ block: l.block, cells: l.cells, pct: l.pct })),
    };
    console.error(`Same-angle reference target: ${target.description}, outOfPalette=${target.outOfPalette}`);
  } catch (e) {
    referenceTargetSummary = { error: e.message };
    console.error("reference quantize skipped:", e.message);
  }

  const report = {
    schema: "view-layer-proof/v1",
    subject: "cottage (after-artifact.json)",
    placements: artifact.placements.length,
    manifest,
    occupancy: { voxels: occ.size, dims: occ.dims, bounds: occ.bounds },
    structuralRead: readSummary,
    openings: openingsByFace,
    surfaceGridRoundTrip: roundTrip,
    renders: renders.map((r) => ({ angle: r.angle, view: r.view, path: r.path.replace(ROOT, ""), bytes: r.bytes })),
    referenceTarget: referenceTargetSummary,
  };
  await writeFile(join(OUT_DIR, "view-layer-report.json"), JSON.stringify(report, null, 2));
  console.error(`\n✓ wrote ${join(OUT_DIR, "view-layer-report.json")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
