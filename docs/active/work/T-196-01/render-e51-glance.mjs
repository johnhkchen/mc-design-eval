#!/usr/bin/env node
/**
 * E-51 INTEGRATION GLANCE (T-196-01) — a ZERO-SPEND (GL only, no LLM) beside-concept render of the two E-51
 * construction hands COMPOSED on the gatehouse seed: relief_walls (T-195-01, WALL) then carve_arch (T-194-01,
 * OPENING). The metered re-climb hung on a non-returning strong-tier `claude -p` diagnose subprocess (an
 * environment hang, not a code defect — see review.md), so this delivers the integration GLANCE the AC asks
 * for (first = seed, final = seed+relief+carve) without the metered LLM, and prints the framing eyes' read on
 * each. Hand bodies are verbatim copies of experiments/eval-alignment/picture-climb.mjs (same CFG.eaveY=18).
 *
 *   node docs/active/work/T-196-01/render-e51-glance.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy, occupancyFromCells, bareBlock } from "../../../../src/view/occupancy.mjs";
import { gableRecord, generateRoof } from "../../../../src/view/roof-generate.mjs";
import { buildWallRelief } from "../../../../src/view/wall-relief.mjs";
import { carveTargetCells, apertureCoherenceGate, carveAperture } from "../../../../src/view/aperture-carve.mjs";
import { extractApertures } from "../../../../src/view/opening-dressing.mjs";
import { frameArchPlacements } from "../../../../src/view/arch-frame.mjs";
import { roleBlock } from "../../../../src/recognition/compile.mjs";
import { loadStylePack } from "../../../../src/pack/style-pack.mjs";
import { rebuildArtifact } from "../../../../src/view/shell-integrity.mjs";
import { renderBesideConcept, assertGlAvailable } from "../../../../src/view/render-beside.mjs";
import { framingReport } from "../../../../src/view/framing.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SEED_ARTIFACT = "benchmarks/sculpture/generated/gatehouse/artifact.json";
const PROGRAM_PATH = "benchmarks/sculpture/recognition/gatehouse.program.json";
const PACK_PATH = "packs/rustic.json";
const CONCEPT = "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png";
const CFG = { eaveY: 18, ridgeAxis: "x" }; // ridgeAxis recognition-declared (gable faces the -x gate)
const OUT = join(ROOT, "builds/gatehouse/picture-climb/e51-glance");

const PROGRAM = JSON.parse(readFileSync(join(ROOT, PROGRAM_PATH), "utf8"));
const PACK = loadStylePack(join(ROOT, PACK_PATH));
const occToCells = (occ) => [...occ.cells].map(([k, block]) => ({ pos: k.split(",").map(Number), block, form: occ.forms.get(k), state: occ.states.get(k) }));
const U_AXIS = Object.freeze({ "+x": 2, "-x": 2, "+z": 0, "-z": 0 });
const apertureFromTarget = (t) => {
  const cells = [], flanks = { left: [], right: [] }, lintel = [];
  for (let av = t.vLo; av <= t.vHi; av++) for (let au = t.uLo; au <= t.uHi; au++) cells.push({ au, av });
  for (let av = t.vLo; av <= t.vHi; av++) { flanks.left.push({ au: t.uLo - 1, av }); flanks.right.push({ au: t.uHi + 1, av }); }
  for (let au = t.uLo - 1; au <= t.uHi + 1; au++) lintel.push({ au, av: t.vHi + 1 });
  return { kind: "door", dir: t.dir, cells, flanks, lintel };
};

function apply_gable_roof(occ) {
  const kept = []; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (y >= CFG.eaveY + 1) continue;
    kept.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
    if (y === CFG.eaveY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  }
  const perp = CFG.ridgeAxis === "z" ? x1 - x0 : z1 - z0;
  const gable = gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis: CFG.ridgeAxis, eaveY: CFG.eaveY, ridgeY: CFG.eaveY + Math.floor(perp / 2), pitch: 1, hip: { demanded: false } });
  const FAMILY = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab", findings: [] };
  console.error(`  [apply_gable_roof] clean gable ridge=${CFG.ridgeAxis}, ridgeY=${CFG.eaveY + Math.floor(perp / 2)}`);
  return occupancyFromCells([...kept, ...generateRoof([gable], FAMILY).cells]);
}
function relief_walls(occ) {
  const floor = occ.bounds.min[1];
  const { occ: out, closure, report, materials, recolored } = buildWallRelief(occ, { program: PROGRAM, pack: PACK, floor, eaveY: CFG.eaveY });
  const corners = report.byLayer?.corners?.placed ?? 0, base = report.byLayer?.base?.placed ?? 0;
  console.error(`  [relief_walls] recolor ${recolored}→${materials.fieldBlock}; proud quoins=${corners} plinth=${base}; closure ${closure.ok ? "held" : "REGRESSED"}`);
  return out;
}
function carve_arch(occ) {
  const door = PROGRAM?.masses?.[0]?.openings?.find((o) => o.kind === "door" && o.head === "arch");
  const frameBlock = (PACK && door.headRole) ? roleBlock(PACK, door.headRole) : "dark_oak_log";
  const onBuild = extractApertures(occ).find((a) => a.dir === door.wall && a.kind === "door");
  const refOcc = artifactOccupancy(JSON.parse(readFileSync(join(ROOT, SEED_ARTIFACT), "utf8")));
  const declared = onBuild ?? extractApertures(refOcc).find((a) => a.dir === door.wall && a.kind === "door");
  const ax = U_AXIS[door.wall];
  let uMin = Infinity, uMax = -Infinity;
  for (const key of occ.cells.keys()) { const c = key.split(",").map(Number); if (c[1] < occ.bounds.min[1] || c[1] > CFG.eaveY) continue; if (c[ax] < uMin) uMin = c[ax]; if (c[ax] > uMax) uMax = c[ax]; }
  const progSpan = ax === 2 ? PROGRAM?.masses?.[0]?.rect?.d : PROGRAM?.masses?.[0]?.rect?.w;
  const scale = (Number.isFinite(uMin) && progSpan) ? (uMax - uMin + 1) / progSpan : 1;
  const { remove, target } = carveTargetCells(occ, declared, { programW: door.w, scale });
  const carved = carveAperture(occ, remove);
  const wideAp = apertureFromTarget(target);
  const { placements, perOpening } = frameArchPlacements(carved, [wideAp], { frameBlock });
  const dressed = occupancyFromCells([...occToCells(carved), ...placements.map((p) => ({ pos: p.pos, block: p.block }))]);
  const gate = apertureCoherenceGate(occ, dressed, target, { floor: occ.bounds.min[1], eaveY: CFG.eaveY });
  for (const r of perOpening) console.error(`  [carve_arch] ${r.dir}: width=${target.width} carved=${remove.size} framed=${r.framed} arched=${r.arched}`);
  console.error(`  [carve_arch] gate ok=${gate.ok} (scope=${gate.scope.ok} coherent=${gate.coherent.ok} closure=${gate.closure.ok})`);
  return gate.ok ? dressed : occ;
}

const template = JSON.parse(readFileSync(join(ROOT, SEED_ARTIFACT), "utf8"));
const reportFraming = (tag, occ) => { const f = framingReport(PROGRAM, occ); console.error(`  [${tag}] framing residual: ${f.residual.map((r) => r.axis).join(", ") || "(none — quiet)"}`); };

assertGlAvailable();
const seed = artifactOccupancy(template);
console.error("[seed]"); reportFraming("seed", seed);
const gabled = apply_gable_roof(seed); reportFraming("gabled", gabled);
const relief = relief_walls(gabled); reportFraming("relief", relief);
const final = carve_arch(relief); reportFraming("final", final);

await renderBesideConcept(rebuildArtifact(seed, template), join(ROOT, CONCEPT), join(OUT, "first-seed-beside.png"), { label: "first: seed" });
await renderBesideConcept(rebuildArtifact(final, template), join(ROOT, CONCEPT), join(OUT, "final-gable+relief+carve-beside.png"), { label: "final: gable+relief+carve (E-51 stack)" });
console.error(`\nwrote first-seed-beside.png + final-gable+relief+carve-beside.png to ${OUT}`);
