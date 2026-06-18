#!/usr/bin/env node
/**
 * T-195-01 GLANCE (S-195, E-51) — the busy-vs-rich deliverable, zero spend (no LLM, no measurement).
 * Renders the gatehouse walls under the FLAT recolor (articulate_walls) and the new RELIEF hand
 * (relief_walls = buildWallRelief) each beside the concept, so the step-up (or busy-ness) is judged on the
 * glance. Modeled on the runner's ROOF_MATERIAL_PROBE. Requires headless GL (assertGlAvailable).
 *
 *   node docs/active/work/T-195-01/render-relief.mjs
 */
import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy, occupancyFromCells, bareBlock } from "../../../../src/view/occupancy.mjs";
import { buildWallRelief } from "../../../../src/view/wall-relief.mjs";
import { roleBlock } from "../../../../src/recognition/compile.mjs";
import { rebuildArtifact } from "../../../../src/view/shell-integrity.mjs";
import { renderBesideConcept, assertGlAvailable } from "../../../../src/view/render-beside.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..", "..");
const SEED_ARTIFACT = "benchmarks/sculpture/generated/gatehouse/artifact.json";
const PROGRAM_PATH = "benchmarks/sculpture/recognition/gatehouse.program.json";
const CONCEPT = "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png";
const EAVE_Y = 18;

const load = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
const loadPackOf = (program) => load(join("packs", `${program.pack}.json`));

// The FLAT recolor baseline (articulate_walls, verbatim logic) — for the busy-vs-rich contrast.
function articulateWallsFlat(occ, program, pack) {
  const fieldBlock = roleBlock(pack, program?.masses?.[0]?.walls?.ground?.role ?? "wall.dressing");
  const quoinBlock = roleBlock(pack, program?.masses?.[0]?.walls?.dressing?.role ?? "wall.field.ground");
  const KEEP = new Set([bareBlock(quoinBlock), "dark_oak_log"]);
  const floor = occ.bounds.min[1];
  const cells = [];
  for (const [key, blk] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    let block = blk;
    const isCube = !occ.forms.has(key);
    if (isCube && y >= floor && y <= EAVE_Y && !KEEP.has(bareBlock(blk)) && bareBlock(blk) !== bareBlock(fieldBlock)) block = fieldBlock;
    cells.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
  }
  return occupancyFromCells(cells);
}

async function main() {
  assertGlAvailable();
  const outDir = HERE;
  await mkdir(outDir, { recursive: true });
  const template = load(SEED_ARTIFACT);
  const program = load(PROGRAM_PATH);
  const pack = loadPackOf(program);
  const seed = artifactOccupancy(template);
  const floor = seed.bounds.min[1];

  const flat = articulateWallsFlat(seed, program, pack);
  const relief = buildWallRelief(seed, { program, pack, floor, eaveY: EAVE_Y });
  console.error(`[relief_walls] recolor ${relief.recolored}→${relief.materials.fieldBlock}; proud ${relief.materials.dressBlock} quoins=${relief.report.byLayer?.corners?.placed ?? 0} plinth=${relief.report.byLayer?.base?.placed ?? 0}; closure ok=${relief.closure.ok} (${relief.closure.before}→${relief.closure.after}, dropped=${relief.closure.droppedColumns.length})`);

  const concept = join(ROOT, CONCEPT);
  await renderBesideConcept(rebuildArtifact(flat, template), concept, join(outDir, "articulate-beside.png"), { label: "articulate_walls (flat recolor)" });
  await renderBesideConcept(rebuildArtifact(relief.occ, template), concept, join(outDir, "relief-beside.png"), { label: "relief_walls (proud quoins + plinth)" });
  console.error(`[glance] wrote articulate-beside.png + relief-beside.png to ${outDir}; no spend.`);
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
