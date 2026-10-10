import { load, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const g = await load(process.argv[2]);
const put = (x, y, z, ...p) => g.set(x, y, z, ...p);
// paint hung two lanterns at the back corners with nothing above them: take them down (check: FLOATING)
for (const x of [0, 16]) if (g.blockAt(x, 4, 12) === "minecraft:lantern") g.unset(x, 4, 12);
// rounded parapet corners: the back corner cells get a bottom stair facing into the wall, so the edge falls off instead of a square arris
for (const x of [1, 15]) put(x, 4, 10, ...B.stairs("smooth_sandstone", "north", "bottom"));
// clay pots on a sandstone ledge along the back base, just outside the back wall
for (const x of [2, 6, 10, 14]) {
  put(x, 0, 12, "cut_sandstone");
  put(x, 1, 12, "decorated_pot");
}
g.save(process.argv[3]);
console.log("saved", process.argv[3]);
