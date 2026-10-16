import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const D = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/millkit2";
const g = await load(`${D}/v3.nbt`);
const air = (x, y, z) => g.set(x, y, z, "air");
const B = "bricks";
// 1. take the old interior hearth out: fire, hay, breast stones, stovepipe trapdoors; give the pen its floor and wall back
air(2, 3, 14); g.set(2, 2, 14, "spruce_planks");
g.set(1, 3, 14, "oak_log", { axis: "z" });                          // west wall cell the old firebox side had replaced
for (let y = 3; y <= 7; y++) air(3, y, 14);
for (let y = 4; y <= 7; y++) air(2, y, 13);
g.set(2, 3, 15, "oak_log", { axis: g.get(1, 3, 15).state.axis });   // old firebox back; the wall again
for (const [x, y, z] of [[2,8,13],[2,8,15],[1,9,14],[3,9,14],[2,9,15],[2,10,13],[2,10,15],[1,10,14],[3,10,14]]) air(x, y, z);
{ const s = g.get(3, 8, 14); g.set(2, 8, 14, s.block, s.state); }   // roof tile the old flue cut, restored
// 2. the exterior chimney on the pen's back (south) wall: fire at 3,3,16, mouth cut through wall cell 3,3,15
for (let x = 2; x <= 4; x++) for (let z = 16; z <= 17; z++) g.set(x, 1, z, "stone_bricks");   // footing on the grass
chimney(g, { wall: [3, 3, 15], into: "north", top: 9, material: B });
// 3. square the stack: the two back corners, footing to top
for (let y = 2; y <= 9; y++) for (const x of [2, 4]) g.set(x, y, 17, B);
await g.save(`${D}/chimney/plot0-r2.nbt`);
