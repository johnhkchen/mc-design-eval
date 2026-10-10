// Crooked fantasy wizard tower, BODY pass (roof comes from `mcd roof`, finish from finish.mjs).
// x east, y up, z south; front faces NORTH (-z). Grid 13 x 30 x 13.
// mound y0..2 | stone shaft x3..9 z3..9 y3..9 | floor1 x2..10 z2..10 deck y10 walls y11..13 | floor2 x1..9 z1..9 deck y14 walls y15..17 | roof from y18
import { Grid, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OUT = new URL("./stage.nbt", import.meta.url).pathname;
const g = new Grid([13, 30, 13]);
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);
const put = (x, y, z, p) => g.set(x, y, z, ...p);
const fill = (a, b, blk, s) => g.fill(a, b, blk, s);
const air = (a, b) => g.fill(a, b, "minecraft:air");
const hash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const PLASTER = "calcite", LOG = "dark_oak_log", BEAM = "stripped_dark_oak_log", DECK = "spruce_planks";
const paneS = (axis) => (axis === "x" ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const pane = (x, y, z, axis, blk = "glass_pane") => set(x, y, z, blk, paneS(axis));

// ---- 1. rocky mound (13x13, ragged edge, plateau y2 in the middle) -----------------------------------------------
const rockAt = (x, y, z) => { const r = hash(x, y, z); return r < 0.2 ? "mossy_cobblestone" : r < 0.42 ? "cobblestone" : r < 0.55 ? "andesite" : r < 0.62 ? "tuff" : "stone"; };
for (let x = 0; x <= 12; x++) for (let z = 0; z <= 12; z++) {
  const dmin = Math.min(x, 12 - x, z, 12 - z);
  let h = dmin >= 1 ? 3 : (hash(x, 9, z) < 0.5 ? 1 : 2);
  if (dmin === 1 && hash(x, 4, z) < 0.25) h = 2;
  if (z === 0 && x >= 5 && x <= 7) h = 1;
  for (let y = 0; y < h; y++) set(x, y, z, rockAt(x, y, z));
  const top = h - 1, r = hash(x, 77, z);
  if (!(z <= 2 && x >= 4 && x <= 8) && !(x >= 3 && x <= 9 && z >= 3 && z <= 9)) {
    if (r < 0.3) set(x, top, z, "moss_block"); else if (r < 0.45) set(x, top, z, "grass_block");
    const q = hash(x, 31, z);
    if (r < 0.45) set(x, top + 1, z, q < 0.35 ? "short_grass" : q < 0.55 ? "fern" : q < 0.62 ? "poppy" : q < 0.7 ? "azure_bluet" : q < 0.76 ? "allium" : q < 0.8 ? "cornflower" : "air");
  }
}
// stair flight to the door: y0 stone, y1 stair, plateau y2, stoop
fill([5, 0, 0], [7, 0, 0], "stone_bricks");
for (const x of [5, 6, 7]) put(x, 1, 0, B.stairs("stone_brick", "south"));
fill([5, 1, 1], [7, 1, 1], "stone_bricks");
for (const x of [5, 6, 7]) put(x, 2, 1, B.stairs("stone_brick", "south"));
fill([5, 2, 2], [7, 2, 2], "stone_bricks");
for (const x of [4, 8]) for (const z of [1, 2]) set(x, 2, z, "mossy_stone_bricks");

// ---- 2. stone shaft x3..9 z3..9 y3..9 (hollow), floors y2 (ground) and y6 -----------------------------------------
const stoneAt = (x, y, z) => { const r = hash(x, y, z), moss = y < 7 ? 0.22 : 0.1; return r < moss ? "mossy_stone_bricks" : r < moss + 0.14 ? "cracked_stone_bricks" : r < moss + 0.3 ? "cobblestone" : r < moss + 0.36 ? "andesite" : "stone_bricks"; };
for (let y = 3; y <= 9; y++) for (let x = 3; x <= 9; x++) for (let z = 3; z <= 9; z++) {
  if (x > 3 && x < 9 && z > 3 && z < 9) continue;
  set(x, y, z, stoneAt(x, y, z));
}
fill([4, 2, 4], [8, 2, 8], DECK);
fill([4, 6, 4], [8, 6, 8], DECK);
for (const [x, z] of [[3, 3], [9, 3], [3, 9], [9, 9]]) for (let y = 3; y <= 9; y++) set(x, y, z, y % 3 === 0 ? "chiseled_stone_bricks" : "stone_bricks");
const ring = (x0, z0, x1, z1) => { const c = []; for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x === x0 || x === x1 || z === z0 || z === z1) c.push([x, z]); return c; };
const outF = (x, z, x0, z0, x1, z1) => (z === z0 ? "south" : z === z1 ? "north" : x === x0 ? "east" : "west");
// battered plinth ring of stairs at y3 (wider foot)
for (const [x, z] of ring(2, 2, 10, 10)) {
  const corner = (x === 2 || x === 10) && (z === 2 || z === 10);
  if (z === 2 && x >= 4 && x <= 8) continue;
  if (corner) { set(x, 3, z, "mossy_cobblestone"); set(x, 4, z, "cobblestone"); continue; }
  put(x, 3, z, B.stairs(hash(x, 3, z) < 0.3 ? "mossy_stone_brick" : "stone_brick", outF(x, z, 2, 2, 10, 10)));
}
// door: arch hood, timber jambs
air([6, 3, 3], [6, 5, 3]);
put(6, 3, 3, B.door("dark_oak", "north", "lower")); put(6, 4, 3, B.door("dark_oak", "north", "upper"));
for (const x of [5, 7]) fill([x, 3, 3], [x, 4, 3], BEAM, { axis: "y" });
fill([5, 5, 3], [7, 5, 3], BEAM, { axis: "x" });
put(5, 6, 3, B.stairs("stone_brick", "south")); set(6, 6, 3, "stone_bricks"); put(7, 6, 3, B.stairs("stone_brick", "south"));
// stoop lanterns on posts
for (const x of [4, 8]) { set(x, 3, 2, "dark_oak_fence", { waterlogged: "false" }); put(x, 4, 2, B.lantern(false)); }
// slit windows (tall, 1x3) + glow behind the front one
for (const [x, z, axis] of [[6, 3, "x"], [6, 9, "x"], [3, 6, "z"], [9, 6, "z"]]) for (const y of [7, 8]) pane(x, y, z, axis, "orange_stained_glass_pane");
for (const [x, z, axis] of [[4, 3, "x"], [8, 3, "x"], [3, 5, "z"], [9, 7, "z"], [4, 9, "x"], [8, 9, "x"]]) for (const y of [4, 5]) pane(x, y, z, axis);
set(6, 7, 4, "shroomlight");

// ---- 3. timber storeys -----------------------------------------------------------------------------------------------
function storey(x0, z0, x1, z1, yDeck) {
  fill([x0, yDeck, z0], [x1, yDeck, z1], DECK);
  fill([x0 + 1, yDeck + 1, z0 + 1], [x1 - 1, yDeck + 3, z1 - 1], "minecraft:air");
  for (let y = yDeck + 1; y <= yDeck + 3; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x > x0 && x < x1 && z > z0 && z < z1) continue;
    set(x, y, z, PLASTER);
  }
  for (let x = x0; x <= x1; x++) for (const z of [z0, z1]) set(x, yDeck, z, LOG, { axis: "x" });
  for (let z = z0; z <= z1; z++) for (const x of [x0, x1]) set(x, yDeck, z, LOG, { axis: "z" });
  // posts: corners + two intermediate studs per face leaving the middle bay for the round window
  const posts = [x0, x1], postsZ = [z0, z1];
  for (const x of posts) for (const z of [z0, z1]) fill([x, yDeck + 1, z], [x, yDeck + 3, z], LOG, { axis: "y" });
  for (const z of postsZ) for (const x of [x0, x1]) fill([x, yDeck + 1, z], [x, yDeck + 3, z], LOG, { axis: "y" });
}
storey(2, 2, 10, 10, 10);
storey(1, 1, 9, 9, 14);
// union deck + beams where floor 1 has no floor 2 above it (x10 strip, z10 row)
fill([2, 14, 2], [10, 14, 10], DECK);
for (let x = 1; x <= 10; x++) { set(x, 14, 1, LOG, { axis: "x" }); }
for (let x = 2; x <= 10; x++) set(x, 14, 10, LOG, { axis: "x" });
for (let z = 1; z <= 10; z++) set(10, 14, z, LOG, { axis: "z" });
for (let z = 1; z <= 9; z++) set(1, 14, z, LOG, { axis: "z" });
for (let x = 1; x <= 9; x++) set(x, 14, 9, LOG, { axis: "x" });

// round (octagon-ish) windows: 3x3, plus of glass panes, dark-oak frame corners + outer frame ring
function round(axis, fixed, centre, yDeck, glow = false) {
  const cy = yDeck + 2;
  const P = (d, e) => (axis === "x" ? [centre + d, cy + e, fixed] : [fixed, cy + e, centre + d]);
  for (const [d, e] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const [x, y, z] = P(d, e); set(x, y, z, "dark_oak_planks"); }
  for (const [d, e] of [[0, -1], [0, 0], [0, 1], [-1, 0], [1, 0]]) {
    const [x, y, z] = P(d, e);
    if (glow) set(x, y, z, d === 0 && e === 0 ? "shroomlight" : "orange_stained_glass"); else pane(x, y, z, axis);
  }
}
// floor 1 (y10): all four faces; floor 2 (y14): big glowing front, plain on the rest
round("x", 2, 6, 10); round("x", 10, 6, 10); round("z", 2, 6, 10); round("z", 10, 6, 10);
round("x", 1, 5, 14, true); round("x", 9, 5, 14); round("z", 1, 5, 14);
// floor 2 east door to the balcony + sidelights
air([9, 15, 5], [9, 16, 5]);
put(9, 15, 5, B.door("dark_oak", "east", "lower")); put(9, 16, 5, B.door("dark_oak", "east", "upper"));
for (const z of [3, 7]) pane(9, 16, z, "z");

// brackets (upside-down dark-oak stairs) under each jetty
for (let x = 3; x <= 9; x++) { put(x, 9, 2, B.stairs("dark_oak", "south", "top")); put(x, 9, 10, B.stairs("dark_oak", "north", "top")); }
for (let z = 3; z <= 9; z++) { put(2, 9, z, B.stairs("dark_oak", "east", "top")); put(10, 9, z, B.stairs("dark_oak", "west", "top")); }
for (let x = 2; x <= 9; x++) put(x, 13, 1, B.stairs("dark_oak", "south", "top"));
for (let z = 2; z <= 9; z++) put(1, 13, z, B.stairs("dark_oak", "east", "top"));
set(1, 12, 1, "dark_oak_fence", { waterlogged: "false" }); set(1, 13, 1, LOG, { axis: "y" });   // corner corbel post
// ladder (x8,z8 inside) through the floors
for (const y of [6, 10, 14]) air([8, y, 8], [8, y, 8]);
for (let y = 3; y <= 17; y++) set(8, y, 8, "ladder", { facing: "north", waterlogged: "false" });
// window box under the floor-1 front window (front wall z2)
for (const x of [5, 6, 7]) set(x, 11, 1, "dark_oak_slab", { type: "top", waterlogged: "false" });
set(5, 12, 1, "potted_pink_tulip"); set(6, 12, 1, "potted_red_tulip"); set(7, 12, 1, "potted_cornflower");
// banner on the shaft front (flanking the door)
for (const x of [4, 8]) put(x, 8, 2, B.banner("cyan", [["circle", "yellow"], ["border", "black"]], { facing: "north" }));
for (const x of [4, 8]) { air([x, 7, 2], [x, 7, 2]); }

// ---- 4. balcony east of floor 2: x10..12 z2..8 at y14 --------------------------------------------------------------------
fill([10, 14, 2], [12, 14, 8], "dark_oak_planks");
for (let z = 2; z <= 8; z++) set(12, 14, z, LOG, { axis: "z" });
for (let x = 10; x <= 12; x++) { set(x, 14, 2, LOG, { axis: "x" }); set(x, 14, 8, LOG, { axis: "x" }); }
const rail = new Set();
for (let x = 10; x <= 12; x++) { rail.add(`${x},2`); rail.add(`${x},8`); }
for (let z = 2; z <= 8; z++) rail.add(`12,${z}`);
for (const k of rail) { const [x, z] = k.split(",").map(Number); const q = (a, b) => (rail.has(`${a},${b}`) ? "true" : "false"); set(x, 15, z, "dark_oak_fence", { north: q(x, z - 1), south: q(x, z + 1), east: q(x + 1, z), west: q(x - 1, z), waterlogged: "false" }); }
for (const [x, z] of [[12, 2], [12, 8]]) set(x, 16, z, "dark_oak_fence", { waterlogged: "false" });
for (let z = 2; z <= 8; z++) put(11, 13, z, B.stairs("dark_oak", "west", "top"));
for (const z of [2, 8]) { put(12, 13, z, B.chain("y", false)); put(12, 12, z, B.lantern(true)); }
// telescope on a tripod: tube points out east, past the roof brim (brim reaches x10 at y17)
set(11, 15, 5, "dark_oak_fence", { waterlogged: "false" }); set(11, 16, 5, "dark_oak_fence", { waterlogged: "false" });
for (const x of [10, 11]) set(x, 17, 5, BEAM, { axis: "x" });
set(12, 17, 5, "copper_block");
set(11, 15, 4, "barrel", { facing: "up", open: "false" });
set(12, 16, 4, "potted_blue_orchid"); set(12, 16, 6, "potted_poppy");

g.save(OUT);
console.log("refused", g.refused?.length || 0, "saved", OUT);
