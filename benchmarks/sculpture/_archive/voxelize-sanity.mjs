// Real-mesh voxel-occupancy sanity recorder — E-16 T-050-01.
//
// NOT a unit test (lives outside src/**/*.test.mjs, never runs in CI). Voxelizes the real TRELLIS
// GLBs at DEFAULT_SCALE and prints occupancy counts so the voxelization can be eyeballed as plausibly
// dense/hollow. The GLBs are gitignored local artifacts; absent files are skipped, not errors.
//
// Usage:  node benchmarks/sculpture/voxelize-sanity.mjs [scale]

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";
import { DEFAULT_SCALE } from "../../src/sculpture.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scale = Number(process.argv[2] ?? DEFAULT_SCALE);
const subjects = ["koi", "heart"];

console.log(`# GLB voxel occupancy sanity (scale=${scale})\n`);
console.log("subject | dims | occupied | totalCells | fill%");
console.log("------- | ---- | -------- | ---------- | -----");

for (const name of subjects) {
  const path = join(here, "glb", `${name}.glb`);
  let bytes;
  try {
    bytes = await readFile(path);
  } catch {
    console.log(`${name} | — | — | — | (skipped: ${path} absent / gitignored)`);
    continue;
  }
  const t0 = Date.now();
  const occ = voxelizeGlb(bytes, { scale });
  const total = occ.dims[0] * occ.dims[1] * occ.dims[2];
  const fill = ((occ.count / total) * 100).toFixed(1);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`${name} | ${occ.dims.join("×")} | ${occ.count} | ${total} | ${fill}%  (${secs}s)`);
}
