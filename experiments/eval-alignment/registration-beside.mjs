#!/usr/bin/env node
/**
 * T-160-04 witness (judge-free): render the constructed wall envelope BESIDE its concept, using the SAME
 * path the loop's `construct_walls` runs (constructWalls → registered clean rect when more watertight →
 * wallSkin). For the BARN it also renders the close-only path (program=null) so the straight-run colonnade
 * (before) vs the closed wall (after, registered) is directly comparable — the eval score alone can't tell
 * a closed wall from a colonnade at coarse resolution, so this picture is the AC's evidence.
 *
 * Usage: node experiments/eval-alignment/registration-beside.mjs [subject]   (default: barn cottage gatehouse)
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy, occupancyFromCells } from "../../src/view/occupancy.mjs";
import { gableRecord, generateRoof } from "../../src/view/roof-generate.mjs";
import { constructWalls } from "../../src/view/wall-generate.mjs";
import { wallSkin } from "../../src/view/wall-skin.mjs";
import { extractApertures, dressOpenings } from "../../src/view/opening-dressing.mjs";
import { roleBlock } from "../../src/recognition/compile.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { renderBesideConcept, assertGlAvailable } from "../../src/view/render-beside.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const OUT = join(ROOT, "docs/active/work/T-160-04");
const FAMILY = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab", findings: [] };
const SUBJECTS = {
  cottage: { artifact: "builds/cottage/final-artifact.json", concept: "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png", eaveY: 13, ridgeAxis: "z" },
  barn: { artifact: "builds/barn/final-artifact.json", concept: "benchmarks/sculpture/runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png", eaveY: 12, ridgeAxis: "x" },
  gatehouse: { artifact: "benchmarks/sculpture/generated/gatehouse/artifact.json", concept: "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png", eaveY: 18, ridgeAxis: "z" },
};
let CFG, SUBJECT;
const loadJSON = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null);
const loadProgram = (s) => loadJSON(join(ROOT, "benchmarks/sculpture/recognition", `${s}.program.json`));

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
  return occupancyFromCells([...kept, ...generateRoof([gable], FAMILY).cells]);
}
// the loop's construct_walls, parameterized by whether the program is supplied (registered vs close-only).
function construct_walls(occ, withProgram = true) {
  const program = withProgram ? loadProgram(SUBJECT) : null;
  const pack = program?.pack ? loadJSON(join(ROOT, "packs", `${program.pack}.json`)) : null;
  const floor = occ.bounds.min[1];
  const groundRole = program?.masses?.[0]?.walls?.ground?.role;
  const wallField = (pack && groundRole) ? roleBlock(pack, groundRole) : undefined;
  const env = constructWalls(occ, { floor, eaveY: CFG.eaveY, program, wallField });
  return wallSkin(env, { program, pack, floor, eaveY: CFG.eaveY, extractApertures, dressOpenings });
}

async function render(occ, raw, tag) {
  const out = join(OUT, `${SUBJECT}-${tag}-beside.png`);
  await renderBesideConcept(rebuildArtifact(occ, raw), join(ROOT, CFG.concept), out, { label: `${SUBJECT}-${tag}` });
  console.error(`[${SUBJECT}] ${tag} → ${out}`);
}

async function main() {
  assertGlAvailable();
  const arg = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const queue = arg ? [arg] : ["barn", "cottage", "gatehouse"];
  for (const key of queue) {
    SUBJECT = key; CFG = SUBJECTS[key];
    const raw = loadJSON(join(ROOT, CFG.artifact));
    const base = apply_gable_roof(artifactOccupancy(raw));
    await render(construct_walls(base, true), raw, "registered");
    if (key === "barn") await render(construct_walls(base, false), raw, "closeonly"); // before: colonnade
  }
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
