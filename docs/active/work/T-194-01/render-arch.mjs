// GL render evidence for T-194-01: the wide arched gate beside the concept. Renders the constructed build
// BEFORE the carve and AFTER carve_arch, so the glance can judge whether the wide arch appeared + reads.
import { readFileSync } from "node:fs";
import { artifactOccupancy, occupancyFromCells } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/occupancy.mjs";
import { extractApertures, dressOpenings } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/opening-dressing.mjs";
import { constructWalls } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/wall-generate.mjs";
import { wallSkin } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/wall-skin.mjs";
import { frameArchPlacements } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/arch-frame.mjs";
import { carveTargetCells, apertureCoherenceGate, carveAperture } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/aperture-carve.mjs";
import { rebuildArtifact } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/shell-integrity.mjs";
import { renderBesideConcept } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/render-beside.mjs";
import { roleBlock } from "/Volumes/ext1/swe/repos/mc-design-eval/src/recognition/compile.mjs";

const program = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/sculpture/recognition/gatehouse.program.json","utf8"));
const pack = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/packs/rustic.json","utf8"));
const CONCEPT = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png";
const eaveY = 18;
const seed = artifactOccupancy(JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/sculpture/generated/gatehouse/artifact.json","utf8")));
const tmpl = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/sculpture/generated/gatehouse/artifact.json","utf8"));
const floor = seed.bounds.min[1];
const wallField = roleBlock(pack, program.masses[0].walls.ground.role);
const env = constructWalls(seed, { floor, eaveY, program, wallField });
const occ = wallSkin(env, { program, pack, floor, eaveY, extractApertures, dressOpenings });

await renderBesideConcept(rebuildArtifact(occ, tmpl), CONCEPT, "/Volumes/ext1/swe/repos/mc-design-eval/docs/active/work/T-194-01/before-carve-beside.png", { label: "before" });
console.log("rendered before-carve-beside.png");

const door = program.masses[0].openings.find(o => o.kind === "door" && o.head === "arch");
const declared = extractApertures(occ).find(a => a.dir === door.wall && a.kind === "door")
  ?? extractApertures(seed).find(a => a.dir === door.wall && a.kind === "door");
const U = {"+x":2,"-x":2,"+z":0,"-z":0}[door.wall];
let uMin=Infinity,uMax=-Infinity;
for (const k of occ.cells.keys()){const c=k.split(",").map(Number); if(c[1]<occ.bounds.min[1]||c[1]>eaveY)continue; if(c[U]<uMin)uMin=c[U]; if(c[U]>uMax)uMax=c[U];}
const scale = (uMax-uMin+1)/(U===2?program.masses[0].rect.d:program.masses[0].rect.w);
const { remove, target } = carveTargetCells(occ, declared, { programW: door.w, scale });
const carved = carveAperture(occ, remove);
const t=target,cells=[],flanks={left:[],right:[]},lintel=[];
for(let av=t.vLo;av<=t.vHi;av++)for(let au=t.uLo;au<=t.uHi;au++)cells.push({au,av});
for(let av=t.vLo;av<=t.vHi;av++){flanks.left.push({au:t.uLo-1,av});flanks.right.push({au:t.uHi+1,av});}
for(let au=t.uLo-1;au<=t.uHi+1;au++)lintel.push({au,av:t.vHi+1});
const { placements } = frameArchPlacements(carved, [{kind:"door",dir:t.dir,cells,flanks,lintel}], { frameBlock: roleBlock(pack, door.headRole) });
const dressed = occupancyFromCells([...[...occ.cells].filter(([k])=>!remove.has(k)).map(([k,b])=>({pos:k.split(",").map(Number),block:b})), ...placements.map(p=>({pos:p.pos,block:p.block}))]);
const gate = apertureCoherenceGate(occ, dressed, target, { floor, eaveY });
console.log("GATE ok", gate.ok, "width", target.width, "removed", remove.size);
await renderBesideConcept(rebuildArtifact(dressed, tmpl), CONCEPT, "/Volumes/ext1/swe/repos/mc-design-eval/docs/active/work/T-194-01/arch-beside.png", { label: "carve_arch" });
console.log("rendered arch-beside.png");
