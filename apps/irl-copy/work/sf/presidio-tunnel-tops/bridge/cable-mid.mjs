// The Golden Gate's main cables over the middle of the main span, where the bridge kit's cable module (the 248 blocks
// next to each tower) leaves a gap: 142 blocks either side of mid-span, in the kit's own blocks (orange terracotta with
// smooth red sandstone slabs for the half steps, orange concrete cable bands, red glass-pane suspenders every 4 blocks).
// The kit's curve, y = 41.9 + 0.00069 (z + 72)^2 (z in the kit's frame, mid-span at -71.5), lifted to no lower than y 45
// so the cable rides 3 blocks over the crowned deck (road y 41 at mid-span). Module z 0 = kit z -142 (y 0 = the water).
//   node cable-mid.mjs -> cable-mid.nbt
import { Grid, DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
const D = 142, g = new Grid([15, 50, D], { dataVersion: DATA_VERSIONS["1.21.1"] });
for (let mz = 0; mz < D; mz++) {
  const z = mz - 142, y = Math.max(45, 41.9 + 0.00069 * (z + 72) ** 2), base = Math.floor(y), half = y - base >= 0.5, band = ((z % 4) + 4) % 4 === 0;
  for (const x of [0, 14]) {
    g.set(x, base, mz, band ? "minecraft:orange_concrete" : "minecraft:orange_terracotta");
    if (half) g.set(x, base + 1, mz, "minecraft:smooth_red_sandstone_slab", { type: "bottom" });
    if (band) for (let yy = 41; yy < base; yy++) g.set(x, yy, mz, "minecraft:red_stained_glass_pane", { north: "false", east: "false", south: "false", west: "false" });
  }
}
g.save(new URL("./cable-mid.nbt", import.meta.url).pathname); console.log("cable-mid.nbt", g.size);
