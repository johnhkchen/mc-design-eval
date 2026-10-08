// The "plain agent build" fixture: what a model focused on function produces. A 7×6×21 spruce-plank
// tube (1-thick floor, walls, ceiling), wall torches every 6 blocks, and a working redstone line along
// the floor (lever → dust → repeater → dust → lamp) that the beautify pass must not break.
//   node make-spruce-hallway.mjs   → spruce-hallway.nbt
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Grid } from "../scripts/nbt.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const [W, H, L] = [7, 6, 21];
const g = new Grid([W, H, L]);
const P = "minecraft:spruce_planks";

g.fill([0, 0, 0], [W - 1, 0, L - 1], P); // floor
g.fill([0, H - 1, 0], [W - 1, H - 1, L - 1], P); // ceiling
g.fill([0, 1, 0], [0, H - 2, L - 1], P); // west wall
g.fill([W - 1, 1, 0], [W - 1, H - 2, L - 1], P); // east wall
g.fill([1, 1, 0], [W - 2, H - 2, L - 1], "minecraft:air"); // clear the inside

for (const z of [4, 10, 16]) {
  g.set(1, 3, z, "minecraft:wall_torch", { facing: "east" });
  g.set(W - 2, 3, z, "minecraft:wall_torch", { facing: "west" });
}

// The function: signal runs +z (south) along x=1.
const wire = { north: "side", south: "side", east: "none", west: "none", power: 0 };
g.set(1, 1, 0, "minecraft:lever", { face: "floor", facing: "south", powered: false });
for (let z = 1; z <= 18; z++) g.set(1, 1, z, "minecraft:redstone_wire", wire);
g.set(1, 1, 10, "minecraft:repeater", { facing: "north", delay: 1, locked: false, powered: false });
g.set(1, 1, 19, "minecraft:redstone_lamp", { lit: false });

await g.save(join(HERE, "spruce-hallway.nbt"));
console.log("wrote spruce-hallway.nbt", g.size, g.voxels().length, "blocks");
