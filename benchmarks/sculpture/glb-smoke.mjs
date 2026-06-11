// GLB SMOKE CHECK — the single-bulky-mass gate a freshly minted subject GLB must pass BEFORE its
// concept is registered (T-094-01; the moai lesson — its TRELLIS mesh fragmented into two masses and
// every downstream verdict measured debris, not design). Voxelizes the mesh at the working scale and
// gates on 26-connectivity components; 6-connectivity stats are REPORTED but not gated (the
// gatehouse precedent: thin-shell surface fragmentation at 6-conn — 26 components, largestFraction
// 0.83 — is a surface-roughness artifact, explicitly NOT a form defect; see glb/README.md).
//
// SUB-SPECK TOLERANCE (T-120-01; the barn lesson — its GLB failed the strict components===1 gate at
// EVERY scale on ONE floating mesh cell, largestFraction ≥ 0.9813 throughout, forcing a named
// deviation): the gate is now `speckVerdict` — every non-principal 26-conn component must
// individually be ≤ GLB_SMOKE_SPECK_FRACTION of total cells. Specks are reported and delegated to
// the standing shellStage componentStrip (both consuming chains condition evidence through it
// before any fit); ANY larger component still fails — the moai fragmentation class is gated
// exactly as before, strict above the declared budget. See docs/knowledge/registration-runbook.md.
//
// Pure-core reuse only (voxelizeGlb + componentLabels/speckVerdict/strayVoxelStats +
// loadMeshFromGlb); no GL, no model, no network. Exit 0 iff the gate passes — wire it into
// provisioning, record its numbers in glb/README.md. `--record <repo-rel.json>` commits the
// report as a durable regression fixture (guarded write; `--rotate-pins` to re-pin).
//
//   node benchmarks/sculpture/glb-smoke.mjs benchmarks/sculpture/glb/<name>.glb [--scale 48] \
//     [--record benchmarks/sculpture/glb/smoke/<name>@<scale>.json]
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { ROTATE_FLAG, guardedWriteRecord } from "../../src/form/pin-guard.mjs";
import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";
import { componentLabels, speckVerdict, strayVoxelStats } from "../../src/form/voxel-components.mjs";
import { loadMeshFromGlb } from "../../src/form/glb-silhouette.mjs";
import { inspectGlb } from "./trellis-glb.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const argv = process.argv.slice(2);
const glbPath = argv.find((a) => !a.startsWith("--"));
const scaleIdx = argv.indexOf("--scale");
const scale = scaleIdx >= 0 ? Number(argv[scaleIdx + 1]) : 48;
const recordIdx = argv.indexOf("--record");
const recordRel = recordIdx >= 0 ? argv[recordIdx + 1] : null;
if (!glbPath || !Number.isInteger(scale) || (recordIdx >= 0 && !recordRel)) {
  console.error("usage: node benchmarks/sculpture/glb-smoke.mjs <path.glb> [--scale N] [--record <repo-rel.json>] [--rotate-pins]");
  process.exit(2);
}

const bytes = new Uint8Array(await readFile(glbPath));
const header = inspectGlb(bytes);
const mesh = loadMeshFromGlb(bytes);
const occ = voxelizeGlb(bytes, { scale });
const s26 = strayVoxelStats(occ, { connectivity: 26 });
const s6 = strayVoxelStats(occ, { connectivity: 6 });
const speckGate = speckVerdict(componentLabels(occ, { connectivity: 26 }).sizes, occ.count);

const pass = header.ok && speckGate.pass;
const report = {
  glb: glbPath,
  bytes: bytes.length,
  gltf: { ok: header.ok, version: header.version },
  mesh: { vertices: mesh.positions.length / 3, triangles: mesh.triCount },
  voxelization: { scale, dims: occ.dims, cells: occ.count },
  conn26: s26, // evidence (unchanged): raw component stats at the gated connectivity
  conn6: s6, //  reported only (thin-shell surface fragmentation is not a form defect)
  speckGate, // GATED (T-120-01): every non-principal component ≤ the declared budget; specks
  //           are componentStrip's job downstream, oversize components fail (the moai class)
  pass,
};
if (recordRel) {
  await guardedWriteRecord({
    root: ROOT, rel: recordRel, content: JSON.stringify(report, null, 2) + "\n",
    rotate: argv.includes(ROTATE_FLAG),
  });
}
console.log(JSON.stringify(report, null, 2));
console.error(
  `${pass ? "✓ PASS" : "✗ FAIL"} — ${occ.dims.join("×")} @${scale}, ${occ.count} cells; ` +
    `26-conn ${s26.components} component(s) (largestFraction ${s26.largestFraction.toFixed(4)}); ` +
    `specks ${speckGate.specks.length}, oversize ${speckGate.oversize.length} ` +
    `(budget ${speckGate.speckFraction}); 6-conn ${s6.components} (${s6.largestFraction.toFixed(4)})` +
    (recordRel ? `; recorded ${recordRel}` : ""),
);
process.exit(pass ? 0 : 1);
