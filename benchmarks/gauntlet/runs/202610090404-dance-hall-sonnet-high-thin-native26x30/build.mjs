// Art Deco Dance Hall — 27 x 30 x 24 (front = NORTH, -z). Front face traced cell-for-cell from trace.txt.
// `node build.mjs 1` -> round-1.nbt ; `node build.mjs 2` -> round-2.nbt (round 2 = fixes layered on round 1).
import fs from "node:fs";
import { Grid, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ROUND = Number(process.argv[2] || 1);
const OUT = new URL(`./round-${ROUND}.nbt`, import.meta.url).pathname;
const W = 27, H = 30, D = 24, Z0 = 3;            // Z0 = the wall plane; fins/marquee/canopy project to z=0
const g = new Grid([W, H, D]);

// ---- helpers ----------------------------------------------------------------------------------------------
const flip = (f) => ({ east: "west", west: "east" }[f] ?? f);
const mir = (b) => {
  if (!Array.isArray(b)) return b;
  const s = { ...(b[1] ?? {}) };
  if (s.facing) s.facing = flip(s.facing);
  if (s.hinge) s.hinge = s.hinge === "left" ? "right" : "left";
  if (s.shape) s.shape = s.shape.replace(/left|right/, (m) => (m === "left" ? "right" : "left"));
  return [b[0], s];
};
const set = (x, y, z, b) => { const [n, s] = Array.isArray(b) ? b : [b]; g.set(x, y, z, n, s); };
const setM = (x, y, z, b) => { set(x, y, z, b); if (W - 1 - x !== x) set(W - 1 - x, y, z, mir(b)); };
const box = (x0, y0, z0, x1, y1, z1, b, m = false) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) (m ? setM : set)(x, y, z, b);
};
const air = (x0, y0, z0, x1, y1, z1, m = true) => box(x0, y0, z0, x1, y1, z1, "air", m);

// ---- palette (spec material map is binding) ---------------------------------------------------------------
const SS = "smooth_sandstone", CS = "cut_sandstone", SA = "sandstone";
const BLK = "black_concrete", WHT = "white_concrete", NAVY = "blue_concrete", GOLD = "gold_block", GRY = "gray_concrete";
const AMB = "yellow_stained_glass", BRN = "brown_stained_glass";

// ---- silhouette: top y of each column (x 0..13, mirrored), read from the trace ------------------------------
const PROF = [15, 16, 17, 17, 18, 22, 23, 24, 25, 26, 27, 28, 28, 29];
const top = (x) => PROF[x <= 13 ? x : 26 - x];

// ---- trace classifier (crown, y17..29) ----------------------------------------------------------------------
const rows = fs.readFileSync(new URL("./trace.txt", import.meta.url), "utf8").split("\n").filter((l) => /^y\d+/.test(l));
const TR = {};   // TR[y][x] = hex
for (const l of rows) { const [y, ...c] = l.split(" "); TR[Number(y.slice(1))] = c; }
function classify(hex) {
  const r = parseInt(hex.slice(0, 2), 16), gg = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
  const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), s = mx ? (mx - mn) / mx : 0;
  if (mx < 0x2a) return "K";
  if (b > r + 22 && b > gg + 22 && r < 0x70) return "N";
  if (r > 0xc0 && gg > 0x90 && b < 0x70 && s > 0.45) return "G";
  if (mn > 0xb8 && s < 0.14) return "W";
  if (mx < 0x62 && s < 0.2) return "k";
  if (mx < 0x62) return "d";
  if (s < 0.14) return "g";
  if (s < 0.45 && r > 0x90) return "T";
  return "b";
}
const cls = (x, y) => classify(TR[y][x]);
const CROWN = { N: NAVY, G: GOLD, b: GOLD, d: NAVY, k: GRY, g: GRY, T: CS, W: WHT, K: BLK };

// ---- 1. massing -------------------------------------------------------------------------------------------
box(1, 0, Z0, 25, 14, D - 1, SS);                                        // hall block
air(3, 1, Z0 + 2, 23, 14, D - 2, false);                                 // hollow interior (side walls 2 thick, front 2 thick)
box(1, 15, Z0, 25, 15, D - 1, SS);                                       // roof deck
box(1, 0, Z0, 25, 0, D - 1, "smooth_stone");                             // floor
// stepped terraces behind the front profile: each 2 layers back drops the roofline 2
for (let x = 1; x <= 25; x++) for (let z = Z0 + 1; z <= Z0 + 10; z++) {
  const t = top(x) - 2 * Math.floor((z - Z0 - 1) / 2);
  for (let y = 16; y <= t; y++) set(x, y, z, x <= 5 || x >= 21 ? SS : WHT);
}
// roof rim (1-block parapet steps) around the open deck
for (let z = Z0 + 11; z <= D - 1; z++) for (const x of [1, 25]) set(x, 16, z, CS);
for (let x = 1; x <= 25; x++) set(x, 16, D - 1, CS);
for (let x = 7; x <= 19; x++) set(x, 17, D - 1, CS);
// rooftop plant (grey boxes) behind the crown
for (const [x, z] of [[17, 14], [18, 14], [18, 15], [9, 16], [8, 16]]) set(x, 16, z, "stone");
set(18, 17, 14, GRY);

// ---- 2. base course + wings (x 0..5, mirrored) -------------------------------------------------------------
box(1, 0, Z0, 5, 0, Z0, BLK, true);                                      // black base course
setM(0, 15, Z0, B.stairs("dark_oak", "east"));                            // ledge stub
box(1, 1, Z0, 1, 16, Z0, CS, true);                                      // x1 sand pier
box(2, 0, Z0 - 1, 2, 16, Z0, BLK, true);                                 // x2 black fin, +1
setM(2, 17, Z0, CS);
box(3, 1, Z0, 3, 17, Z0, CS, true);                                      // x3 sand pier
// side door bay x4..5
air(4, 0, Z0, 5, 2, Z0);                                                  // door recess (-1)
for (const x of [4, 5]) { setM(x, 0, Z0 + 1, B.door("dark_oak", "north", "lower", x === 4 ? "left" : "right")); setM(x, 1, Z0 + 1, B.door("dark_oak", "north", "upper", x === 4 ? "left" : "right")); setM(x, 2, Z0 + 1, "dark_oak_planks"); }
box(4, 3, Z0, 5, 3, Z0, NAVY, true);                                     // lapis lintel
box(4, 4, Z0, 5, 4, Z0, CS, true);
box(4, 5, Z0, 5, 5, Z0, NAVY, true);                                     // blue panel (trace y5)
box(4, 6, Z0, 5, 6, Z0, CS, true);
// tall side window y7..15, recessed -1: amber column at x4, brown at x5
air(4, 7, Z0, 5, 15, Z0);
for (let y = 7; y <= 15; y++) { setM(4, y, Z0 + 1, y >= 9 && y <= 11 ? AMB : BRN); setM(5, y, Z0 + 1, BRN); }
box(4, 16, Z0, 5, 16, Z0, CS, true);
box(4, 17, Z0, 5, 17, Z0, SA, true);                                     // olive-tan blank panel
setM(4, 18, Z0, CS);
box(5, 18, Z0, 5, 22, Z0, CS, true);                                     // shoulder edge

// ---- 3. white fins x6 (+2, stepped top) ----------------------------------------------------------------------
box(6, 0, Z0 - 2, 6, 0, Z0, BLK, true);
box(6, 1, Z0 - 2, 6, 21, Z0 - 2, WHT, true);
box(6, 1, Z0 - 1, 6, 22, Z0 - 1, WHT, true);
box(6, 1, Z0, 6, 23, Z0, WHT, true);

// ---- 4. black slots x7 (-1), white fins x8 (flush) -------------------------------------------------------------
air(7, 0, Z0, 7, 14, Z0);
box(7, 0, Z0 + 1, 7, 21, Z0 + 1, BLK, true);
setM(7, 22, Z0, CS); setM(7, 23, Z0, CS);
box(8, 10, Z0, 8, 23, Z0, WHT, true);
box(8, 1, Z0 - 1, 8, 3, Z0, "polished_andesite", true);                   // entrance pilasters, +1
box(8, 0, Z0, 8, 0, Z0, BLK, true);

// ---- 5. centre: base, entrance (x9..17), canopy, marquee --------------------------------------------------------
box(9, 0, Z0, 17, 0, Z0, BLK);
box(9, 1, Z0, 9, 3, Z0, BLK); box(17, 1, Z0, 17, 3, Z0, BLK);
air(10, 0, Z0, 16, 3, Z0 + 1, false);                                    // entrance recess -2
box(10, 0, Z0 + 2, 16, 3, Z0 + 2, "dark_oak_planks");                    // frame wall behind
for (const [x, hinge] of [[11, "left"], [12, "right"], [14, "left"], [15, "right"]]) {
  set(x, 0, Z0 + 2, B.door("dark_oak", "north", "lower", hinge)); set(x, 1, Z0 + 2, B.door("dark_oak", "north", "upper", hinge));
}
set(13, 0, Z0 + 2, BLK); set(13, 1, Z0 + 2, BLK);
box(11, 2, Z0 + 2, 15, 3, Z0 + 2, "black_stained_glass");               // transom: chandeliers glimpsed behind
for (let y = 5; y <= 14; y++) set(13, y, Z0 + 3, B.chain("y"));          // chandelier inside
set(13, 4, Z0 + 3, B.lantern(true));
set(12, 1, Z0 + 3, "glowstone"); set(14, 1, Z0 + 3, "glowstone");
// canopy y4 gold under red nether brick y5, projects +3, x6..20
box(6, 4, 0, 20, 4, Z0 - 1, GOLD); box(8, 4, Z0, 18, 4, Z0, GOLD);
box(6, 5, 0, 20, 5, Z0 - 1, "red_nether_bricks"); box(8, 5, Z0, 18, 5, Z0, "red_nether_bricks");
set(13, 6, 0, GOLD);
// shadow band y6 under the marquee, marquee y7..9 (+2)
box(7, 6, Z0 - 2, 19, 6, Z0, BLK);
for (let x = 7; x <= 19; x++) for (let z = Z0 - 2; z <= Z0; z++) {
  const end = x <= 8 || x >= 18;
  set(x, 7, z, end ? "sea_lantern" : "brown_concrete");
  set(x, 8, z, end ? "sea_lantern" : "glowstone");
  set(x, 9, z, end ? "sea_lantern" : (x % 2 ? "orange_concrete" : "brown_concrete"));
}

// ---- 6. central stained-glass window, recessed -1, white piers x11 & x15 -----------------------------------------
function glassAt(x, y) {
  if ((x === 12 || x === 14) && y >= 12 && y <= 16) return AMB;
  if ((x === 9 || x === 17) && y >= 12 && y <= 14) return AMB;
  return BRN;
}
for (let x = 9; x <= 17; x++) {
  const topY = x >= 12 && x <= 14 ? 19 : 16;
  if (x === 11 || x === 15) { box(x, 10, Z0, x, 21, Z0, WHT); continue; }
  air(x, 10, Z0, x, topY, Z0, false);
  for (let y = 10; y <= topY; y++) set(x, y, Z0 + 1, glassAt(x, y));
}
// white arch zone y17..19 (outer lights), crown y20..29 straight from the trace
for (let y = 17; y <= 19; y++) for (const x of [9, 10, 16, 17]) set(x, y, Z0, WHT);
for (let y = 20; y <= 29; y++) for (let x = 7; x <= 19; x++) {
  if (y > top(x)) continue;
  if ((x <= 8 || x >= 18) && y <= 23) continue;                          // slots, fins, shoulder edges placed above
  const c = cls(x, y);
  const blk = (x === 13 && c === "T") ? GOLD : (CROWN[c] ?? CS);
  set(x, y, y >= 28 ? Z0 + 2 : y >= 24 ? Z0 + 1 : Z0, blk);
}

// ---- 7. side walls: tall recessed slits + dentil cornice ----------------------------------------------------------
if (ROUND >= 2) {
  // side/rear black base course instead of the grey floor line
  for (let z = Z0; z <= D - 1; z++) { setM(1, 0, z, BLK); }
  for (let x = 1; x <= 25; x++) set(x, 0, D - 1, BLK);
  // pilasters (+1) and recessed brown/amber slits on the long side walls, dentil cornice on top
  for (const z0 of [Z0 + 2, Z0 + 8, Z0 + 14, Z0 + 20]) {
    if (z0 + 1 > D - 1) continue;
    box(1, 1, z0, 1, 14, z0 + 1, CS, true);                                  // flush pilasters: front silhouette stays as traced
    setM(0, 15, z0, CS); setM(0, 15, z0 + 1, CS);
  }
  for (const z0 of [Z0 + 4, Z0 + 10, Z0 + 16]) {
    air(1, 4, z0, 1, 11, z0 + 3);                                          // recess -1 (outer skin of a 2-thick wall)
    for (let y = 4; y <= 11; y++) for (let k = 0; k < 4; k++) setM(2, y, z0 + k, (k === 1 || k === 2) && y >= 6 && y <= 9 ? AMB : BRN);
    box(1, 3, z0, 1, 3, z0 + 3, B.slab("smooth_sandstone", "top"), true);   // sill
    box(1, 12, z0, 1, 12, z0 + 3, NAVY, true);                              // lapis head
  }
  for (let z = Z0 + 4; z <= D - 1; z += 2) if (![Z0 + 8, Z0 + 9, Z0 + 14, Z0 + 15, Z0 + 20, Z0 + 21].includes(z) && z !== Z0 + 2 && z !== Z0 + 3)
    setM(0, 15, z, B.stairs("dark_oak", "east", "top"));                  // dentil lip
  // central + side window mullions: blue panes in the wall plane, glass stays recessed
  for (const x of [9, 10, 12, 13, 14, 16, 17]) set(x, 13, Z0, B.pane("blue_stained_glass_pane"));
  for (const x of [12, 13, 14]) set(x, 17, Z0, B.pane("blue_stained_glass_pane"));
  for (const x of [4, 5]) { setM(x, 12, Z0, B.pane("blue_stained_glass_pane")); setM(x, 7, Z0, B.pane("blue_stained_glass_pane")); }
  for (const x of [4, 5]) setM(x, 6, Z0 - 1, B.slab("smooth_sandstone", "top"));   // sill
  // canopy: lipped front edge, stepped red crest behind the gold block
  for (let x = 6; x <= 20; x++) set(x, 5, 0, B.slab("red_nether_brick", "bottom"));
  for (let x = 11; x <= 15; x++) set(x, 6, 1, B.slab("red_nether_brick", "bottom"));
  set(13, 6, 0, GOLD);
  // marquee: diamond lattice by depth (alternate cells recessed 1), dark cap and base
  for (let x = 9; x <= 17; x++) {
    if (x % 2) { set(x, 9, Z0 - 2, "orange_concrete"); set(x, 7, Z0 - 2, "brown_concrete"); }
    else { set(x, 9, Z0 - 2, "air"); set(x, 7, Z0 - 2, "air"); set(x, 9, Z0 - 1, "orange_concrete"); }
  }
  for (let x = 7; x <= 19; x++) { set(x, 10, Z0 - 2, B.slab("dark_oak", "bottom")); set(x, 10, Z0 - 1, B.slab("dark_oak", "bottom")); }
  setM(2, 17, Z0 - 1, B.slab("cut_sandstone", "bottom"));   // cap on the black fin
}

g.save(OUT);
console.log("wrote", OUT, "refused:", g.refused?.length ?? 0);
