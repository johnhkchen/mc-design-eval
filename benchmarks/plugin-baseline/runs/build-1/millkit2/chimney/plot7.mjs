import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const D = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/millkit2";
const g = await load(`${D}/v1.nbt`);
const air = (x, y, z) => g.set(x, y, z, "air");
// 1. old lollipop: crown/hay/campfire (x84..87, z12..15, y11..15)
for (let x = 84; x <= 87; x++) for (let z = 12; z <= 15; z++) for (let y = 11; y <= 15; y++) air(x, y, z);
// 2. the hearth replaces the furnace at 87,3,13: fire at 86,3,13 opening east into the living room; mouth cell cleared
air(87, 3, 13);
chimney(g, { at: [86, 3, 13], open: "east", top: 10, material: "bricks" });
// 3. above the roof: one uniform 3x3 brick stack (x85..87, z12..14), y7..10, flue 86,*,13 stays air
for (let x = 85; x <= 87; x++) for (let z = 12; z <= 14; z++) for (let y = 7; y <= 10; y++) {
  if (x === 86 && z === 13) continue;
  const c = g.get(x, y, z);
  if (!c || /air$/.test(c.block)) g.set(x, y, z, "bricks");
}
// the roof slab under the stack becomes masonry
for (const [x, z] of [[85, 12], [86, 12], [87, 12], [87, 13], [87, 14]]) { const c = g.get(x, 8, z); if (c && /slab$/.test(c.block)) g.set(x, 8, z, "bricks"); }
await g.save(`${D}/chimney/plot7.nbt`);
