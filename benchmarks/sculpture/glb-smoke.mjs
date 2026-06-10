// GLB SMOKE CHECK — the single-bulky-mass gate a freshly minted subject GLB must pass BEFORE its
// concept is registered (T-094-01; the moai lesson — its TRELLIS mesh fragmented into two masses and
// every downstream verdict measured debris, not design). Voxelizes the mesh at the working scale and
// gates on 26-connectivity components === 1; 6-connectivity stats are REPORTED but not gated (the
// gatehouse precedent: thin-shell surface fragmentation at 6-conn — 26 components, largestFraction
// 0.83 — is a surface-roughness artifact, explicitly NOT a form defect; see glb/README.md).
//
// Pure-core reuse only (voxelizeGlb + strayVoxelStats + loadMeshFromGlb); no GL, no model, no network.
// Exit 0 iff the gate passes — wire it into provisioning, record its numbers in glb/README.md.
//
//   node benchmarks/sculpture/glb-smoke.mjs benchmarks/sculpture/glb/<name>.glb [--scale 48]
import { readFile } from "node:fs/promises";

import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";
import { strayVoxelStats } from "../../src/form/voxel-components.mjs";
import { loadMeshFromGlb } from "../../src/form/glb-silhouette.mjs";
import { inspectGlb } from "./trellis-glb.mjs";

const argv = process.argv.slice(2);
const glbPath = argv.find((a) => !a.startsWith("--"));
const scaleIdx = argv.indexOf("--scale");
const scale = scaleIdx >= 0 ? Number(argv[scaleIdx + 1]) : 48;
if (!glbPath || !Number.isInteger(scale)) {
  console.error("usage: node benchmarks/sculpture/glb-smoke.mjs <path.glb> [--scale N]");
  process.exit(2);
}

const bytes = new Uint8Array(await readFile(glbPath));
const header = inspectGlb(bytes);
const mesh = loadMeshFromGlb(bytes);
const occ = voxelizeGlb(bytes, { scale });
const s26 = strayVoxelStats(occ, { connectivity: 26 });
const s6 = strayVoxelStats(occ, { connectivity: 6 });

const pass = header.ok && s26.components === 1;
const report = {
  glb: glbPath,
  bytes: bytes.length,
  gltf: { ok: header.ok, version: header.version },
  mesh: { vertices: mesh.positions.length / 3, triangles: mesh.triCount },
  voxelization: { scale, dims: occ.dims, cells: occ.count },
  conn26: s26, // GATED: components must be 1 (a single bulky mass; no moai-style fragmentation)
  conn6: s6, //  reported only (thin-shell surface fragmentation is not a form defect)
  pass,
};
console.log(JSON.stringify(report, null, 2));
console.error(
  `${pass ? "✓ PASS" : "✗ FAIL"} — ${occ.dims.join("×")} @${scale}, ${occ.count} cells; ` +
    `26-conn ${s26.components} component(s) (largestFraction ${s26.largestFraction.toFixed(4)}); ` +
    `6-conn ${s6.components} (${s6.largestFraction.toFixed(4)})`,
);
process.exit(pass ? 0 : 1);
