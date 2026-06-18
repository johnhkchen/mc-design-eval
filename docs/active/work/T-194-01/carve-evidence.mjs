// Deterministic evidence for T-194-01 carve_arch: build → construct walls → carve+dress the declared gate →
// aperture-coherence gate. No GL, no model. The realistic input is a CONSTRUCTED-walls build (carve_arch is
// picked after construct_walls in the climb), not the raw ragged GLB seed.
import { readFileSync } from "node:fs";
import { artifactOccupancy, occupancyFromCells } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/occupancy.mjs";
import { extractApertures, dressOpenings } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/opening-dressing.mjs";
import { constructWalls } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/wall-generate.mjs";
import { wallSkin } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/wall-skin.mjs";
import { frameArchPlacements } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/arch-frame.mjs";
import { carveTargetCells, apertureCoherenceGate, carveAperture } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/aperture-carve.mjs";
import { recessClosureGuard } from "/Volumes/ext1/swe/repos/mc-design-eval/src/view/treatment-grammar.mjs";
import { roleBlock } from "/Volumes/ext1/swe/repos/mc-design-eval/src/recognition/compile.mjs";

const program = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/sculpture/recognition/gatehouse.program.json","utf8"));
const pack = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/packs/rustic.json","utf8"));
const eaveY = 18;
const seed = artifactOccupancy(JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/sculpture/generated/gatehouse/artifact.json","utf8")));
const floor = seed.bounds.min[1];
const groundRole = program.masses[0].walls?.ground?.role;
const wallField = groundRole ? roleBlock(pack, groundRole) : undefined;
const env = constructWalls(seed, { floor, eaveY, program, wallField });
const occ = wallSkin(env, { program, pack, floor, eaveY, extractApertures, dressOpenings });
console.log("CONSTRUCTED build bounds", JSON.stringify(occ.bounds), "size", occ.size);

const door = program.masses[0].openings.find(o => o.kind === "door" && o.head === "arch");
const onBuild = extractApertures(occ).find(a => a.dir === door.wall && a.kind === "door");
const declared = onBuild ?? extractApertures(seed).find(a => a.dir === door.wall && a.kind === "door");
console.log("door aperture source", onBuild ? "LIVE build" : "seed ref", "dir", declared?.dir, "cells", declared?.cells.length,
  "au", declared && [Math.min(...declared.cells.map(c=>c.au)), Math.max(...declared.cells.map(c=>c.au))],
  "av", declared && [Math.min(...declared.cells.map(c=>c.av)), Math.max(...declared.cells.map(c=>c.av))]);

const U = {"+x":2,"-x":2,"+z":0,"-z":0}[door.wall];
let uMin=Infinity,uMax=-Infinity;
for (const k of occ.cells.keys()){const c=k.split(",").map(Number); if(c[1]<occ.bounds.min[1]||c[1]>eaveY)continue; if(c[U]<uMin)uMin=c[U]; if(c[U]>uMax)uMax=c[U];}
const progSpan = U===2? program.masses[0].rect.d : program.masses[0].rect.w;
const scale = (uMax-uMin+1)/progSpan;
const { remove, target } = carveTargetCells(occ, declared, { programW: door.w, scale });
console.log("CARVE width", target.width, "u", target.uLo, target.uHi, "v", target.vLo, target.vHi, "w-depth", target.wMin, target.wMax, "removed", remove.size);

const carved = carveAperture(occ, remove);
const t=target; const cells=[],flanks={left:[],right:[]},lintel=[];
for(let av=t.vLo;av<=t.vHi;av++)for(let au=t.uLo;au<=t.uHi;au++)cells.push({au,av});
for(let av=t.vLo;av<=t.vHi;av++){flanks.left.push({au:t.uLo-1,av});flanks.right.push({au:t.uHi+1,av});}
for(let au=t.uLo-1;au<=t.uHi+1;au++)lintel.push({au,av:t.vHi+1});
const wideAp = {kind:"door",dir:t.dir,cells,flanks,lintel};
const { placements, perOpening } = frameArchPlacements(carved, [wideAp], { frameBlock: roleBlock(pack, door.headRole) });
console.log("frameArch", JSON.stringify(perOpening));
const dressed = occupancyFromCells([...[...occ.cells].filter(([k])=>!remove.has(k)).map(([k,b])=>({pos:k.split(",").map(Number),block:b})), ...placements.map(p=>({pos:p.pos,block:p.block}))]);
const gate = apertureCoherenceGate(occ, dressed, target, { floor: occ.bounds.min[1], eaveY });
console.log("GATE", JSON.stringify({ok:gate.ok, scope:gate.scope.ok, coherent:gate.coherent, closure:gate.closure, reason:gate.reason}));
const guard = recessClosureGuard(occ, dressed, { floor: occ.bounds.min[1], eaveY });
console.log("closureOf before", guard.before.toFixed(4), "after", guard.after.toFixed(4));
