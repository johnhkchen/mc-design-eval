#!/usr/bin/env node
/**
 * FRAMING EVIDENCE (T-196-01, story S-196, epic E-51) — the zero-spend, GL-free, LLM-free proof that the
 * wider eyes flag-when-wrong and stay quiet-when-right on the REAL gatehouse subject. The honest substrate
 * finding it records: the RAW voxelized seed (the climb's round 0) has NO clean roof ridge, so orientation
 * SKIPS (conservative, never a false positive); the orientation eye goes LIVE once a gable hand builds a clean
 * ridge (the climb's round 1+), exactly as it does in picture-climb.mjs. So we read framing on:
 *   (a) the raw seed                         — orientation SKIP (no clean ridge yet), scale aspect-only
 *   (b) seed + clean gable, ridge x (correct)— QUIET (the gable faces the -x gate)
 *   (c) seed + clean gable, ridge z (rotated)— ORIENTATION FLAG (the reviewer's 90 deg defect)
 *   (d) clean gable on a 30x15 base (oversized)— SCALE FLAG (footprint 2:1 vs the 1:1 intent)
 *   (e) clean gable ridge x, uniform x2       — QUIET (proportion, not pixels — the crux)
 * Built with the SAME production roof generator the climb uses (gableRecord + generateRoof), not a test mock.
 *
 *   node docs/active/work/T-196-01/framing-evidence.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy, occupancyFromCells } from "../../../../src/view/occupancy.mjs";
import { gableRecord, generateRoof } from "../../../../src/view/roof-generate.mjs";
import { framingReport, proportionRatios, targetRatiosOf, buildRidgeAxis, frontAxisOf } from "../../../../src/view/framing.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const PROGRAM = JSON.parse(readFileSync(join(ROOT, "benchmarks/sculpture/recognition/gatehouse.program.json"), "utf8"));
const seed = JSON.parse(readFileSync(join(ROOT, "benchmarks/sculpture/generated/gatehouse/artifact.json"), "utf8"));
const occ = artifactOccupancy(seed);
const EAVE_Y = 18; // the runner's CFG.eaveY (apply_gable_roof keeps cells ≤ eaveY, then gables above)
const FAMILY = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab", findings: [] };

// A clean gable over the seed's base (replicates apply_gable_roof: keep the base ≤ eaveY, add a generated
// gable). ridgeAxis chooses the orientation; the base footprint is read at the eave.
function cleanGable(occ, ridgeAxis) {
  const kept = []; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (y >= EAVE_Y + 1) continue;
    kept.push({ pos: [x, y, z], block });
    if (y === EAVE_Y) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  }
  const perp = ridgeAxis === "z" ? x1 - x0 : z1 - z0;
  const gable = gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis, eaveY: EAVE_Y, ridgeY: EAVE_Y + Math.floor(perp / 2), pitch: 1, hip: { demanded: false } });
  return occupancyFromCells([...kept, ...generateRoof([gable], FAMILY).cells]);
}
// A clean gable over a synthetic w×d base at the real eave (for the oversized-footprint case).
function cleanGableBase(w, d, ridgeAxis) {
  const kept = [];
  for (let y = 0; y <= EAVE_Y; y++) for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) kept.push({ pos: [x, y, z], block: "stone" });
  const perp = ridgeAxis === "z" ? w - 1 : d - 1;
  const gable = gableRecord({ footprint: { x0: 0, x1: w - 1, z0: 0, z1: d - 1 }, ridgeAxis, eaveY: EAVE_Y, ridgeY: EAVE_Y + Math.floor(perp / 2), pitch: 1, hip: { demanded: false } });
  return occupancyFromCells([...kept, ...generateRoof([gable], FAMILY).cells]);
}
const upscale2 = (o) => occupancyFromCells([...o.cells].map(([k, block]) => ({ pos: k.split(",").map(Number).map((c) => c * 2), block })));

const show = (tag, o) => {
  const r = framingReport(PROGRAM, o);
  console.log(`\n[${tag}]  ridgeAxis=${buildRidgeAxis(o)}  ratios=${JSON.stringify(proportionRatios(o))}`);
  console.log(`  orientation: flagged=${r.orientation.flagged}  ${r.orientation.note}`);
  console.log(`  scale:       flagged=${r.scale.flagged}  deltas=${JSON.stringify(r.scale.deltas)}`);
  console.log(`  residual:    ${r.residual.map((x) => x.axis).join(", ") || "(none — quiet)"}`);
};

console.log(`front=${JSON.stringify(frontAxisOf(PROGRAM))}  target=${JSON.stringify(targetRatiosOf(PROGRAM))}  seed cells=${occ.size}`);
show("a/ raw seed — round 0 blob (expect orientation SKIP)", occ);
show("b/ clean gable ridge x — correct (expect QUIET)", cleanGable(occ, "x"));
show("c/ clean gable ridge z — rotated (expect ORIENTATION flag)", cleanGable(occ, "z"));
show("d/ clean gable on 30x15 base — oversized (expect SCALE flag)", cleanGableBase(30, 15, "x"));
show("e/ clean gable ridge x, uniform x2 (expect QUIET — proportion not pixels)", upscale2(cleanGable(occ, "x")));
