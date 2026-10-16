import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { chimney } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const D = "/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/millkit2";
const g = await load(`${D}/v1.nbt`);
const air = (x, y, z) => g.set(x, y, z, "air");
// 1. remove the old lollipop: crown (x1..4,z15..18,y12..15), hay, campfire, and the cobble shaft (x2..3,z16..17,y1..11)
for (let x = 1; x <= 4; x++) for (let z = 15; z <= 18; z++) for (let y = 12; y <= 15; y++) air(x, y, z);
for (let x = 2; x <= 3; x++) for (let z = 16; z <= 17; z++) for (let y = 1; y <= 11; y++) air(x, y, z);
// 2. the bed moves out of the hearth's side to the north end of the pen, foot (2,3,10), head (3,3,10) against the east wall
const bnbt = g.get(3, 3, 13)?.nbt;
air(3, 3, 13); air(3, 3, 14);
g.set(2, 3, 10, "red_bed", { occupied: "false", facing: "east", part: "foot" });
g.set(3, 3, 10, "red_bed", { occupied: "false", facing: "east", part: "head" });
if (bnbt) for (const p of [[2,3,10],[3,3,10]]) g.get(...p).nbt = bnbt;
// 3. the hearth: replaces the stove; fire at (2,3,14) opening north into the pen; flue straight up, 1x1; slim iron stovepipe above the roof
air(2, 3, 14); air(2, 4, 14);
chimney(g, { at: [2, 3, 14], open: "north", top: 10, material: "stone_bricks", thin: null });
// above the roof (y8 up) the stack is a slim 1 x 1 pipe: four open iron trapdoors round the flue (roof cells stay as they are)
for (let y = 8; y <= 10; y++) for (const [d, dx, dz] of [["north",0,-1],["south",0,1],["east",1,0],["west",-1,0]]) {
  const x = 2 + dx, z = 14 + dz, c = g.get(x, y, z);
  if (c && c.block === "minecraft:stone_bricks") air(x, y, z);
  const now = g.get(x, y, z);
  if (!now || /air$/.test(now.block)) g.set(x, y, z, "iron_trapdoor", { facing: d, half: "bottom", open: "true", powered: "false", waterlogged: "false" });
}
await g.save(`${D}/chimney/plot0.nbt`);
