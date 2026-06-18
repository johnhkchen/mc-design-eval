#!/usr/bin/env node
// T-197-01 (S-197, E-51) — zero-spend, real-subject proof for the close-the-shell form hand + the
// form-before-detail ordering gate. NO LLM, NO render, NO GL — pure geometry on the live gatehouse seed +
// program. Mirrors T-196-01's framing-evidence.mjs (absolute-path imports so it runs from anywhere).
//
//   node docs/active/work/T-197-01/closeshell-evidence.mjs
//
// Proves, on the REAL gatehouse: (1) closeShell raises wall-band closure toward watertight (report the rise);
// (2) the won roof is preserved (compose-without-regress); (3) formReadyGate BLOCKS a detail tool on the open
// seed and ALLOWS it on the closed shell, while close_shell is always eligible.

import { readFileSync } from "node:fs";

const R = "/Volumes/ext1/swe/repos/mc-design-eval";
const { artifactOccupancy } = await import(`${R}/src/view/occupancy.mjs`);
const { closeShell, eaveRingClosure } = await import(`${R}/src/view/wall-generate.mjs`);
const { formReadyGate, FORM_READY_CLOSURE } = await import(`${R}/src/workshop/climb-gate.mjs`);

const EAVE_Y = 18; // CFG.eaveY in picture-climb.mjs
const program = JSON.parse(readFileSync(`${R}/benchmarks/sculpture/recognition/gatehouse.program.json`, "utf8"));
const seed = artifactOccupancy(JSON.parse(readFileSync(`${R}/benchmarks/sculpture/generated/gatehouse/artifact.json`, "utf8")));
const floor = seed.bounds.min[1];

const roofCells = (occ) => [...occ.cells.keys()].filter((k) => Number(k.split(",")[1]) > EAVE_Y).length;

console.log("=== T-197-01 close-the-shell evidence (gatehouse, zero spend) ===");
const before = eaveRingClosure(seed, { floor, eaveY: EAVE_Y });
console.log(`seed: ${seed.size} cells, bounds ${JSON.stringify(seed.bounds)}`);
console.log(`seed wall-band closure: ${before.toFixed(3)}  (form-ready threshold = ${FORM_READY_CLOSURE})`);

const { occ: closed, report } = closeShell(seed, { program, floor, eaveY: EAVE_Y });
console.log(`\nclose_shell report: closed=${report.closed}`);
console.log(`  closure ${report.closureBefore.toFixed(3)} → ${report.closureAfter.toFixed(3)}  (rise +${(report.closureAfter - report.closureBefore).toFixed(3)})`);
console.log(`  ring ${report.ringSize} cols, coverage ${report.coverage?.toFixed(2)}, axis ${report.axis}`);
console.log(`  reason: ${report.reason}`);

const roofSame = roofCells(seed) === roofCells(closed);
console.log(`\nroof cells (y>${EAVE_Y}): seed ${roofCells(seed)} → closed ${roofCells(closed)}  ${roofSame ? "PRESERVED ✓ (composes without regressing the roof)" : "CHANGED ✗"}`);

// the ordering gate on the REAL before/after closures
console.log(`\n=== form-before-detail ordering gate (real closures) ===`);
const probe = (tool, closure) => {
  const g = formReadyGate({ tool, closure });
  console.log(`  ${tool.padEnd(14)} @ closure ${closure.toFixed(3)} → ${g.allow ? "ALLOW" : "BLOCK"}  (${g.reason})`);
  return g;
};
const detailOpen = probe("carve_arch", before);                    // expect BLOCK (open seed)
const detailClosed = probe("carve_arch", report.closureAfter);     // expect ALLOW (closed shell)
const reliefOpen = probe("relief_walls", before);                  // expect BLOCK
const formAlways = probe("close_shell", before);                   // expect ALLOW (form always eligible)

const pass = report.closed && report.closureAfter > report.closureBefore && roofSame
  && !detailOpen.allow && detailClosed.allow && !reliefOpen.allow && formAlways.allow;
console.log(`\n=== VERDICT: ${pass ? "PASS — shell closes, roof preserved, gate fires correctly" : "FAIL — see above"} ===`);
process.exit(pass ? 0 : 1);
