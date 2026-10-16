// Plot 4 boarding house: hearth at the bottom (kitchen, west wall), 1x1 flue up the gable end, iron-trapdoor stovepipe above the roof.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import path from "node:path";
const D = path.resolve(import.meta.dirname, "..");
const g = load(`${D}/v1.nbt`);
const st = (f) => ({ facing: f, half: "bottom", shape: "straight", waterlogged: "false" });
const slab = { type: "bottom", waterlogged: "false" };
// 1. remove the old crown, hay and campfire
for (let x = 48; x <= 51; x++) for (let y = 18; y <= 21; y++) for (let z = 11; z <= 14; z++) g.set(x, y, z, "air");
// 2. old shaft above the roof / inside the attic that no longer belongs: restore the roof (ridge stairs + slab) and clear the rest
for (const x of [49, 50]) {
  g.set(x, 15, 12, "tuff_brick_stairs", st("south")); g.set(x, 16, 12, "tuff_brick_slab", slab);
  g.set(x, 15, 13, "tuff_brick_stairs", st("north")); g.set(x, 16, 13, "tuff_brick_slab", slab);
  g.set(x, 17, 12, "air"); g.set(x, 17, 13, "air");
}
for (let y = 12; y <= 14; y++) g.set(50, y, 12, "air");          // attic stub of the old shaft
g.set(50, 3, 13, "air");                                          // the hearth's mouth cell (was shaft)
// 3. the hearth: fire at 49,3,13 in the west wall plane, open east into the kitchen; flue x49 z13 up to y18
chimney(g, { at: [49, 3, 13], open: "east", top: 18, material: "cobblestone", thin: "iron" });
g.save(`${D}/chimney/plot4.nbt`);
