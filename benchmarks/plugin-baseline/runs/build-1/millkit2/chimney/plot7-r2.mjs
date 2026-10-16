import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const D = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/millkit2";
const g = load(`${D}/v3.nbt`);
const TOP = Number(process.env.TOP ?? 10);
// 1. remove the old hearth from the living room: firebox, breast and the 3x3 stack through the roof
for (let x = 85; x <= 87; x++) for (let z = 12; z <= 14; z++) for (let y = 3; y <= 10; y++) {
  const c = g.get(x, y, z); if (!c) continue;
  const wall = x === 85 && y <= 6;                      // the house's west wall stays
  const roofy = y >= 7 && x >= 85;
  if (wall) continue;
  if (roofy) {
    // the roof is uniform along z (ridge runs north-south): copy the course from z 11
    const r = g.get(x, y, 11);
    if (r && /_stairs$|_slab$|oxidized/.test(r.block) && !(y <= 6)) g.set(x, y, z, r.block, r.state);
    else if (/brick|campfire|hay/.test(c.block)) g.set(x, y, z, "air");
    continue;
  }
  if (/brick|campfire|hay|furnace/.test(c.block)) g.set(x, y, z, "air");
}
g.set(86, 2, 13, "spruce_planks");                       // hay bale out, floor back
// 2. a new exterior chimney on the kitchen's south (gable) wall, set into the wall: fire one cell outside at 86,3,18
g.set(86, 3, 16, "air");                                  // clear the barrel in front of the mouth
chimney(g, { wall: [86, 3, 17], into: "north", top: TOP, material: "bricks" });
// footing: the stack stands on the ground, not on air
for (const x of [85, 86, 87]) for (const y of [1, 2]) { if (!g.get(x, y, 19) || /air$/.test(g.get(x, y, 19).block)) g.set(x, y, 19, "bricks"); }
for (const x of [85, 87]) if (!g.get(x, 2, 18) || /air$/.test(g.get(x, 2, 18).block)) g.set(x, 2, 18, "bricks");
g.save(`${D}/chimney/plot7-r2.nbt`);
