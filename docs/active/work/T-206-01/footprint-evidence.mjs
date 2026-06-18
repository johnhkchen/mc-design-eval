#!/usr/bin/env node
// T-206-01 (S-206, E-53) — zero-spend, real-subject proof that form-readiness now reads the truth on the
// ABSOLUTE PROGRAM FOOTPRINT. NO LLM, NO render, NO GL — pure geometry on the live gatehouse seed + program.
// Mirrors T-197-01/closeshell-evidence.mjs (absolute-path imports so it runs from anywhere).
//
//   node docs/active/work/T-206-01/footprint-evidence.mjs
//
// Proves, on the REAL gatehouse, the falsifiable claim (anti-hedge — each conjunct can FAIL):
//   (1) the open colonnade seed reads ~0.6 (< 0.9) — the OLD T-202 clamp read 0.980 (form-ready, the bug);
//   (2) a closed shell + real proud relief (224 quoins) reads ≥ 0.9 (proud cells off-ring → ignored);
//   (3) a genuinely reopened shell reads < 0.9;
//   (4) AGREEMENT: the seed reading EQUALS close_shell's internal closureBefore (the disagree-bug closed);
//   (5) the form-before-detail gate fires correctly on the real readings.

import { readFileSync } from "node:fs";

const R = "/Volumes/ext1/swe/repos/mc-design-eval";
const { artifactOccupancy, occupancyFromCells } = await import(`${R}/src/view/occupancy.mjs`);
const { closeShell, eaveRingClosure, robustExtent, perimeterColumns, closureOf } = await import(`${R}/src/view/wall-generate.mjs`);
const { buildWallRelief } = await import(`${R}/src/view/wall-relief.mjs`);
const { formReadyGate, FORM_READY_CLOSURE } = await import(`${R}/src/workshop/climb-gate.mjs`);

const EAVE_Y = 18; // CFG.eaveY in picture-climb.mjs
const program = JSON.parse(readFileSync(`${R}/benchmarks/sculpture/recognition/gatehouse.program.json`, "utf8"));
const pack = JSON.parse(readFileSync(`${R}/packs/rustic.json`, "utf8"));
const seed = artifactOccupancy(JSON.parse(readFileSync(`${R}/benchmarks/sculpture/generated/gatehouse/artifact.json`, "utf8")));
const floor = seed.bounds.min[1];

// The OLD T-202 clamp reading, recomputed inline for contrast (robustExtent is still exported).
function oldClampReading(occ, f, eaveY) {
  const cols = new Set();
  for (const k of occ.cells.keys()) { const [x, y, z] = k.split(",").map(Number); if (y < f || y > eaveY) continue; cols.add(`${x},${z}`); }
  const ext = robustExtent(cols, { pLo: 0.05, pHi: 0.95 });
  const fp = new Set();
  for (const c of cols) { const [x, z] = c.split(",").map(Number); if (x >= ext.x0 && x <= ext.x1 && z >= ext.z0 && z <= ext.z1) fp.add(c); }
  return closureOf(perimeterColumns(fp));
}
// A closed gatehouse-sized ring (the close_shell output structure), optional dropped straight run.
function closedGatehouse(drop = []) {
  const cells = []; const ds = new Set(drop);
  for (let x = 0; x <= 14; x++) for (let z = 0; z <= 14; z++) {
    if (!(x === 0 || x === 14 || z === 0 || z === 14)) continue;
    if (ds.has(`${x},${z}`)) continue;
    for (let y = 0; y <= EAVE_Y; y++) cells.push({ pos: [x, y, z], block: "minecraft:cobblestone" });
  }
  return occupancyFromCells(cells);
}

console.log("=== T-206-01 form-readiness-on-the-absolute-footprint evidence (gatehouse, zero spend) ===\n");

const seedFootprint = eaveRingClosure(seed, { floor, eaveY: EAVE_Y, program });
const seedOldClamp = oldClampReading(seed, floor, EAVE_Y);
console.log(`(1) colonnade seed: ${seed.size} cells, ${[...new Set([...seed.cells.keys()].filter(k => { const y = Number(k.split(",")[1]); return y >= floor && y <= EAVE_Y; }).map(k => { const [x,, z] = k.split(","); return `${x},${z}`; }))].length} band cols`);
console.log(`    OLD T-202 clamp reading : ${seedOldClamp.toFixed(4)}  ${seedOldClamp >= FORM_READY_CLOSURE ? "← FORM-READY (the bug: detail runs on an open colonnade)" : ""}`);
console.log(`    NEW footprint reading   : ${seedFootprint.toFixed(4)}  ${seedFootprint < FORM_READY_CLOSURE ? "← OPEN (close_shell forced) ✓" : "✗"}`);

const reliefOcc = buildWallRelief(closedGatehouse(), { program, pack, floor: 0, eaveY: EAVE_Y });
const closedReliefC = eaveRingClosure(reliefOcc.occ, { floor: 0, eaveY: EAVE_Y, program });
console.log(`\n(2) closed shell + real relief (${reliefOcc.report.byLayer.corners.placed} quoins + ${reliefOcc.report.byLayer.base.placed} plinth):`);
console.log(`    footprint reading       : ${closedReliefC.toFixed(4)}  ${closedReliefC >= FORM_READY_CLOSURE ? "← FORM-READY (proud cells off-ring, ignored) ✓" : "✗"}`);

const reopenedC = eaveRingClosure(closedGatehouse(["3,0","4,0","5,0","6,0","7,0","8,0","9,0","10,0","11,0"]), { floor: 0, eaveY: EAVE_Y, program });
console.log(`\n(3) reopened shell (9-col straight-run drop):`);
console.log(`    footprint reading       : ${reopenedC.toFixed(4)}  ${reopenedC < FORM_READY_CLOSURE ? "← OPEN (a missing footprint column reads as a hole) ✓" : "✗"}`);

const { report } = closeShell(seed, { program, floor, eaveY: EAVE_Y });
console.log(`\n(4) agreement with close_shell's internal measure:`);
console.log(`    eaveRingClosure(seed)   : ${seedFootprint.toFixed(4)}`);
console.log(`    closeShell.closureBefore: ${report.closureBefore.toFixed(4)}  ${seedFootprint === report.closureBefore ? "← EQUAL (the two-numbers-disagree bug is closed) ✓" : "✗ DISAGREE"}`);

console.log(`\n(5) form-before-detail gate on the real readings:`);
const g = (tool, c) => { const r = formReadyGate({ tool, closure: c }); console.log(`    ${tool.padEnd(13)} @ ${c.toFixed(3)} → ${r.allow ? "ALLOW" : "BLOCK"}  (${r.reason})`); return r; };
const detailOpen = g("relief_walls", seedFootprint);          // expect BLOCK
const formAlways = g("close_shell", seedFootprint);           // expect ALLOW
const detailClosed = g("relief_walls", closedReliefC);        // expect ALLOW

const pass = seedFootprint < FORM_READY_CLOSURE
  && closedReliefC >= FORM_READY_CLOSURE
  && reopenedC < FORM_READY_CLOSURE
  && seedFootprint === report.closureBefore
  && !detailOpen.allow && formAlways.allow && detailClosed.allow;
console.log(`\n=== VERDICT: ${pass ? "PASS — the metric tells the truth on the absolute footprint; gate fires; close_shell agrees" : "FAIL — see above"} ===`);
process.exit(pass ? 0 : 1);
