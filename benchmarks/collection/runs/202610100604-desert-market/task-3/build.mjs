// Desert adobe market hall. Front faces NORTH (-z), x along the street. Grid 17 x 9 x 13.
// Hall z2..11 (notched "rounded" corners, walls 2 thick), clear y1..4, roof deck y5 (preset `desert`), terrace y6..8
// with a dome and a wind tower; street apron + 2-deep striped awnings z0..1; vigas in the deck course on all sides.
import { Grid, B, dome, arch, roof, paint, signboard, load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

let g = new Grid([17, 9, 13]);
const OUT = process.env.OUT ?? "build.nbt";
const put = (x, y, z, ...p) => g.set(x, y, z, ...p);
const fill = (a, b, blk, s) => g.fill(a, b, blk, s);
const stairs = (x, y, z, m, f, h = "bottom") => put(x, y, z, ...B.stairs(m, f, h));
const slab = (x, y, z, m, t = "bottom") => put(x, y, z, ...B.slab(m, t));
const log = (x, y, z, m, a = "y") => put(x, y, z, ...B.log(m, a));
const fence = (x, y, z, m = "spruce") => put(x, y, z, ...B.fence(m));
const pot = (x, y, z) => put(x, y, z, "decorated_pot");
const barrel = (x, y, z) => put(x, y, z, "barrel", { facing: "up" });

const WALL = "sandstone", SMOOTH = "smooth_sandstone", PLINTH = "cut_sandstone", BAND = "orange_terracotta";
const DECK = 5;                                                          // roof deck course (wall top + 1)

// ---- plan: outer union and the interior (shrunk by 2 = 2-thick walls) ----
const R1 = [1, 3, 15, 10], R2 = [2, 2, 14, 11];                          // x0,z0,x1,z1
const inRect = (r, x, z) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];
const shrink = (r, n) => [r[0] + n, r[1] + n, r[2] - n, r[3] - n];
const outer = (x, z) => inRect(R1, x, z) || inRect(R2, x, z);
const inner = (x, z) => inRect(shrink(R1, 2), x, z) || inRect(shrink(R2, 2), x, z);
const skin = (x, z) => outer(x, z) && [-1, 0, 1].some((dx) => [-1, 0, 1].some((dz) => (dx === 0 || dz === 0) && !outer(x + dx, z + dz)));

// ---- street apron, floor, walls ----
fill([1, 0, 0], [15, 0, 1], "smooth_sandstone");
for (let x = 1; x <= 15; x++) for (let z = 0; z <= 1; z++) if (x >= 6 && x <= 10 && (x + z) % 2 === 0) put(x, 0, z, BAND);   // tiled forecourt at the entrance
for (let x = 0; x < 17; x++) for (let z = 0; z < 13; z++) {
  if (!outer(x, z)) continue;
  put(x, 0, z, inner(x, z) ? ((x + z) % 2 ? "smooth_sandstone" : BAND) : PLINTH);
  for (let y = 1; y <= 4; y++) put(x, y, z, inner(x, z) ? "air" : (skin(x, z) ? WALL : WALL));
}
// plinth, a bold orange terracotta band y2-3 round every outer face, a smooth sandstone top course y4
for (let x = 0; x < 17; x++) for (let z = 0; z < 13; z++) {
  if (!skin(x, z)) continue;
  put(x, 1, z, PLINTH);
  put(x, 2, z, BAND); put(x, 3, z, BAND);
  put(x, 4, z, SMOOTH);
}
// interior wall faces: plain smooth sandstone so the room is calm
for (let x = 0; x < 17; x++) for (let z = 0; z < 13; z++) {
  if (!outer(x, z) || inner(x, z) || skin(x, z)) continue;
  for (let y = 1; y <= 4; y++) put(x, y, z, SMOOTH);
}

// ---- front: two segmental stall openings and a grand round entrance arch ----
for (const x0 of [3, 11]) arch(g, { at: [x0, 1, 2], width: 3, height: 3, depth: 2, axis: "x", profile: "segmental", block: WALL });
arch(g, { at: [7, 1, 2], width: 3, height: 4, depth: 2, axis: "x", profile: "round", block: WALL, frame: "dark_oak_planks" });
// piers get a dark oak lintel beam over the stall openings (reads as the timber head of an adobe opening)
for (const x of [3, 4, 5, 11, 12, 13]) put(x, 4, 2, ...B.log("dark_oak", "x"));

// entrance: dark oak timber head over the arch, lanterns hung from it, a blade sign under the centre viga
for (const x of [7, 8, 9]) for (const z of [2, 3]) log(x, 4, z, "dark_oak", "x");
for (const x of [7, 9]) put(x, 3, 3, ...B.lantern(true));
put(8, 4, 1, ...B.sign("spruce", ["SOUK", "BAZAAR"], { wall: false, hanging: true, rotation: 8, color: "black" }));
for (const y of [1, 2, 3]) { put(6, y, 3, ...B.log("dark_oak", "y")); put(10, y, 3, ...B.log("dark_oak", "y")); }

// ---- striped cloth awnings (5 wide, 2 deep, rising to the wall) on spruce posts ----
for (const x0 of [2, 10]) for (let i = 0; i < 5; i++) {
  const m = i % 2 === 0 ? "red_sandstone" : "smooth_quartz";
  stairs(x0 + i, 3, 0, m, "south");
  stairs(x0 + i, 4, 1, m, "south");
  slab(x0 + i, 3, 1, m === "red_sandstone" ? "red_sandstone" : "quartz", "top");    // soffit under the high edge
}
for (const x of [2, 6, 10, 14]) { fence(x, 1, 0); fence(x, 2, 0); }
for (const x of [4, 12]) put(x, 2, 0, ...B.lantern(true));                           // hung under the awning lip

// ---- vigas: dark oak beam ends 1 proud in the deck course (y5), every 2nd cell, all four sides ----
for (let x = 2; x <= 14; x += 2) { log(x, DECK, 1, "dark_oak", "z"); log(x, DECK, 12, "dark_oak", "z"); }
for (const z of [3, 5, 7, 9]) { log(0, DECK, z, "dark_oak", "x"); log(16, DECK, z, "dark_oak", "x"); }

// ---- side and back openings ----
arch(g, { at: [1, 2, 7], width: 2, height: 2, depth: 2, axis: "z", profile: "round", block: WALL });
arch(g, { at: [14, 2, 7], width: 2, height: 2, depth: 2, axis: "z", profile: "round", block: WALL });
for (const z of [7, 8]) for (const y of [2, 3]) for (const x of [2, 14]) if (g.blockAt(x, y, z) === "minecraft:air") put(x, y, z, "glass_pane");
for (const [xo, xi, f] of [[1, 2, "west"], [15, 14, "east"]]) {
  for (const y of [1, 2]) { put(xi, y, 5, "air"); put(xo, y, 5, "air"); }
  put(xo, 1, 5, ...B.door("spruce", f, "lower")); put(xo, 2, 5, ...B.door("spruce", f, "upper"));
  put(xo + (f === "west" ? -1 : 1), 4, 5, ...B.lantern(true));
}
for (const x of [4, 12]) for (const y of [2, 3]) {
  put(x, y, 11, "air"); put(x, y, 10, "glass_pane");
  put(x - 1, y, 12, ...B.trapdoor("spruce", "south", "bottom", true)); put(x + 1, y, 12, ...B.trapdoor("spruce", "south", "bottom", true));
}
for (const y of [1, 2]) { put(8, y, 11, "air"); put(8, y, 10, "air"); }
put(8, 1, 11, ...B.door("spruce", "south", "lower")); put(8, 2, 11, ...B.door("spruce", "south", "upper"));
put(8, 4, 12, ...B.lantern(true));

// ---- ROOF: desert preset (flat sandstone deck, parapet, quartz coping); tower is built by hand below ----
if (process.env.NOROOF) { g.save(OUT); process.exit(0); }
const rr = roof(g, [R1, R2], "desert", { y: DECK, tower: false });
console.log("roof", JSON.stringify({ top: rr.top, refused: rr.refused?.length, notes: rr.notes }));
if (process.env.SHELL_ONLY) { g.save(OUT); process.exit(0); }

// ---- terrace: dome with an orange band, wind tower with vents and beam stubs ----
const T = DECK + 1;
dome(g, { center: [6, T, 6], radius: 3, height: 3, profile: "hemisphere", block: WALL });
for (let x = 2; x <= 10; x++) for (let z = 2; z <= 10; z++) {                          // orange course on the dome's first ring
  const c = g.get(x, T + 1, z);
  if (c && c.block === "minecraft:sandstone_stairs") put(x, T + 1, z, "red_sandstone_stairs", c.state);
}
fill([11, T, 7], [13, T + 1, 9], WALL);
fill([12, T, 8], [12, T + 1, 8], "air");
for (const y of [T, T + 1]) { put(12, y, 7, "dark_oak_trapdoor", { facing: "north", half: "bottom", open: "true", powered: "false", waterlogged: "false" }); put(12, y, 9, "dark_oak_trapdoor", { facing: "south", half: "bottom", open: "true", powered: "false", waterlogged: "false" }); put(11, y, 8, "dark_oak_trapdoor", { facing: "west", half: "bottom", open: "true", powered: "false", waterlogged: "false" }); put(13, y, 8, "dark_oak_trapdoor", { facing: "east", half: "bottom", open: "true", powered: "false", waterlogged: "false" }); }
fill([11, T + 2, 7], [13, T + 2, 9], "red_sandstone_slab", { type: "bottom", waterlogged: "false" });
log(10, T + 1, 8, "dark_oak", "x"); log(14, T + 1, 8, "dark_oak", "x"); log(12, T + 1, 6, "dark_oak", "z");

// ---- stalls, pots, baskets (street side, under the awnings) ----
for (const [x0, flip] of [[3, 1], [11, -1]]) {
  for (let i = 0; i < 3; i++) slab(x0 + i, 1, 3, "spruce", "top");                  // stall counter in the opening
  put(x0, 2, 3, "potted_cactus"); pot(x0 + 1, 2, 3); put(x0 + 2, 2, 3, "composter");
  barrel(x0 + 1, 1, 4); put(x0 + (flip > 0 ? 2 : 0), 1, 4, "hay_block"); pot(x0 + 1, 2, 4);
  barrel(x0, 1, 1); pot(x0 + 1, 1, 1); put(x0 + 2, 1, 1, "hay_block");
}
for (const x of [2, 14]) put(x, 1, 1, "potted_fern");
for (const x of [6, 10]) pot(x, 1, 1);
for (let z = 4; z <= 9; z++) put(8, 1, z, z % 2 ? "white_carpet" : "orange_carpet");
for (const z of [5, 8]) for (const x of [6, 10]) put(x, 4, z, ...B.lantern(true));
for (const [x, z, b] of [[4, 6, "barrel"], [4, 7, "hay_block"], [12, 6, "hay_block"], [12, 7, "barrel"], [4, 9, "barrel"], [12, 9, "barrel"]]) b === "barrel" ? barrel(x, 1, z) : put(x, 1, z, b);
pot(4, 2, 6); pot(12, 2, 7); pot(5, 1, 9); pot(11, 1, 9);

// ---- terrace life: shade cloth (striped slabs on fence posts), crates, plants ----
for (const [x, z] of [[11, 3], [13, 3], [11, 5], [13, 5]]) { fence(x, T, z); fence(x, T + 1, z); }
for (let x = 11; x <= 13; x++) for (let z = 3; z <= 5; z++) slab(x, T + 2, z, x % 2 ? "red_sandstone" : "quartz");
barrel(12, T, 4); put(11, T, 4, "potted_cactus");
for (const [x, z] of [[3, 3], [3, 9], [10, 10], [3, 6]]) put(x, T, z, "flowering_azalea");
barrel(10, T, 3);
fence(3, T, 4); fence(3, T + 1, 4); put(3, T + 2, 4, ...B.banner("orange", [["stripe_center", "white"], ["stripe_bottom", "white"]], { wall: false, rotation: 8 }));   // flag on a pole

// ---- spruce railing on the terrace edge (front run in three panels so the dome and awning read) ----
const pr = paint(g, `roof z 2 x 3..13 -> railing spruce_fence force
roof z 11 x 3..13 -> railing spruce_fence force`);
console.log("railing", JSON.stringify(pr.report));
g = pr.grid;
g.save(OUT);
console.log(JSON.stringify({ saved: OUT, size: g.size, refused: g.refused }));
