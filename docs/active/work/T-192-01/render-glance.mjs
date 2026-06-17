#!/usr/bin/env node
// T-192-01 GLANCE probe (free — GL only, NO LLM spend). Reproduces the climb chain to the T-191 plateau,
// then applies the three S-192 hands, rendering each beside the concept. Run: node docs/active/work/T-192-01/render-glance.mjs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy, occupancyFromCells } from "../../../../src/view/occupancy.mjs";
import { extractApertures, dressOpenings } from "../../../../src/view/opening-dressing.mjs";
import { constructWalls } from "../../../../src/view/wall-generate.mjs";
import { wallSkin } from "../../../../src/view/wall-skin.mjs";
import { gableRecord, generateRoof } from "../../../../src/view/roof-generate.mjs";
import { frameArchPlacements } from "../../../../src/view/arch-frame.mjs";
import { composeRoofTreatment, bareBlock } from "../../../../src/view/treatment-grammar.mjs";
import { rebuildArtifact } from "../../../../src/view/shell-integrity.mjs";
import { renderBesideConcept, assertGlAvailable } from "../../../../src/view/render-beside.mjs";
import { loadStylePack } from "../../../../src/pack/style-pack.mjs";
import { roleBlock } from "../../../../src/recognition/compile.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..", "..");
const P = (r) => join(ROOT, r);
const PROGRAM = JSON.parse(readFileSync(P("benchmarks/sculpture/recognition/gatehouse.program.json"), "utf8"));
const pack = JSON.parse(readFileSync(P("packs/rustic.json"), "utf8"));
const CONCEPT = P("benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png");
const eaveY = 18, ridgeAxis = PROGRAM.masses[0].roof.ridgeAxis; // x — recognition-declared
const tmpl = JSON.parse(readFileSync(P("benchmarks/sculpture/generated/gatehouse/artifact.json"), "utf8"));
const occToCells = (occ) => [...occ.cells].map(([k, b]) => ({ pos: k.split(",").map(Number), block: b, form: occ.forms.get(k), state: occ.states.get(k) }));

assertGlAvailable();
const seed = artifactOccupancy(tmpl);
// walls
const env = constructWalls(seed, { floor: 0, eaveY, program: PROGRAM, wallField: roleBlock(pack, PROGRAM.masses[0].walls.ground.role) });
let occ = wallSkin(env, { program: PROGRAM, pack: loadStylePack(P("packs/rustic.json")), floor: 0, eaveY, extractApertures, dressOpenings });
// reoriented grey gable (recolor_roof shape: deepslate, program ridgeAxis)
{ const kept = []; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [k, b] of occ.cells) { const [x, y, z] = k.split(",").map(Number); if (y >= eaveY + 1) continue; kept.push({ pos: [x, y, z], block: b, form: occ.forms.get(k), state: occ.states.get(k) }); if (y === eaveY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } }
  const perp = ridgeAxis === "z" ? x1 - x0 : z1 - z0;
  const g = gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis, eaveY, ridgeY: eaveY + Math.floor(perp / 2), pitch: 1, hip: { demanded: false } });
  occ = occupancyFromCells([...kept, ...generateRoof([g], { field: "deepslate_tiles", stairs: null, slab: null, findings: [] }).cells]); }
const plateau = occ;
await renderBesideConcept(rebuildArtifact(plateau, tmpl), CONCEPT, join(HERE, "plateau-beside.png"), { label: "T-191 plateau (walls+grey gable, reoriented)" });

// frame_arch
{ const door = PROGRAM.masses[0].openings.find((o) => o.kind === "door"); const fb = roleBlock(pack, door.headRole);
  const { placements, perOpening } = frameArchPlacements(occ, extractApertures(seed), { frameBlock: fb });
  console.log("frame_arch perOpening:", JSON.stringify(perOpening));
  occ = occupancyFromCells([...occToCells(occ), ...placements.map((p) => ({ pos: p.pos, block: p.block }))]); }
// articulate_walls (pale field recolor)
{ const fieldBlock = roleBlock(pack, PROGRAM.masses[0].walls.ground.role); const quoinBlock = roleBlock(pack, PROGRAM.masses[0].walls.dressing.role);
  const KEEP = new Set([bareBlock(quoinBlock), "dark_oak_log"]); const cells = [];
  for (const [k, b] of occ.cells) { const [x, y, z] = k.split(",").map(Number); let blk = b; const cube = !occ.forms.has(k);
    if (cube && y >= 0 && y <= eaveY && !KEEP.has(bareBlock(b)) && bareBlock(b) !== bareBlock(fieldBlock)) blk = fieldBlock;
    cells.push({ pos: [x, y, z], block: blk, form: occ.forms.get(k), state: occ.states.get(k) }); }
  occ = occupancyFromCells(cells); }
// band_eave
{ let ridgeY = eaveY; for (const k of occ.cells.keys()) { const y = Number(k.split(",")[1]); if (y > ridgeY) ridgeY = y; }
  const { occ: out } = composeRoofTreatment(occ, { edge: { material: roleBlock(pack, PROGRAM.masses[0].roof.trimRole) } }, { ridgeAxis, eaveY, ridgeY });
  occ = out; }
await renderBesideConcept(rebuildArtifact(occ, tmpl), CONCEPT, join(HERE, "hands-applied-beside.png"), { label: "S-192 hands: frame+pale field+band" });
console.log("wrote plateau-beside.png + hands-applied-beside.png");
