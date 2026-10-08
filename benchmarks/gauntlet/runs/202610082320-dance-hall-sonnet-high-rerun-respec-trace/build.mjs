// Art Deco Dance Hall — generator for round-1.nbt (ROUND env: 1 or 2 -> round-N.nbt)
// x east (street axis), y up, z south; front faces NORTH (z=0 side). 27 x 31 x 27 grid.
// Plane plan: marquee z0-2 | fins/pilasters z2 | tower face z3 | wing face z4 (1 back) | doors z4 | body to z26.
import { Grid, B, arch } from "../../../../../minecraft-design/tools/src/build.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROUND = +(process.env.ROUND || 1);
const R2 = ROUND >= 2;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const g = new Grid([27, 31, 27]);
const CX = 13, ZF = 3, ZB = 26;

// ---- palette (spec material map is binding)
const SAND = "cut_sandstone", CARVED = "chiseled_sandstone", QZ = "smooth_quartz";
const BLUE = "blue_concrete", BLACK = "black_concrete", GOLD = "gold_block";
const GLASS = ["blue_stained_glass", "orange_stained_glass", "yellow_stained_glass", "light_gray_stained_glass"];

const set = (x, y, z, b, s) => g.set(x, y, z, ...(Array.isArray(b) ? b : [b, s]));
const fill = (a, b, blk) => g.fill(a, b, blk);
const sym = (x, y, z, b) => { set(x, y, z, b); set(2 * CX - x, y, z, b); };
const symFill = (x0, y0, z0, x1, y1, z1, b) => { fill([x0, y0, z0], [x1, y1, z1], b); fill([2 * CX - x1, y0, z0], [2 * CX - x0, y1, z1], b); };
const quilt = (x, y) => GLASS[(x * 3 + y * 5) % 4];

// ---- 1. massing: the front profile extruded the full depth (wings step up toward the tower)
// T(x) = top solid course of the main mass at column x (symmetric)
const TOP = [15, 15, 16, 16, 16, 17, 18, 19, 20, 21, 21, 21, 21, 21];
const T = (x) => TOP[Math.min(x, 2 * CX - x)];
// front plane per column: tower/fin cols at z3, wings 1 back at z4, pilaster cols z3
const zFront = (x) => { const m = Math.min(x, 2 * CX - x); return m <= 1 || m >= 8 ? ZF : ZF + 1; };

for (let x = 1; x <= 25; x++) {
  fill([x, 0, zFront(x)], [x, T(x), ZB], QZ);
  fill([x, T(x), zFront(x)], [x, T(x), ZB], SAND);            // tread course
}
if (R2) for (let x = 11; x <= 15; x++) set(x, 21, 3, QZ);
// hollow interior (walls 2 thick at sides, 3 at the front, 2 at the back, roof 2 thick)
for (let x = 3; x <= 23; x++) fill([x, 1, 6], [x, T(x) - 2, 24], "air");

// ---- 2. plinth + wings (mirrored)
for (const m of [0, 1]) {
  const X = (x) => (m ? 2 * CX - x : x);
  const sp = (x, y, z, b) => set(X(x), y, z, b);
  const sf = (x0, y0, z0, x1, y1, z1, b) => { const a = X(x0), c = X(x1); fill([Math.min(a, c), y0, z0], [Math.max(a, c), y1, z1], b); };
  // outer carved pilaster x0-1 (projects 1)
  sf(0, 0, 3, 1, 14, 3, SAND);
  sf(0, 3, 3, 0, 12, 3, CARVED);
  sf(1, 15, 3, 1, 15, 4, SAND);
  sf(0, 15, 3, 0, 15, 3, "cut_sandstone_slab");
  // plinth
  sf(2, 0, 4, 7, 1, 4, BLACK);
  sf(3, 1, 4, 4, 1, 4, BLUE);
  // base window x4-5 y2-3 (dark, recessed) + gold sill
  sf(4, 2, 4, 5, 3, 4, "air");
  sf(4, 2, 5, 5, 3, 5, BLACK);
  sp(5, 1, 4, GOLD);
  sf(3, 2, 4, 3, 4, 4, SAND); sf(6, 2, 4, 6, 4, 4, SAND);
  sf(4, 4, 4, 5, 4, 4, SAND);
  // lancet window x4-5, y5-13: glass quilt in front of quartz backing, sandstone surround
  sf(3, 5, 4, 3, 14, 4, SAND); sf(6, 5, 4, 6, 15, 4, SAND);
  for (let x = 4; x <= 5; x++) for (let y = 5; y <= 13; y++) { sp(x, y, 4, quilt(x, y)); sp(x, y, 5, QZ); }
  sf(4, 14, 4, 5, 15, 4, GOLD);                                  // gold medallion
  sf(3, 14, 4, 3, 14, 4, SAND);
  // end caps and lintel band
  sf(2, 15, 4, 3, 15, 4, BLACK); sf(2, 16, 4, 2, 16, 4, BLACK);
  sf(3, 16, 3, 3, 16, 4, SAND);
  sf(4, 16, 3, 6, 16, 3, BLUE);                                  // dark blue lintel band, projects 1
  sf(4, 16, 4, 6, 16, 4, BLUE);
  // tread course of the crest steps
  for (let x = 5; x <= 7; x++) sp(x, T(x < 0 ? 0 : x), 4, SAND);
  // fin x8-9 (blue, proud by 1), pilaster x10 (tan) ; carved base pilaster x8-9 y0-8
  sf(8, 0, 3, 8, 8, 3, SAND);
  sf(9, 0, 2, 9, 8, 2, CARVED);
  sf(9, 0, 3, 9, 8, 3, SAND);
  sf(8, 9, 2, 8, 21, 3, BLUE);
  sf(9, 9, 2, 9, 22, 3, BLUE);
  sf(10, 0, 2, 10, 21, 2, SAND);
  sf(10, 22, 2, 10, 22, 3, SAND);
  sf(10, 9, 2, 10, 9, 2, CARVED);
  // chiseled zig-zag capital
  sf(10, 21, 2, 10, 21, 2, CARVED);
}

// ---- 3. tower face (x11-15, z3) : doors, quilt window, sunburst
// entrance recess: carve z3 x11-15 y0-3, doors on z4, pier x13
fill([11, 0, 3], [15, 3, 3], "air");
fill([11, 0, 5], [15, 3, 5], "air");
fill([11, 0, 4], [15, 3, 4], "air");
for (const [xl, xr] of [[11, 12], [14, 15]]) {
  set(xl, 0, 4, B.door("dark_oak", "north", "lower", "left"));
  set(xl, 1, 4, B.door("dark_oak", "north", "upper", "left"));
  set(xr, 0, 4, B.door("dark_oak", "north", "lower", "right"));
  set(xr, 1, 4, B.door("dark_oak", "north", "upper", "right"));
  for (const x of [xl, xr]) { fill([x, 2, 4], [x, 3, 4], "dark_oak_planks"); }
}
fill([13, 0, 3], [13, 3, 4], SAND);
fill([11, 0, 3], [15, 0, 3], "air");
fill([11, 0, 3], [15, 0, 3], BLACK);   // sill strip in front of the doors
fill([11, 0, 4], [11, 0, 4], "air"); set(11, 0, 4, B.door("dark_oak", "north", "lower", "left"));
// transom/lintel above doors
fill([11, 4, 3], [15, 4, 3], SAND);
// window quilt x12-14 y10-16 with a 1-wide sandstone cross
for (let x = 12; x <= 14; x++) for (let y = 10; y <= 16; y++) { set(x, y, 3, quilt(x, y)); set(x, y, 4, QZ); }
fill([13, 10, 3], [13, 16, 3], SAND);
fill([12, 13, 3], [14, 13, 3], SAND);
fill([12, 17, 3], [14, 17, 3], SAND);
fill([12, 9, 3], [14, 9, 3], SAND);
// sunburst
fill([12, 18, 3], [14, 18, 3], SAND);
fill([12, 19, 3], [14, 20, 3], GOLD);
set(13, 21, 3, GOLD);
fill([11, 17, 3], [11, 21, 3], QZ);

// ---- 4. canopy + marquee (projects 3: z0-2)
fill([8, 4, 0], [18, 4, 2], "dark_oak_planks");
fill([8, 5, 0], [18, 7, 2], "orange_terracotta");          // body (border colour)
fill([10, 5, 0], [12, 6, 0], "sea_lantern");
fill([14, 5, 0], [16, 6, 0], "sea_lantern");
for (let x = 8; x <= 18; x++) {
  set(x, 7, 0, x % 2 ? "yellow_glazed_terracotta" : "orange_terracotta");
  if (x < 10 || x > 16 || x === 13) continue;
}
for (const x of [8, 9, 17, 18]) for (let y = 5; y <= 6; y++) set(x, y, 0, (x + y) % 2 ? "yellow_glazed_terracotta" : "orange_terracotta");
fill([13, 5, 0], [13, 7, 0], "cyan_concrete"); set(12, 6, 0, "cyan_concrete"); set(14, 6, 0, "cyan_concrete");
set(13, 6, 0, "sea_lantern");
for (let x = 10; x <= 16; x++) set(x, 5, 0, x === 13 ? "cyan_concrete" : "orange_terracotta");
// sign panels
for (const x of [10, 11, 12, 14, 15, 16]) set(x, 6, 0, "sea_lantern");
for (const x of [10, 11, 12, 14, 15, 16]) set(x, 5, 0, "sea_lantern");
// gold crown, stepping back up toward the facade
fill([9, 8, 0], [17, 8, 2], GOLD);
fill([10, 9, 1], [16, 9, 2], GOLD);
fill([12, 9, 0], [14, 9, 0], GOLD);
fill([12, 9, 1], [14, 9, 1], GOLD);

// ---- 5. spire (open lancet arch, 3 deep) on the tower shoulder
let sp = { springing: null, crown: null };
if (!R2) {
  sp = arch(g, { at: [11, 22, 3], width: 5, height: 8, depth: 3, axis: "x", profile: "pointed", block: SAND, carve: false });
  for (let y = 22; y <= 26; y++) set(13, y, 5, y === 26 ? "yellow_stained_glass" : quilt(13, y));
  fill([11, 22, 5], [11, 26, 5], SAND); fill([15, 22, 5], [15, 26, 5], SAND);
  fill([12, 22, 5], [12, 26, 5], QZ); fill([14, 22, 5], [14, 26, 5], QZ);
} else {
  // stepped lancet traced from the elevation: legs x11/x15 y22-25, lintel y26, finial x12-14 y27-28, tip x13 y29; 3 deep
  fill([11, 22, 3], [11, 25, 5], SAND); fill([15, 22, 3], [15, 25, 5], SAND);
  fill([12, 22, 5], [12, 25, 5], QZ); fill([14, 22, 5], [14, 25, 5], QZ);        // back plane behind the open bay
  fill([13, 22, 5], [13, 25, 5], "yellow_stained_glass");                        // 1-wide glass slit, back plane
  for (let y = 22; y <= 25; y++) if (y % 2) set(13, y, 5, "orange_stained_glass");
  fill([11, 26, 3], [15, 26, 5], SAND); fill([13, 26, 3], [13, 26, 5], "yellow_stained_glass");
  fill([12, 27, 3], [14, 28, 5], SAND); fill([13, 27, 3], [13, 27, 3], "yellow_stained_glass");
  fill([13, 29, 3], [13, 29, 5], SAND);
  // shoulder at y22 under the legs
  fill([10, 22, 3], [16, 22, 5], SAND); fill([12, 22, 3], [14, 22, 4], "air");
}

// ---- 6. side walls: quartz with sandstone pilasters every 4 and 1x2 slit windows
for (const side of [0, 1]) {
  const wx = side ? 25 : 1, px = side ? 26 : 0, bx = side ? 24 : 2;
  for (let z = R2 ? 6 : 7; z <= 23; z += 4) {
    const h = 13 - Math.floor((z - 6) / 4);
    fill([px, 0, z], [px, h, R2 ? z + 1 : z], SAND);
    fill([px, h, z], [px, h, R2 ? z + 1 : z], "cut_sandstone_slab");
    if (R2) fill([px, 3, z], [px, 8, z + 1], CARVED);
  }
  for (let z = R2 ? 8 : 9; z <= 21; z += 4) { set(wx, 5, z, "blue_stained_glass"); set(wx, 6, z, "light_gray_stained_glass"); set(bx, 5, z, QZ); set(bx, 6, z, QZ); }
  // black plinth
  fill([wx, 0, 4], [wx, 1, ZB], BLACK);
}
fill([1, 0, 26], [25, 1, 26], BLACK);
if (R2) {
  // stepped parapet lip on the terraces: slab lip along the rear edge and the wing outer edges
  for (let x = 1; x <= 25; x++) fill([x, T(x) + 1, ZB], [x, T(x) + 1, ZB], "cut_sandstone_slab");
  for (const x of [1, 25]) fill([x, T(x) + 1, zFront(x)], [x, T(x) + 1, ZB], "cut_sandstone_slab");
  for (const x of [9, 17]) fill([x, T(x) + 1, 5], [x, T(x) + 1, ZB], "cut_sandstone_slab");
}

const file = path.join(HERE, `round-${ROUND}.nbt`);
g.save(file);
console.log(JSON.stringify({ saved: file, refused: g.refused?.length ?? 0, arch: { springing: sp.springing, crown: sp.crown } }));
