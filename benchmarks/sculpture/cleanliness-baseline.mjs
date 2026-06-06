// E-19 CLEANLINESS BEFORE-BASELINE — re-score the committed builds on the FIXED metrics (T-062-01, S-062).
//
// T-062-01 fixed the scoreboard: a stray-voxel/component metric (src/form/voxel-components.mjs) and a
// fragmentation-true speckleScore (src/form/material-clean.mjs). This runner records the BEFORE state — the
// three committed builds per subject re-scored on those metrics — so the rest of E-19 hill-climbs against a
// fixed baseline. R1 = glb-voxel (per-voxel snap), R2 = glb-voxel-clean (small palette), E18 = e18-build
// (thin + segment).
//
// FULLY OFFLINE — no GL, no GLB, no WebP, no network. Each committed artifact.json carries pos+block per cell
// in occupiedCells order, so {occupancy, keys} is reconstructed from `placements` alone (the horizontal
// pos-offset is a uniform translation — adjacency and component structure are preserved; j is exact). Output
// is deterministic (no timestamp), so the committed .md/.json are diff-stable across reruns.
//
//   node benchmarks/sculpture/cleanliness-baseline.mjs
//
// Writes cleanliness-baseline.{md,json}.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { speckleScore } from "../../src/form/material-clean.mjs";
import { strayVoxelStats } from "../../src/form/voxel-components.mjs";
import { SUBJECTS } from "./glb-voxel-breadth.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const BUILDS = [
  { id: "r1", label: "R1 glb-voxel", dir: join(HERE, "glb-voxel") },
  { id: "r2", label: "R2 glb-voxel-clean", dir: join(HERE, "glb-voxel-clean") },
  { id: "e18", label: "E18 thin+seg", dir: join(HERE, "e18-build") },
];

const round3 = (n) => Math.round(n * 1000) / 1000;

/**
 * Reconstruct {occupancy, keys} from a committed artifact's voxel placements. The pos offset is a uniform
 * translation, irrelevant to 6-adjacency / components; j (pos[1]) is exact, so sub-floor is faithful.
 */
function occupancyFromArtifact(artifact) {
  const ps = artifact.placements;
  const flat = new Int32Array(ps.length * 3);
  const keys = new Array(ps.length);
  let maxI = 0, maxJ = 0, maxK = 0;
  for (let n = 0; n < ps.length; n++) {
    const [i, j, k] = ps[n].pos;
    flat[n * 3] = i; flat[n * 3 + 1] = j; flat[n * 3 + 2] = k;
    keys[n] = ps[n].block.replace(/^minecraft:/, "");
    if (i > maxI) maxI = i; if (j > maxJ) maxJ = j; if (k > maxK) maxK = k;
  }
  // dims only needs to bound the coords for the metrics (which key by exact i,j,k); offset is harmless.
  const occupancy = { dims: [maxI + 1, maxJ + 1, maxK + 1], occupied: flat, count: ps.length };
  return { occupancy, keys };
}

/** Re-score one committed build for one subject, or null + note if its artifact is absent. */
async function scoreBuild(dir, subjKey) {
  const p = join(dir, subjKey, "artifact.json");
  if (!existsSync(p)) return null;
  const artifact = JSON.parse(await readFile(p, "utf8"));
  const { occupancy, keys } = occupancyFromArtifact(artifact);
  const stray = strayVoxelStats(occupancy); // 6-connectivity (face-adjacency), per the metric default
  return {
    speckle: round3(speckleScore(occupancy, keys)),
    components: stray.components,
    largestFraction: round3(stray.largestFraction),
    strayCount: stray.strayCount,
    subFloorCount: stray.subFloorCount,
    distinct: artifact.palette.manifest.length,
    cells: occupancy.count,
  };
}

/** Render the markdown table from rows. */
function toMarkdown(rows) {
  const lines = [
    "# E-19 cleanliness before-baseline (T-062-01)",
    "",
    "Committed builds re-scored on the FIXED metrics: fragmentation-true `speckleScore` and `strayVoxelStats`",
    "(6-connectivity). `largestFraction` 1.0 ⇔ a single solid mass; `stray` = cells outside the main mass;",
    "`sub` = stray cells below the main floor. Offline reconstruction from `artifact.json` placements.",
    "",
    "| subject | build | speckle | comp | largest-frac | stray | sub-floor | distinct | cells |",
    "|---|---|--:|--:|--:|--:|--:|--:|--:|",
  ];
  for (const r of rows) {
    for (const b of BUILDS) {
      const c = r[b.id];
      if (!c) {
        lines.push(`| ${r.subject} | ${b.label} | — | — | — | — | — | — | (absent) |`);
        continue;
      }
      lines.push(
        `| ${r.subject} | ${b.label} | ${c.speckle} | ${c.components} | ${c.largestFraction} | ` +
          `${c.strayCount} | ${c.subFloorCount} | ${c.distinct} | ${c.cells} |`,
      );
    }
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const rows = [];
  for (const subj of SUBJECTS) {
    const row = { subject: subj.key };
    for (const b of BUILDS) row[b.id] = await scoreBuild(b.dir, subj.key);
    rows.push(row);
    const fmt = (c) => (c ? `spk ${c.speckle} comp ${c.components} frac ${c.largestFraction} stray ${c.strayCount}` : "absent");
    console.error(`${subj.key}: R1[${fmt(row.r1)}] R2[${fmt(row.r2)}] E18[${fmt(row.e18)}]`);
  }
  const json = {
    ticket: "T-062-01",
    metrics: {
      speckle: "fraction of occupied cells locally outvoted by a single other block (fragmentation, not boundaries)",
      components: "6-connected occupancy components",
      largestFraction: "largest component / total cells; 1.0 = one solid mass",
      strayCount: "cells not in the largest component",
      subFloorCount: "stray cells below the largest component's lowest cell (islands under the floor)",
    },
    builds: BUILDS.map((b) => ({ id: b.id, label: b.label })),
    rows,
  };
  await writeFile(join(HERE, "cleanliness-baseline.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(HERE, "cleanliness-baseline.md"), toMarkdown(rows));
  console.error(`wrote cleanliness-baseline.{md,json} (${rows.length} subjects × ${BUILDS.length} builds)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("cleanliness-baseline failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { occupancyFromArtifact, scoreBuild };
