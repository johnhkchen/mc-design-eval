// Round 2: Parisian cues — dormers with copper caps, brick chimneys, striped awnings, window boxes, lanterns.
import { load, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const g = load("round-1.nbt");
const S = (x, y, z, b, st) => g.set(x, y, z, b, st);
const air = (x, y, z) => !g.blockAt(x, y, z) || g.blockAt(x, y, z) === "minecraft:air";
const stair = (x, y, z, m, f, h = "bottom") => S(x, y, z, ...B.stairs(m, f, h));
// dormers on the street slope
for (const x of [4, 8, 11, 14, 18]) {
  for (const dx of [-1, 1]) { S(x + dx, 22, 3, "calcite"); }
  S(x, 22, 3, "glass_pane"); S(x, 23, 3, "calcite");
  S(x - 1, 23, 3, ...B.stairs("waxed_oxidized_cut_copper", "east")); S(x + 1, 23, 3, ...B.stairs("waxed_oxidized_cut_copper", "west"));
  S(x, 24, 3, ...B.slab("waxed_oxidized_cut_copper"));
  S(x - 1, 22, 2, "calcite"); S(x + 1, 22, 2, "calcite");
  stair(x, 21, 2, "stone_brick", "north", "top");
  S(x, 21, 1, ...B.trapdoor("dark_oak", "north", "bottom", true)); 
}
// brick chimneys with pots
for (const [x, z] of [[7, 14], [15, 14], [11, 10]]) {
  for (let y = 25; y <= 29; y++) S(x, y, z, "bricks");
  S(x, 30, z, "brick_wall", {}); S(x, 29, z + 0, "bricks");
}
// striped red/white awnings over ground-floor bays
for (const [lo, hi] of [[3, 7], [9, 13], [15, 19]]) for (let x = lo; x <= hi; x++) {
  const m = (x + lo) % 2 ? "brick" : "quartz";
  if (air(x, 4, 0)) stair(x, 4, 0, m, "north");
  if (air(x, 3, 0) && (x === lo || x === hi)) S(x, 3, 0, ...B.trapdoor("dark_oak", "north", "bottom", true));
}
// lanterns and planters flanking the door
for (const x of [8, 14]) { if (air(x, 3, 0)) S(x, 3, 0, ...B.lantern(false)); }
for (const x of [2, 20]) { if (air(x, 1, 0)) S(x, 1, 0, "potted_red_tulip"); }
// window boxes with flowers on upper storeys
for (const y of [8, 12, 16]) for (const x of [4, 8, 11, 14, 18]) {
  if (air(x, y, 0)) S(x, y, 0, ...B.slab("spruce"));
  if (air(x, y + 1, 0)) S(x, y + 1, 0, ["potted_red_tulip", "potted_azure_bluet", "potted_pink_tulip"][(x + y) % 3]);
}
g.save("build.nbt");
console.log(g.census().slice(0, 12));
