#!/usr/bin/env node
/**
 * T-160-01 witness (judge-free): replay each subject's autonomy trajectory deterministically (NO LLM,
 * NO eval) and render the FINAL constructed build BESIDE its concept. The renders are the evidence the
 * AC asks for — the score is in results/volume-ledger.json; this is the picture a human reads.
 *
 * Faithful replay: reads results/autonomy-<subject>.json (the picks the agent actually made) and applies
 * the SAME three tools the loop uses. If a trajectory is absent (batch not run), falls back to the
 * constructed end-state (gable + walls) so the witness still renders.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy, occupancyFromCells } from "../../src/view/occupancy.mjs";
import { gableRecord, generateRoof } from "../../src/view/roof-generate.mjs";
import { constructWalls } from "../../src/view/wall-generate.mjs";
import { infillPanel } from "../../src/view/facade-articulation.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { renderBesideConcept } from "../../src/view/render-beside.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const FAMILY = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab", findings: [] };
const SUBJECTS = {
  cottage: { artifact: "builds/cottage/final-artifact.json", concept: "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png", eaveY: 13, ridgeAxis: "z", wallField: "stone_bricks" },
  barn: { artifact: "builds/barn/final-artifact.json", concept: "benchmarks/sculpture/runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png", eaveY: 12, ridgeAxis: "x", wallField: "stone_bricks" },
  gatehouse: { artifact: "benchmarks/sculpture/generated/gatehouse/artifact.json", concept: "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png", eaveY: 18, ridgeAxis: "z", wallField: "stone_bricks" },
};
let CFG, SUBJECT;
function loadProgram(s) { const p = join(ROOT, "benchmarks/sculpture/recognition", `${s}.program.json`); return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; }
function occToCells(occ) { const out = []; for (const [k, b] of occ.cells) out.push({ pos: k.split(",").map(Number), block: b, form: occ.forms.get(k), state: occ.states.get(k) }); return out; }

function apply_gable_roof(occ) {
  const kept = []; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [key, block] of occ.cells) { const [x, y, z] = key.split(",").map(Number); if (y >= CFG.eaveY + 1) continue; kept.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) }); if (y === CFG.eaveY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } }
  const perp = CFG.ridgeAxis === "z" ? x1 - x0 : z1 - z0;
  const gable = gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis: CFG.ridgeAxis, eaveY: CFG.eaveY, ridgeY: CFG.eaveY + Math.floor(perp / 2), pitch: 1, hip: { demanded: false } });
  return occupancyFromCells([...kept, ...generateRoof([gable], FAMILY).cells]);
}
function construct_walls(occ) { return constructWalls(occ, { floor: occ.bounds.min[1], eaveY: CFG.eaveY, program: loadProgram(SUBJECT), wallField: CFG.wallField }); }
function add_timber_framing(occ) {
  const eave = CFG.eaveY; const upperStart = Math.floor(eave / 2) + 1;
  const r = infillPanel(occ, { memberMaterial: "dark_oak_log", fieldMaterial: "white_terracotta", faces: ["+x", "-x", "+z", "-z"], rhythm: { period: 3, phase: 0 }, span: 1, depth: 1, zoneOf: ([x, y, z]) => y >= upperStart && y <= eave, zone: true });
  return occupancyFromCells([...occToCells(occ), ...r.placements.map((p) => ({ pos: p.pos, block: p.block }))]);
}
const TOOLS = { apply_gable_roof, construct_walls, add_timber_framing };

async function main() {
  const arg = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const queue = arg ? [arg] : ["cottage", "barn", "gatehouse"];
  for (const key of queue) {
    SUBJECT = key; CFG = SUBJECTS[key];
    const raw = JSON.parse(readFileSync(join(ROOT, CFG.artifact), "utf8"));
    let occ = artifactOccupancy(raw);
    const trajPath = join(HERE, "results", `autonomy-${key}.json`);
    let picks;
    if (existsSync(trajPath)) {
      const t = JSON.parse(readFileSync(trajPath, "utf8"));
      picks = t.trajectory.map((r) => r.pick?.tool).filter((tn) => TOOLS[tn]);
    } else { picks = ["apply_gable_roof", "construct_walls"]; }
    for (const tn of picks) occ = TOOLS[tn](occ);
    const out = join(ROOT, "docs/active/work/T-160-01", `${key}-walls-beside.png`);
    await renderBesideConcept(rebuildArtifact(occ, raw), join(ROOT, CFG.concept), out, { label: `${key}-walls` });
    console.error(`[${key}] replayed [${picks.join(" → ") || "(none)"}] → ${out}`);
  }
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
