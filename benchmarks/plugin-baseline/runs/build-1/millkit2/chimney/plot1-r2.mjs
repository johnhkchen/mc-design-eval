import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
const D="/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/millkit2";
const g=load(D+"/v3.nbt");
// east flue wall at the roof eave: the stack's own brick replaces the roof stair
g.set(15,12,15,"minecraft:bricks");
// mouth 2 courses over the eave: trim stack top to y14
for (const [x,z] of [[13,14],[14,14],[13,15],[15,15],[13,16],[14,16]]) g.set(x,15,z,"minecraft:air");
g.save(D+"/chimney/plot1-r2.nbt");
