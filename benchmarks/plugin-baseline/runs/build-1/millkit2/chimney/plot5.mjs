// Plot 5 work yard / smokehouse: the smoking fire in a firebox set into the back (south) wall at floor level,
// opening north into the smoke room; a 1x1 flue rises in the wall plane through the gable end, out above the ridge.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const D = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/millkit2";
const g = await load(`${D}/v1.nbt`);
const TOP = 10;
// 1. remove the old crown, hay and campfire (x62..64, z16..18, y>=9)
for (let y = 9; y < g.size[1]; y++) for (let x = 62; x <= 64; x++) for (let z = 16; z <= 18; z++) {
  const c = g.get(x, y, z); if (c && !/air$/.test(c.block)) g.set(x, y, z, "air");
}
// 2. the old smoker in the hearth's mouth moves to the room's floor beside it
g.set(63, 1, 15, "air");
g.set(62, 1, 15, "smoker", { facing: "east", lit: "true" });
// 3. firebox at (63,1,16) opening north; cobble shaft x63 z17 stays as the flue's south wall up to y8
chimney(g, { at: [63, 1, 16], open: "north", top: TOP, material: "cobblestone", thin: "iron" });
await g.save(`${D}/chimney/plot5.nbt`);
