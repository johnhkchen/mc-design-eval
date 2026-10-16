// Plot 1 camelback shotgun: exterior side chimney, fire at the bottom in a hearth set in the kitchen's west wall.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const D = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/millkit2";
const g = await load(`${D}/v1.nbt`);
const TOP = 15;
// 1. remove the old crown, hay, campfire above the stack (x12..15, z13..16, y>=16)
for (let y = 16; y < g.size[1]; y++) for (let x = 12; x <= 15; x++) for (let z = 13; z <= 16; z++) {
  const c = g.get(x, y, z); if (c && !/air$/.test(c.block)) g.set(x, y, z, "air");
}
// 2. a slim stack of constant width: bricks x13-14, z14-16 from the ground to TOP
for (let y = 1; y <= TOP; y++) for (let x = 13; x <= 14; x++) for (let z = 14; z <= 16; z++) g.set(x, y, z, "bricks");
// 3. move the smoker off the hearth's mouth (onto the barrel's cell; the upper barrel stays on top)
g.set(16, 3, 15, "air");
g.set(16, 3, 16, "smoker", { facing: "east", lit: "true" });
// 4. hearth opening through the west wall at the kitchen floor
g.set(15, 3, 15, "air");
// 5. firebox at (14,3,15) opening east, flue up the middle of the stack, walled by masonry/wall on all sides
chimney(g, { at: [14, 3, 15], open: "east", top: TOP, material: "bricks" });
await g.save(`${D}/chimney/plot1.nbt`);
