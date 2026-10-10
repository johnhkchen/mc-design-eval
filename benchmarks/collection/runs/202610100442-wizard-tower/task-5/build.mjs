// Crooked fantasy wizard tower. x east, y up, z south; front faces NORTH (-z). Grid 13 x 30 x 13.
// mound y0..2 (plateau x1..11) | stone shaft 7x7 x3..9 y3..11 | floor 1 (9x9 x2..10) y12..15 | floor 2 (9x9 x1..9, shifted NW) y16..19
// roof y20.. (pyramid over x1..9,z1..9) | balcony east x10..12 at y16.
import { Grid, B, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OUT = new URL("./stage.nbt", import.meta.url).pathname;
const g = new Grid([13, 30, 13]);
const Y = (y) => (y >= 11 ? y - 1 : y);   // everything from the old y11 up is compressed down by one: shaft top y10
const set = (x, y, z, b, s) => g.set(x, Y(y), z, b, s);
const put = (x, y, z, p) => g.set(x, Y(y), z, ...p);
const fill = (a, b, blk, s) => g.fill([a[0], Y(a[1]), a[2]], [b[0], Y(b[1]), b[2]], blk, s);
const air = (a, b) => g.fill([a[0], Y(a[1]), a[2]], [b[0], Y(b[1]), b[2]], "minecraft:air");
const hash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

const PLASTER = "calcite", LOG = "dark_oak_log", BEAM = "stripped_dark_oak_log", DECK = "spruce_planks";

// ---- 1. mound ---------------------------------------------------------------------------------------------------
const rockAt = (x, y, z) => { const r = hash(x, y, z); return r < 0.2 ? "mossy_cobblestone" : r < 0.42 ? "cobblestone" : r < 0.55 ? "andesite" : r < 0.62 ? "tuff" : "stone"; };
for (let x = 0; x <= 12; x++) for (let z = 0; z <= 12; z++) {
  const dmin = Math.min(x, 12 - x, z, 12 - z);
  let h = dmin >= 1 ? 3 : (hash(x, 9, z) < 0.5 ? 1 : 2);
  if (dmin === 1 && hash(x, 4, z) < 0.25) h = 2;
  if (z === 0 && x >= 5 && x <= 7) h = 1;
  for (let y = 0; y < h; y++) set(x, y, z, rockAt(x, y, z));
  const top = h - 1, r = hash(x, 77, z);
  if (!(z <= 2 && x >= 4 && x <= 8) && !(x >= 3 && x <= 9 && z >= 3 && z <= 9)) {
    if (r < 0.3) set(x, top, z, "moss_block");
    else if (r < 0.45) set(x, top, z, "grass_block");
    const q = hash(x, 31, z);
    if (r < 0.45 && top + 1 < 10) set(x, top + 1, z, q < 0.35 ? "short_grass" : q < 0.55 ? "fern" : q < 0.62 ? "poppy" : q < 0.7 ? "azure_bluet" : q < 0.76 ? "allium" : q < 0.8 ? "cornflower" : "air");
  }
}
// steps up to the door: z0 stair (y1), z1 plateau y2, stoop z2
fill([5, 2, 1], [7, 2, 2], "stone_bricks");
for (const x of [5, 6, 7]) { put(x, 1, 0, B.stairs("stone_brick", "south")); }
fill([5, 0, 0], [7, 0, 0], "stone_bricks");
for (const x of [4, 8]) { set(x, 2, 1, "mossy_stone_bricks"); set(x, 2, 2, "mossy_stone_bricks"); }

// ---- 2. stone shaft x3..9 z3..9 y3..11, floors at y2 (ground), y7 (mid) ---------------------------------------------
const stoneAt = (x, y, z) => { const r = hash(x, y, z), moss = y < 8 ? 0.22 : 0.1; return r < moss ? "mossy_stone_bricks" : r < moss + 0.14 ? "cracked_stone_bricks" : r < moss + 0.3 ? "cobblestone" : r < moss + 0.36 ? "andesite" : "stone_bricks"; };
for (let y = 3; y <= 11; y++) for (let x = 3; x <= 9; x++) for (let z = 3; z <= 9; z++) {
  if (x > 3 && x < 9 && z > 3 && z < 9) continue;
  if ((x === 3 || x === 9) && (z === 3 || z === 9)) { set(x, y, z, stoneAt(x, y, z)); continue; }
  set(x, y, z, stoneAt(x, y, z));
}
fill([4, 2, 4], [8, 2, 8], DECK);                        // ground floor
fill([4, 7, 4], [8, 7, 8], DECK);                        // mid floor
// corner pilasters: chiselled stone quoin column at the 4 corners
for (const [x, z] of [[3, 3], [9, 3], [3, 9], [9, 9]]) for (let y = 3; y <= 11; y++) set(x, y, z, y % 3 === 0 ? "chiseled_stone_bricks" : "stone_bricks");
// plinth ring of stairs at y3 around the shaft (x2..10), not on the stoop
const ring = (x0, z0, x1, z1) => { const c = []; for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x === x0 || x === x1 || z === z0 || z === z1) c.push([x, z]); return c; };
for (const [x, z] of ring(2, 2, 10, 10)) {
  const corner = (x === 2 || x === 10) && (z === 2 || z === 10);
  if (z === 2 && x >= 4 && x <= 8) continue;
  if (corner) { set(x, 3, z, "mossy_cobblestone"); continue; }
  const f = z === 2 ? "south" : z === 10 ? "north" : x === 2 ? "east" : "west";
  put(x, 3, z, B.stairs(hash(x, 3, z) < 0.3 ? "mossy_stone_brick" : "stone_brick", f));
}
// setback course (a flared band) at y6: stairs hugging the wall under a thin batter
for (const [x, z] of ring(2, 2, 10, 10)) {
  const corner = (x === 2 || x === 10) && (z === 2 || z === 10);
  if (corner || (z === 2 && x >= 4 && x <= 8)) continue;
  if (hash(x, 6, z) < 0.35) continue;
  const f = z === 2 ? "south" : z === 10 ? "north" : x === 2 ? "east" : "west";
  put(x, 4, z, B.stairs("cobblestone", f));
}
// door: dark oak, arched
air([6, 3, 3], [6, 5, 3]);
put(6, 3, 3, B.door("dark_oak", "north", "lower"));
put(6, 4, 3, B.door("dark_oak", "north", "upper"));
for (const x of [5, 7]) fill([x, 3, 3], [x, 5, 3], BEAM, { axis: "y" });   // timber jambs
fill([5, 5, 3], [7, 5, 3], BEAM, { axis: "x" });                           // header
for (const x of [5, 7]) put(x, 6, 3, B.stairs("dark_oak", "south", "top")), put(x, 6, 3, B.stairs("stone_brick", "south"));
set(6, 6, 3, "stone_bricks");
for (const x of [4, 8]) { put(x, 3, 2, B.lantern(false)); }                 // lanterns on the stoop posts
// slit windows in the shaft
const pane = (x, y, z, axis, blk = "glass_pane") => set(x, y, z, blk, axis === "x" ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
for (const [x, z, axis] of [[6, 3, "x"], [6, 9, "x"], [3, 6, "z"], [9, 6, "z"]]) for (const y of [9, 10]) pane(x, y, z, axis, "orange_stained_glass_pane");
for (const [x, z, axis] of [[3, 5, "z"], [9, 7, "z"], [4, 9, "x"], [8, 9, "x"]]) for (const y of [4, 5]) pane(x, y, z, axis);
// interior glow behind the front slit
set(6, 9, 4, "shroomlight");

// ---- 3. floor 1 (x2..10 z2..10) y12 deck, y13..15 walls ----------------------------------------------------------------
function storey(x0, z0, x1, z1, yDeck, winGlow) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  fill([x0, yDeck, z0], [x1, yDeck, z1], DECK);
  fill([x0 + 1, yDeck + 1, z0 + 1], [x1 - 1, yDeck + 3, z1 - 1], "minecraft:air");
  for (let y = yDeck + 1; y <= yDeck + 3; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x > x0 && x < x1 && z > z0 && z < z1) continue;
    set(x, y, z, PLASTER);
  }
  // beams: ring of logs on the deck edge (axis along the edge)
  for (let x = x0; x <= x1; x++) for (const z of [z0, z1]) set(x, yDeck, z, LOG, { axis: "x" });
  for (let z = z0; z <= z1; z++) for (const x of [x0, x1]) set(x, yDeck, z, LOG, { axis: "z" });
  // top plate under the next level is the next deck; corner posts + studs
  const studX = [x0, x1], studZ = [z0, z1];
  for (const x of studX) for (const z of [z0, z1]) fill([x, yDeck + 1, z], [x, yDeck + 3, z], LOG, { axis: "y" });
  for (const z of studZ) for (const x of [x0, x1]) fill([x, yDeck + 1, z], [x, yDeck + 3, z], LOG, { axis: "y" });
  const yb = yDeck + 3;
  for (const x of [x0 + 1, x1 - 1]) for (const z of [z0, z1]) put(x, yb, z, B.stairs("dark_oak", x === x0 + 1 ? "west" : "east", "top"));
  for (const z of [z0 + 1, z1 - 1]) for (const x of [x0, x1]) put(x, yb, z, B.stairs("dark_oak", z === z0 + 1 ? "north" : "south", "top"));
  return { cx, cz };
}
const f1 = storey(2, 2, 10, 10, 12);
const f2 = storey(1, 1, 9, 9, 16);
// ceiling beams of floor 1 that lie outside floor 2 (x10 strip): already deck at y16? fill the union deck
fill([2, 16, 2], [10, 16, 10], DECK);
for (let x = 2; x <= 10; x++) for (const z of [2, 10]) if (!(x >= 1 && x <= 9 && z >= 1 && z <= 9)) set(x, 16, z, LOG, { axis: "x" });
for (let z = 2; z <= 10; z++) for (const x of [10]) set(x, 16, z, LOG, { axis: "z" });
for (let z = 1; z <= 9; z++) set(1, 16, z, LOG, { axis: "z" });
for (let x = 1; x <= 9; x++) set(x, 16, 1, LOG, { axis: "x" });
for (let x = 1; x <= 9; x++) set(x, 16, 9, LOG, { axis: "x" });
// re-open the floor-2 interior above the (floor-1 ceiling) deck: interior x2..8 z2..8 y17..19 already air

// round windows: plus-shaped 3x3. axis "x": wall runs along x at z=fixed; outDir is the outward facing.
function plus(axis, fixed, centre, yDeck, { glow = false, out = 1 } = {}) {
  const cy = yDeck + 2;
  const P = (d, e) => (axis === "x" ? [centre + d, cy + e, fixed] : [fixed, cy + e, centre + d]);
  for (const [d, e] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const [x, y, z] = P(d, e); set(x, y, z, "dark_oak_planks"); }
  for (const [d, e] of [[0, -1], [0, 0], [0, 1], [-1, 0], [1, 0]]) { const [x, y, z] = P(d, e); if (glow) set(x, y, z, d === 0 && e === 0 ? "shroomlight" : "orange_stained_glass"); else pane(x, y, z, axis, "glass_pane"); }
}
// floor 1: window centred on each face; the lit interior glow where glow
plus("x", 2, 6, 12, { out: 1 });                 // north (front), wall z2: inward is +z
plus("x", 10, 6, 12, { out: -1 });               // south
plus("z", 2, 6, 12, { out: 1 });                 // west
plus("z", 10, 6, 12, { out: -1 });               // east
// floor 2: big glowing front round window; plain ones on the other faces
plus("x", 1, 5, 16, { glow: true, out: 1 });     // front
plus("x", 9, 5, 16, { out: -1 });                // south
plus("z", 1, 5, 16, { out: 1 });                 // west
// east wall of floor 2 gets the balcony door (z5): lower window pair either side
set(9, 17, 5, "air"); set(9, 18, 5, "air");
put(9, 17, 5, B.door("dark_oak", "east", "lower")); put(9, 18, 5, B.door("dark_oak", "east", "upper"));
for (const z of [3, 7]) { for (const y of [18]) pane(9, y, z, "z"); }
// the plus on the front wall needs the interior cell behind it to stay air except the glow block
// brackets (upside-down dark oak stairs) under the jetties
for (let x = 3; x <= 9; x++) put(x, 11, 2, B.stairs("dark_oak", "south", "top"));          // under floor 1 north overhang (shaft z3)
for (let x = 3; x <= 9; x++) put(x, 11, 10, B.stairs("dark_oak", "north", "top"));
for (let z = 3; z <= 9; z++) { put(2, 11, z, B.stairs("dark_oak", "east", "top")); put(10, 11, z, B.stairs("dark_oak", "west", "top")); }
for (let x = 2; x <= 9; x++) put(x, 15, 1, B.stairs("dark_oak", "south", "top"));
for (let z = 2; z <= 9; z++) put(1, 15, z, B.stairs("dark_oak", "east", "top"));
// diagonal corbel at the floor-2 NW corner
set(1, 14, 1, "dark_oak_fence", {}); set(1, 15, 1, LOG, { axis: "y" }); set(1, 13, 1, "air");

for (const [x, z] of [[2, 2], [10, 2], [2, 10], [10, 10]]) { put(x, 11, z, B.chain("y", false)); put(x, 9, z, B.lantern(true)); set(x, 10, z, "air"); put(x, 11, z, B.chain("y", false)); }
// window box under the front floor-1 window
for (const x of [5, 6, 7]) set(x, 13, 1, "dark_oak_slab", { type: "top", waterlogged: "false" });
set(5, 14, 1, "potted_pink_tulip"); set(7, 14, 1, "potted_cornflower"); set(6, 14, 1, "potted_red_tulip");
// banners on the shaft front
for (const x of [4, 8]) put(x, 9, 2, B.banner("cyan", [["circle", "yellow"], ["border", "black"]], { facing: "north" }));

// ---- 4. ladder (x8, z8 against the south wall) + floor holes + interior post ---------------------------------------------
for (const y of [7, 12, 16]) air([8, y, 8], [8, y, 8]);
for (let y = 3; y <= 19; y++) set(8, y, 8, "ladder", { facing: "north", waterlogged: "false" });
fill([8, 13, 9], [8, 15, 9], LOG, { axis: "y" });

// ---- 5. balcony east x10..12 at y16 ---------------------------------------------------------------------------------------
fill([10, 16, 3], [12, 16, 7], "dark_oak_planks");
for (let z = 3; z <= 7; z++) set(12, 16, z, LOG, { axis: "z" });
for (let x = 10; x <= 12; x++) { set(x, 16, 3, LOG, { axis: "x" }); set(x, 16, 7, LOG, { axis: "x" }); }
const fenceAt = (x, y, z) => set(x, y, z, "dark_oak_fence", { north: String(z > 3 && !(x === 10) && false), south: "false", east: "false", west: "false", waterlogged: "false" });
const rail = new Set();
for (let x = 10; x <= 12; x++) { rail.add(`${x},3`); rail.add(`${x},7`); }
for (let z = 3; z <= 7; z++) rail.add(`12,${z}`);
for (const k of rail) { const [x, z] = k.split(",").map(Number); const q = (a, b) => (rail.has(`${a},${b}`) ? "true" : "false"); set(x, 17, z, "dark_oak_fence", { north: q(x, z - 1), south: q(x, z + 1), east: q(x + 1, z), west: q(x - 1, z), waterlogged: "false" }); }
for (const [x, z] of [[12, 3], [12, 7]]) set(x, 18, z, "dark_oak_fence", { waterlogged: "false" });
// stair brackets under the balcony (back against the floor-1 east wall at x10... wall is x10, so brackets at x11)
for (const z of [3, 5, 7]) { put(11, 15, z, B.stairs("dark_oak", "west", "top")); }
for (const z of [3, 7]) { put(12, 15, z, B.chain("y", false)); put(12, 14, z, B.lantern(true)); }
// telescope on a tripod: tube along x at y18, z5
set(11, 17, 5, "dark_oak_fence", { waterlogged: "false" });
for (const x of [10, 11, 12]) set(x, 18, 5, "lightning_rod", { facing: "east", powered: "false", waterlogged: "false" });
set(11, 19, 5, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
set(10, 17, 6, "barrel", { facing: "up", open: "false" });
// flower pots on the rail
set(12, 18, 4, "dark_oak_fence", { waterlogged: "false" });
set(12, 19, 4, "potted_blue_orchid"); set(12, 18, 6, "potted_poppy");

// ---- 6. roof: pyramid over floor 2, leaning NW by construction ------------------------------------------------------------
const rr = roof(g, [1, 1, 9, 9], "pyramid", {
  y: 19, material: "oxidized_cut_copper", trim: "dark_oak", pitch: "steep", overhang: 1, eave: "flared", ridge: "none",
  contrast: false, grow: true,
  chimneys: [{ at: [2, 7], size: 1, material: "stone_bricks", rise: -3 }],
});
console.log("roof", JSON.stringify(rr?.bounds || rr?.notes || rr?.shift || ""));

// ---- 7. absolute-y finishing (no Y shift): glowing roof dormers, finial, eave lanterns, ivy, leaf clumps -------------------
const aset = (x, y, z, b, st) => g.set(x, y, z, b, st);
const aput = (x, y, z, p) => g.set(x, y, z, ...p);
const apane = (x, y, z, axis, blk = "glass_pane") => g.set(x, y, z, blk, axis === "x" ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
// front dormer on the cone (x4..6 at z3): glowing orange glass, dark-oak cheeks, stair hood, shroomlight behind
for (const y of [22, 23]) { aset(5, y, 3, "orange_stained_glass"); for (const x of [4, 6]) aset(x, y, 3, "dark_oak_planks"); }
aset(5, 22, 4, "shroomlight");
for (const x of [4, 5, 6]) aput(x, 24, 3, B.stairs("dark_oak", "south"));
// west dormer (x3, z4..6): plain glass
for (const y of [22, 23]) { apane(3, y, 5, "z"); for (const z of [4, 6]) aset(3, y, z, "dark_oak_planks"); }
for (const z of [4, 5, 6]) aput(3, 24, z, B.stairs("dark_oak", "east"));
// finial on the apex
aset(5, 28, 5, "dark_oak_fence", { waterlogged: "false" });
aput(5, 29, 5, B.lantern(false));
// lanterns under the eave rim
for (const [x, z] of [[2, 0], [8, 0], [0, 2], [0, 8], [10, 8], [8, 10]]) if (g.isAir(x, 19, z)) aput(x, 19, z, B.lantern(true));

// ivy: strands creeping up the stone and timber, denser low, continuing downward strands
const WALLB = /stone_bricks|cobblestone|andesite|calcite|dark_oak_log|^minecraft:stone$|tuff|dark_oak_planks/;
const NB = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
let vines = 0;
for (let y = 27; y >= 3; y--) for (let x = 0; x <= 12; x++) for (let z = 0; z <= 12; z++) {
  if (!g.isAir(x, y, z)) continue;
  if (z === 2 && x >= 4 && x <= 8 && y <= 6) continue;                    // keep the door clear
  const st = { north: "false", south: "false", east: "false", west: "false", up: "false" };
  let any = false;
  for (const [d, dx, dz] of NB) { const nx = x + dx, nz = z + dz; if (nx < 0 || nz < 0 || nx > 12 || nz > 12) continue; const nb = g.blockAt(nx, y, nz); if (WALLB.test(nb)) { st[d] = "true"; any = true; } }
  if (!any) continue;
  const above = g.get(x, y + 1, z);
  const cont = above && /vine/.test(above.block);
  const base = y <= 10 ? 0.3 : y <= 18 ? 0.1 : 0.02;
  const patch = hash(x >> 1, 5, z >> 1) < 0.55 ? 1.5 : 0.25;   // clustered
  if (hash(x, y, z + 400) < (cont ? 0.72 : base * patch)) { g.set(x, y, z, "vine", st); vines++; }
}
console.log("vines", vines);
// leaf clumps at the foot
for (let i = 0; i < 16; i++) { const x = Math.floor(hash(i, 1, 2) * 13), z = Math.floor(hash(i, 2, 3) * 13); const y = 3; if (g.isAir(x, y, z) && (x <= 2 || x >= 10 || z >= 10) && !(x >= 4 && x <= 8 && z <= 3)) { const solidBelow = !g.isAir(x, y - 1, z); if (solidBelow) { g.set(x, y, z, "oak_leaves", { persistent: "true", distance: "7", waterlogged: "false" }); if (hash(i, 4, 5) < 0.5 && g.isAir(x, y + 1, z)) g.set(x, y + 1, z, "oak_leaves", { persistent: "true", distance: "7", waterlogged: "false" }); } } }

g.save(OUT);
console.log("refused", g.refused?.length || 0, "saved", OUT);
